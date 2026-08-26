// User Profile Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const jwt = require('jsonwebtoken');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({});

const USERS_TABLE = process.env.USERS_TABLE;
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

// Get user profile
async function getUserProfile(email) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${email}`,
      SK: 'PROFILE'
    }
  };
  
  const result = await docClient.send(new GetCommand(params));
  
  if (!result.Item) {
    throw new Error('User not found');
  }
  
  const user = result.Item;
  
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    registeredAt: user.registeredAt,
    lastLoginAt: user.lastLoginAt,
    preferences: user.preferences || {}
  };
}

// Update user profile
async function updateUserProfile(email, updates) {
  // Get current profile
  const params = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${email}`,
      SK: 'PROFILE'
    }
  };
  
  const result = await docClient.send(new GetCommand(params));
  
  if (!result.Item) {
    throw new Error('User not found');
  }
  
  const user = result.Item;
  
  // Update allowed fields
  if (updates.name) user.name = updates.name;
  if (updates.preferences) {
    user.preferences = { ...user.preferences, ...updates.preferences };
  }
  
  // Save updated profile
  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: user
  }));
  
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    preferences: user.preferences
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
    
    let result;
    
    if (httpMethod === 'GET') {
      result = await getUserProfile(decoded.email);
    } else if (httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      result = await updateUserProfile(decoded.email, body);
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
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        profile: result
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    const statusCode = error.message === 'Invalid token' ? 401 :
                       error.message === 'User not found' ? 404 : 500;
    
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
