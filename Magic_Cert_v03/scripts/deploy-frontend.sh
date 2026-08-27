#!/bin/bash
# Deploy Frontend to S3

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
source "$SCRIPT_DIR/lib/env.sh"

echo "🎨 Deploying frontend to S3..."

# Get outputs from Terraform
cd "$PROJECT_ROOT/terraform"
BUCKET_NAME=$(terraform output -raw website_bucket_name 2>/dev/null)
API_URL=$(terraform output -raw api_gateway_url 2>/dev/null)
CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ]; then
  echo "❌ Could not find S3 bucket name. Run terraform apply first."
  exit 1
fi

echo "S3 Bucket: $BUCKET_NAME"
echo "API URL: $API_URL"
echo "CloudFront Distribution: ${CLOUDFRONT_DISTRIBUTION_ID:-not configured}"
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
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete

if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo ""
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" >/dev/null
fi

echo ""
echo "✅ Frontend deployed successfully!"
echo ""
echo "🌐 Website URL: $(terraform -chdir="$PROJECT_ROOT/terraform" output -raw website_url 2>/dev/null || echo "https://$BUCKET_NAME")"
