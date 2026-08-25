#!/bin/bash
# Deploy Frontend to S3

set -e

export AWS_PROFILE=magic-account

echo "🎨 Deploying frontend to S3..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/../Magic_Cert_v01"

# Get outputs from Terraform
cd "$PROJECT_ROOT/terraform"
BUCKET_NAME=$(terraform output -raw website_bucket_name 2>/dev/null)
API_URL=$(terraform output -raw api_gateway_url 2>/dev/null)

if [ -z "$BUCKET_NAME" ]; then
  echo "❌ Could not find S3 bucket name. Run terraform apply first."
  exit 1
fi

echo "S3 Bucket: $BUCKET_NAME"
echo "API URL: $API_URL"
echo ""

# Build frontend
echo "📦 Building frontend..."
cd "$FRONTEND_DIR"

# Create .env file with API URL
cat > .env.production << EOF
VITE_API_URL=$API_URL
EOF

echo "Created .env.production with API_URL=$API_URL"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build
echo "Building..."
npm run build

# Deploy to S3
echo ""
echo "☁️  Uploading to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete --profile magic-account

echo ""
echo "✅ Frontend deployed successfully!"
echo ""
echo "🌐 Website URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
