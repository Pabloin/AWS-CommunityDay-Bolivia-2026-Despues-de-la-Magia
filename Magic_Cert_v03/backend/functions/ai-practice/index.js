const { BedrockRuntimeClient, ConverseCommand, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const jwt = require('jsonwebtoken');

const BEDROCK_ROLE_ARN = process.env.BEDROCK_ROLE_ARN || '';
const BEDROCK_EXTERNAL_ID = process.env.BEDROCK_EXTERNAL_ID || '';
const BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
const JWT_SECRET_ARN = process.env.JWT_SECRET_ARN || '';
const AI_USAGE_TABLE = process.env.AI_USAGE_TABLE || '';
const AI_DAILY_QUOTA = parseInt(process.env.AI_DAILY_QUOTA || '20', 10);

const dynamoClient = new DynamoDBClient({});
const secretsClient = new SecretsManagerClient({});
let jwtSecret = null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}

function parseBody(event) {
  if (!event.body) {
    return {};
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  return JSON.parse(rawBody);
}

function buildPrompt(payload) {
  const question = payload.question || {};
  const selectedAnswers = Array.isArray(payload.selectedAnswers) ? payload.selectedAnswers : [];
  const correctAnswers = Array.isArray(payload.correctAnswers) ? payload.correctAnswers : [];
  const options = Array.isArray(question.options) ? question.options : [];

  const optionLines = options.map((option, index) => {
    if (typeof option === 'string') {
      return `${index + 1}. ${option}`;
    }

    return `${option.id || index + 1}. ${option.text || JSON.stringify(option)}`;
  });

  return `You are an AWS certification instructor.
Explain this quiz result after the student has already answered.
Be concise, practical, and educational. Do not invent AWS facts.

Certification: ${question.certification || 'AWS'}
Domain: ${question.domainName || question.domain || question.category || 'Unknown'}

Question:
${question.question || question.question_text || ''}

Options:
${optionLines.join('\n') || 'No options provided'}

Student selected:
${selectedAnswers.length ? selectedAnswers.join('\n') : 'No answer selected'}

Correct answer:
${correctAnswers.length ? correctAnswers.join('\n') : question.correctAnswer || 'Not provided'}

Existing explanation:
${payload.explanation || question.explanation || 'Not provided'}

Return:
- Why the correct answer is correct
- Why the selected answer is correct or wrong
- A short memory tip
- One similar AWS scenario`;
}

function getBearerToken(event) {
  const authorization = event.headers?.Authorization || event.headers?.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

async function getJwtSecret() {
  if (jwtSecret) {
    return jwtSecret;
  }

  if (!JWT_SECRET_ARN) {
    throw Object.assign(new Error('JWT_SECRET_ARN is not configured'), {
      statusCode: 500,
      code: 'JWT_SECRET_NOT_CONFIGURED'
    });
  }

  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: JWT_SECRET_ARN })
  );
  const secret = JSON.parse(response.SecretString);
  jwtSecret = secret.secret;
  return jwtSecret;
}

async function verifyRequest(event) {
  const token = getBearerToken(event);

  if (!token) {
    throw Object.assign(new Error('Authorization bearer token is required'), {
      statusCode: 401,
      code: 'AUTH_TOKEN_REQUIRED'
    });
  }

  try {
    return jwt.verify(token, await getJwtSecret());
  } catch (error) {
    throw Object.assign(new Error('Invalid authorization token'), {
      statusCode: 401,
      code: 'INVALID_AUTH_TOKEN'
    });
  }
}

function secondsUntilTomorrowUtc() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0
  ));

  return Math.floor(tomorrow.getTime() / 1000);
}

async function consumeDailyQuota(user) {
  if (!AI_USAGE_TABLE) {
    throw Object.assign(new Error('AI_USAGE_TABLE is not configured'), {
      statusCode: 500,
      code: 'AI_USAGE_TABLE_NOT_CONFIGURED'
    });
  }

  const userId = user.userId || user.email;
  const day = new Date().toISOString().slice(0, 10);

  try {
    const response = await dynamoClient.send(new UpdateItemCommand({
      TableName: AI_USAGE_TABLE,
      Key: {
        PK: { S: `USER#${userId}` },
        SK: { S: `DAY#${day}` }
      },
      UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :one, #ttl = :ttl',
      ConditionExpression: 'attribute_not_exists(#count) OR #count < :quota',
      ExpressionAttributeNames: {
        '#count': 'count',
        '#ttl': 'ttl'
      },
      ExpressionAttributeValues: {
        ':zero': { N: '0' },
        ':one': { N: '1' },
        ':quota': { N: String(AI_DAILY_QUOTA) },
        ':ttl': { N: String(secondsUntilTomorrowUtc()) }
      },
      ReturnValues: 'UPDATED_NEW'
    }));

    return Number(response.Attributes?.count?.N || '0');
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw Object.assign(new Error(`Daily AI explanation quota exceeded (${AI_DAILY_QUOTA} per user)`), {
        statusCode: 429,
        code: 'AI_DAILY_QUOTA_EXCEEDED'
      });
    }

    throw error;
  }
}

