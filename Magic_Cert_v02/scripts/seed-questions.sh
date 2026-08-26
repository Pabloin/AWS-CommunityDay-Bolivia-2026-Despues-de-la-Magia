#!/bin/bash
# Seed Questions to DynamoDB

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/lib/env.sh"

echo "🌱 Seeding questions to DynamoDB..."

# Get table name from Terraform output
TABLE_NAME=$(cd "$PROJECT_ROOT/terraform" && terraform output -raw questions_table_name 2>/dev/null)

if [ -z "$TABLE_NAME" ]; then
  echo "❌ Could not find questions table name. Run terraform apply first."
  exit 1
fi

echo "Table: $TABLE_NAME"
echo ""

# Source data files (in scripts/seed-data)
BASIC_QUESTIONS="$SCRIPT_DIR/seed-data/saa-c03-questions.json"
EXTENDED_QUESTIONS="$SCRIPT_DIR/seed-data/saa-c03-questions-extended.json"

# Create seed script
cat > /tmp/seed-questions.js << 'SEEDSCRIPT'
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.argv[2];
const basicFile = process.argv[3];
const extendedFile = process.argv[4];

function loadQuestions(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.questions)) {
    return data.questions;
  }

  throw new Error(`Unsupported question file format: ${filePath}`);
}

function getCorrectAnswers(question) {
  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer;
  }
  if (question.correctAnswer) {
    return [question.correctAnswer];
  }
  if (Array.isArray(question.correctAnswers)) {
    return question.correctAnswers;
  }
  if (Array.isArray(question.options)) {
    return question.options
      .filter(option => option.isCorrect)
      .map(option => option.id);
  }

  return [];
}

async function seedQuestions() {
  console.log('Loading questions...');
  
  let allQuestions = [];
  
  // Load basic questions
  const basic = loadQuestions(basicFile);
  allQuestions = allQuestions.concat(basic);
  console.log(`Loaded ${basic.length} basic questions`);
  
  // Load extended questions
  const extended = loadQuestions(extendedFile);
  allQuestions = allQuestions.concat(extended);
  console.log(`Loaded ${extended.length} extended questions`);
  
  console.log(`Total questions to seed: ${allQuestions.length}`);
  console.log('');
  
  // Transform questions for DynamoDB
  const items = allQuestions.map(q => ({
    PK: `QUESTION#${q.certification || 'SAA-C03'}#${q.id}`,
    SK: 'METADATA',
    certification: q.certification || 'SAA-C03',
    questionId: q.id,
    domain: q.domain || 'general',
    domainName: q.domainName || 'General',
    category: q.category || 'General',
    subcategory: q.subcategory || '',
    difficulty: q.difficulty || 'medium',
    question: q.question,
    options: q.options,
    correctAnswers: getCorrectAnswers(q),
    explanation: q.explanation || '',
    references: q.references || [],
    tags: q.tags || [],
    createdAt: new Date().toISOString(),
    version: 1
  }));
  
  // Batch write (25 items at a time)
  console.log('Writing to DynamoDB...');
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    
    const params = {
      RequestItems: {
        [tableName]: batch.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    };
    
    await docClient.send(new BatchWriteCommand(params));
    console.log(`  Wrote ${Math.min(i + 25, items.length)}/${items.length} questions`);
  }
  
  console.log('');
  console.log('✅ All questions seeded successfully!');
}

seedQuestions().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
SEEDSCRIPT

# Install dependencies and run
echo "Installing dependencies..."
cd /tmp
npm install --silent @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

echo ""
echo "Seeding questions..."
node /tmp/seed-questions.js "$TABLE_NAME" "$BASIC_QUESTIONS" "$EXTENDED_QUESTIONS"

# Cleanup
rm /tmp/seed-questions.js

echo ""
echo "✅ Questions seeded successfully!"
