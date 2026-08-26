#!/bin/bash
# Deploy Magic Cert v02 Infrastructure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/lib/env.sh"

echo "🚀 Deploying Magic Cert v02..."
echo "AWS Profile: $AWS_PROFILE"
echo "AWS Region: $AWS_REGION"
echo ""

# Step 1: Initialize Terraform
echo ""
echo "🔧 Step 1: Initializing Terraform..."
cd "$TERRAFORM_DIR"
if [ -f backend.hcl ]; then
  terraform init -backend-config=backend.hcl
else
  terraform init
fi

# Step 2: Plan
echo ""
echo "📋 Step 2: Planning infrastructure changes..."
terraform plan -out=tfplan

# Step 3: Ask for confirmation
echo ""
read -p "🤔 Do you want to apply these changes? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 0
fi

# Step 4: Apply
echo ""
echo "🏗️  Step 4: Applying infrastructure..."
terraform apply tfplan

# Step 5: Save outputs
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