async function assumeBedrockRole() {
  if (!BEDROCK_ROLE_ARN) {
    return null;
  }

  const sts = new STSClient({});
  const input = {
    RoleArn: BEDROCK_ROLE_ARN,
    RoleSessionName: `magic-cert-bedrock-${Date.now()}`
  };

  if (BEDROCK_EXTERNAL_ID) {
    input.ExternalId = BEDROCK_EXTERNAL_ID;
  }

  const response = await sts.send(new AssumeRoleCommand(input));
  const credentials = response.Credentials;

  if (!credentials) {
    throw new Error('STS did not return credentials for the Bedrock role');
  }

  return {
    accessKeyId: credentials.AccessKeyId,
    secretAccessKey: credentials.SecretAccessKey,
    sessionToken: credentials.SessionToken,
    expiration: credentials.Expiration
  };
}

function getModelProvider() {
  // Inference profile IDs can be prefixed with global., us., eu., or apac.
  const providerModelId = BEDROCK_MODEL_ID.replace(/^(global|us|eu|apac)\./, '');

  if (providerModelId.startsWith('amazon.nova')) {
    return 'nova';
  }

  if (providerModelId.startsWith('anthropic.')) {
    return 'anthropic';
  }

  throw Object.assign(new Error(`Unsupported Bedrock model provider for ${BEDROCK_MODEL_ID}`), {
    statusCode: 400,
    code: 'UNSUPPORTED_BEDROCK_PROVIDER'
  });
}

function buildBedrockBody(prompt) {
  const provider = getModelProvider();

  if (provider === 'nova') {
    return {
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }]
        }
      ],
      inferenceConfig: {
        max_new_tokens: 400,
        temperature: 0.2
      }
    };
  }

  return {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 400,
    temperature: 0.2,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };
}

function extractBedrockText(payload) {
  const provider = getModelProvider();

  if (provider === 'nova') {
    return payload.output?.message?.content?.[0]?.text || 'No explanation was generated.';
  }

  return payload.content?.[0]?.text || 'No explanation was generated.';
}

async function invokeBedrock(prompt) {
  const credentials = await assumeBedrockRole();
  const bedrockConfig = { region: BEDROCK_REGION };
  if (credentials) {
    bedrockConfig.credentials = credentials;
  }
  const bedrock = new BedrockRuntimeClient(bedrockConfig);

  if (getModelProvider() === 'anthropic') {
    const response = await bedrock.send(new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      messages: [{
        role: 'user',
        content: [{ text: prompt }]
      }],
      inferenceConfig: {
        maxTokens: 400,
        temperature: 0.2
      }
    }));

    return response.output?.message?.content?.[0]?.text || 'No explanation was generated.';
  }

  const response = await bedrock.send(new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(buildBedrockBody(prompt))
  }));

  const payload = JSON.parse(Buffer.from(response.body).toString('utf8'));
  return extractBedrockText(payload);
}

function errorResponse(error) {
  if (error.statusCode) {
    return json(error.statusCode, {
      success: false,
      error: error.code || 'AI_ENDPOINT_ERROR',
      message: error.message
    });
  }

  if (error.name === 'AccessDeniedException') {
    return json(403, {
      success: false,
      error: 'BEDROCK_ACCESS_DENIED',
      message: 'Bedrock denied access. Check the cross-account role trust policy, model access, and InvokeModel permissions.'
    });
  }

  if (error.name === 'ValidationException' || error.name === 'ResourceNotFoundException') {
    return json(400, {
      success: false,
      error: 'BEDROCK_MODEL_NOT_AVAILABLE',
      message: 'The configured Bedrock model is not available in the Bedrock account or region.'
    });
  }

  if (error.name === 'ThrottlingException') {
    return json(429, {
      success: false,
      error: 'BEDROCK_THROTTLED',
      message: 'Amazon Bedrock reached its token quota. Please try again after the quota resets or request a quota increase.'
    });
  }

  console.error('Unhandled AI error:', {
    name: error.name,
    code: error.code,
    message: error.message,
    requestId: error.$metadata?.requestId
  });
  return json(500, {
    success: false,
    error: 'AI_EXPLANATION_FAILED',
    message: error.message
  });
}

exports.handler = async (event) => {
  console.log('AI request received:', {
    method: event.httpMethod,
    path: event.path,
    requestId: event.requestContext?.requestId,
    hasAuthorization: Boolean(getBearerToken(event))
  });

  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  try {
    const user = await verifyRequest(event);
    const payload = parseBody(event);

    if (!payload.question) {
      return json(400, {
        success: false,
        error: 'QUESTION_REQUIRED',
        message: 'Request body must include a question object.'
      });
    }

    const dailyUsage = await consumeDailyQuota(user);
    const explanation = await invokeBedrock(buildPrompt(payload));

    return json(200, {
      success: true,
      explanation,
      quota: {
        used: dailyUsage,
        limit: AI_DAILY_QUOTA
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
};
