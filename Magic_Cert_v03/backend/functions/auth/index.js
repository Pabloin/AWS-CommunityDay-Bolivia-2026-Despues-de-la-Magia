// Authentication Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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

// Register new user
async function registerUser(email, password, name) {
  // Check if user exists
  const checkParams = {
    TableName: USERS_TABLE,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  };
  
  const existingUser = await docClient.send(new QueryCommand(checkParams));
  
  if (existingUser.Items && existingUser.Items.length > 0) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  const now = new Date().toISOString();
  
  // Create user
  const user = {
    PK: `USER#${email}`,
    SK: 'PROFILE',
    userId,
    email,
    passwordHash,
    name: name || email.split('@')[0],
    registeredAt: now,
    lastLoginAt: now,
    accountType: 'registered',
    preferences: {
      defaultDataset: 'extended',
      defaultQuestionCount: 5
    }
  };
  
  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: user
  }));
  
  // Generate JWT
  const secret = await getJwtSecret();
  const token = jwt.sign(
    { userId, email, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
  
  return {
    user: {
      userId,
      email,
      name: user.name,
      registeredAt: now
    },
    token
  };
}

// Login user
async function loginUser(email, password) {
  // Get user
  const params = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${email}`,
      SK: 'PROFILE'
    }
  };
  
  const result = await docClient.send(new GetCommand(params));
  
  if (!result.Item) {
    throw new Error('Invalid credentials');
  }
  
  const user = result.Item;
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  // Update last login
  const now = new Date().toISOString();
  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: {
      ...user,
      lastLoginAt: now
    }
  }));
  
  // Generate JWT
  const secret = await getJwtSecret();
  const token = jwt.sign(
    { userId: user.userId, email: user.email, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
  
  return {
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      registeredAt: user.registeredAt
    },
    token
  };
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const path = event.path || event.requestContext?.path || '';
    const body = JSON.parse(event.body || '{}');
    
    let result;
    
    if (path.includes('/register')) {
      const { email, password, name } = body;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Email and password are required'
          })
        };
      }
      
      result = await registerUser(email, password, name);
      
    } else if (path.includes('/login')) {
      const { email, password } = body;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Email and password are required'
          })
        };
      }
      
      result = await loginUser(email, password);
      
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Not found'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        ...result
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    const statusCode = error.message === 'User already exists' ? 409 :
                       error.message === 'Invalid credentials' ? 401 : 500;
    
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
