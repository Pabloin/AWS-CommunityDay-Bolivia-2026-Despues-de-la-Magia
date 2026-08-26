// User Progress Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({});

const PROGRESS_TABLE = process.env.PROGRESS_TABLE;
const JWT_SECRET_ARN = process.env.JWT_SECRET_ARN;

let jwtSecret = null;

// Get JWT secret from Secrets Manager
async function getJwtSecret() {
  if (jwtSecret) return jwtSecret;
  
  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: JWT_SECRET_ARN })
    );
    const secret = JSON.parse(response.SecretString);
    jwtSecret = secret.secret;
    return jwtSecret;
  } catch (error) {
    console.error('Error fetching JWT secret:', error);
    throw error;
  }
}

// Verify JWT token
async function verifyToken(token) {
  const secret = await getJwtSecret();
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Save quiz attempt
async function saveProgress(userId, attemptData) {
  const attemptId = uuidv4();
  const now = new Date().toISOString();
  
  const attempt = {
    PK: `USER#${userId}`,
    SK: `ATTEMPT#${now}`,
    attemptId,
    userId,
    certification: attemptData.certification || 'SAA-C03',
    dataset: attemptData.dataset || 'extended',
    domain: attemptData.domain || 'all',
    totalQuestions: attemptData.totalQuestions || 0,
    correctAnswers: attemptData.correctAnswers || 0,
    score: attemptData.score || 0,
    answers: attemptData.answers || [],
    startedAt: attemptData.startedAt || now,
    completedAt: now,
    durationSeconds: attemptData.durationSeconds || 0
  };
  
  await docClient.send(new PutCommand({
    TableName: PROGRESS_TABLE,
    Item: attempt
  }));
  
  return attempt;
}

// Get user progress history
async function getProgress(userId, limit = 20) {
  const params = {
    TableName: PROGRESS_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'ATTEMPT#'
    },
    ScanIndexForward: false,  // Most recent first
    Limit: limit
  };
  
  const result = await docClient.send(new QueryCommand(params));
  
  return result.Items || [];
}

// Get statistics
async function getStatistics(userId) {
  const attempts = await getProgress(userId, 100);
  
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      totalQuestions: 0,
      totalCorrect: 0
    };
  }
  
  const totalAttempts = attempts.length;
  const totalScore = attempts.reduce((sum, att) => sum + att.score, 0);
  const averageScore = Math.round(totalScore / totalAttempts);
  const bestScore = Math.max(...attempts.map(att => att.score));
  const totalQuestions = attempts.reduce((sum, att) => sum + att.totalQuestions, 0);
  const totalCorrect = attempts.reduce((sum, att) => sum + att.correctAnswers, 0);
  
  // Domain stats
  const domainStats = {};
  attempts.forEach(att => {
    const domain = att.domain || 'all';
    if (!domainStats[domain]) {
      domainStats[domain] = {
        attempts: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageScore: 0
      };
    }
    domainStats[domain].attempts++;
    domainStats[domain].totalQuestions += att.totalQuestions;
    domainStats[domain].totalCorrect += att.correctAnswers;
  });
  
  // Calculate average scores per domain
  Object.keys(domainStats).forEach(domain => {
    const stats = domainStats[domain];
    stats.averageScore = stats.totalQuestions > 0 
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
      : 0;
  });
  
  return {
    totalAttempts,
    averageScore,
    bestScore,
    totalQuestions,
    totalCorrect,
    domainStats
  };
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get token from headers
    const token = event.headers?.Authorization?.replace('Bearer ', '') ||
                  event.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'No token provided'
        })
      };
    }
    
    // Verify token
    const decoded = await verifyToken(token);
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;
    const queryParams = event.queryStringParameters || {};
    
    let result;
    
    if (httpMethod === 'GET') {
      if (queryParams.stats === 'true') {
        result = await getStatistics(decoded.userId);
      } else {
        const limit = parseInt(queryParams.limit || '20');
        const history = await getProgress(decoded.userId, limit);
        result = { history };
      }
    } else if (httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const attempt = await saveProgress(decoded.userId, body);
      result = { attempt };
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        ...result
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    const statusCode = error.message === 'Invalid token' ? 401 : 500;
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
