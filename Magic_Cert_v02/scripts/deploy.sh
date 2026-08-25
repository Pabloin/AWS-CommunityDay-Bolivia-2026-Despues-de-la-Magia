#!/bin/bash
# Deploy Magic Cert v02 Infrastructure

set -e

export AWS_PROFILE=magic-account
export AWS_REGION=us-east-1

echo "🚀 Deploying Magic Cert v02..."
echo "AWS Profile: $AWS_PROFILE"
echo "AWS Region: $AWS_REGION"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Step 1: Build Lambda functions
echo "📦 Step 1: Building Lambda functions..."
bash "$SCRIPT_DIR/build-lambda-functions.sh"

# Step 2: Initialize Terraform
echo ""
echo "🔧 Step 2: Initializing Terraform..."
cd "$TERRAFORM_DIR"
terraform init

# Step 3: Plan
echo ""
echo "📋 Step 3: Planning infrastructure changes..."
terraform plan -out=tfplan

# Step 4: Ask for confirmation
echo ""
read -p "🤔 Do you want to apply these changes? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 0
fi

# Step 5: Apply
echo ""
echo "🏗️  Step 4: Applying infrastructure..."
terraform apply tfplan

# Step 6: Save outputs
echo ""
echo "💾 Step 5: Saving outputs..."
terraform output -json > "$PROJECT_ROOT/terraform-outputs.json"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 View outputs:"
terraform output

echo ""
echo "📝 Next steps:"
echo "  1. Seed questions: ./scripts/seed-questions.sh"
echo "  2. Deploy frontend: ./scripts/deploy-frontend.sh"
echo ""
