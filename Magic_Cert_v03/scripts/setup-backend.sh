#!/bin/bash
# Setup Terraform Remote Backend (S3 + DynamoDB)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/lib/env.sh"

echo "🔧 Setting up Terraform Remote Backend..."
echo ""

cd "$TERRAFORM_DIR"

# Get AWS Account ID
echo "📋 Getting AWS Account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ Could not get AWS Account ID. Check your AWS credentials."
  exit 1
fi

echo "✓ Account ID: $ACCOUNT_ID"
echo ""

# Step 1: Initialize Terraform (local state)
echo "🔧 Step 1: Initializing Terraform with local state..."
terraform init -backend=false

# Step 2: Deploy backend infrastructure
echo ""
echo "🏗️  Step 2: Creating S3 bucket and DynamoDB table for remote state..."
terraform apply -target=aws_s3_bucket.terraform_state \
                -target=aws_s3_bucket_versioning.terraform_state \
                -target=aws_s3_bucket_server_side_encryption_configuration.terraform_state \
                -target=aws_s3_bucket_public_access_block.terraform_state \
                -target=aws_dynamodb_table.terraform_locks \
                -auto-approve

BUCKET_NAME="magic-cert-terraform-state-${ACCOUNT_ID}"
echo ""
echo "✓ Backend infrastructure created:"
echo "  - S3 Bucket: $BUCKET_NAME"
echo "  - DynamoDB Table: magic-cert-terraform-locks"
echo ""

# Step 3: Create local backend config
echo "📝 Step 3: Creating backend.hcl configuration..."
cat > backend.hcl << EOF
bucket         = "${BUCKET_NAME}"
key            = "production/terraform.tfstate"
region         = "${AWS_REGION}"
use_lockfile   = true
encrypt        = true
profile        = "${AWS_PROFILE}"
EOF

echo "✓ Created backend.hcl"
echo ""

# Step 4: Migrate state to S3
echo "🔄 Step 4: Migrating state to S3..."
echo ""
terraform init -backend-config=backend.hcl -migrate-state

echo ""
echo "✅ Remote backend setup complete!"
echo ""
echo "📦 Your Terraform state is now stored in:"
echo "   s3://${BUCKET_NAME}/production/terraform.tfstate"
echo ""
echo "🔒 State locking enabled with DynamoDB table:"
echo "   magic-cert-terraform-locks"
echo ""
echo "🚀 You can now run: terraform apply"
