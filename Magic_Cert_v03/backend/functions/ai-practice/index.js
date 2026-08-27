const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');

const BEDROCK_ROLE_ARN = process.env.BEDROCK_ROLE_ARN || '';
const BEDROCK_EXTERNAL_ID = process.env.BEDROCK_EXTERNAL_ID || '';
const BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

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

async function assumeBedrockRole() {
  if (!BEDROCK_ROLE_ARN) {
    throw Object.assign(new Error('BEDROCK_ROLE_ARN is not configured'), {
      statusCode: 501,
      code: 'BEDROCK_ROLE_NOT_CONFIGURED'
    });
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

async function invokeBedrock(prompt) {
  const credentials = await assumeBedrockRole();
  const bedrock = new BedrockRuntimeClient({
    region: BEDROCK_REGION,
    credentials
  });

  const response = await bedrock.send(new ConverseCommand({
    modelId: BEDROCK_MODEL_ID,
    messages: [{
      role: 'user',
      content: [{ text: prompt }]
    }],
    inferenceConfig: {
      maxTokens: 700,
      temperature: 0.2
    }
  }));

  return response.output?.message?.content?.[0]?.text || 'No explanation was generated.';
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

  console.error('Unhandled AI error:', error);
  return json(500, {
    success: false,
    error: 'AI_EXPLANATION_FAILED',
    message: error.message
  });
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  try {
    const payload = parseBody(event);

    if (!payload.question) {
      return json(400, {
        success: false,
        error: 'QUESTION_REQUIRED',
        message: 'Request body must include a question object.'
      });
    }

    const explanation = await invokeBedrock(buildPrompt(payload));

    return json(200, {
      success: true,
      explanation
    });
  } catch (error) {
    return errorResponse(error);
  }
};
