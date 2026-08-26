#!/bin/bash
# Destroy Magic Cert v02 Infrastructure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/lib/env.sh"

echo "🔥 Destroying Magic Cert v02 Infrastructure"
echo ""
echo "⚠️  WARNING: This will delete all resources including:"
echo "  - S3 buckets and all files"
echo "  - DynamoDB tables and all data"
echo "  - Lambda functions"
echo "  - API Gateway"
echo "  - CloudWatch logs and dashboards"
echo ""

read -p "Are you ABSOLUTELY sure? Type 'destroy' to confirm: " CONFIRM

if [ "$CONFIRM" != "destroy" ]; then
  echo "❌ Destruction cancelled"
  exit 0
fi

cd "$TERRAFORM_DIR"

# Get bucket name before destroying
BUCKET_NAME=$(terraform output -raw website_bucket_name 2>/dev/null || echo "")

# Empty S3 bucket first (terraform can't destroy non-empty buckets)
if [ -n "$BUCKET_NAME" ]; then
  echo "🗑️  Emptying S3 bucket: $BUCKET_NAME"
  aws s3 rm "s3://$BUCKET_NAME" --recursive 2>/dev/null || true
fi

echo ""
echo "🔧 Running terraform destroy..."
terraform destroy -auto-approve

echo ""
echo "✅ All resources destroyed!"
