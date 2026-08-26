// Questions Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.QUESTIONS_TABLE;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const certification = queryParams.certification || 'SAA-C03';
    const domain = queryParams.domain || 'all';
    const count = parseInt(queryParams.count || '5');
    
    console.log('Query params:', { certification, domain, count });
    
    let questions = [];
    
    // Scan all questions (simple approach for demo)
    const params = {
      TableName: TABLE_NAME
    };
    
    const result = await docClient.send(new ScanCommand(params));
    questions = result.Items || [];
    
    // Shuffle and limit questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    
    console.log(`Found ${questions.length} questions, returning ${selected.length}`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        questions: selected,
        total: questions.length,
        returned: selected.length
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch questions',
        message: error.message
      })
    };
  }
};
