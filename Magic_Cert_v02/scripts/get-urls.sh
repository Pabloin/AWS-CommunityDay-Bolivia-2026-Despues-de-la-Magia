#!/bin/bash
# Print deployment URLs from Terraform outputs.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/lib/env.sh"

cd "$TERRAFORM_DIR"

echo "🎉 Magic Cert v02 - Deployment URLs"
echo "===================================="
echo ""

echo "📱 Frontend (Website):"
terraform output -raw website_url 2>/dev/null && echo "" || echo "  (checking...)"
echo ""

echo "🔌 Backend API:"
terraform output -raw api_gateway_url 2>/dev/null && echo "" || echo "  (checking...)"
echo ""

echo "📊 CloudWatch Dashboard:"
terraform output -raw cloudwatch_dashboard_url 2>/dev/null && echo "" || echo "  (checking...)"
echo ""

echo "🏷️  Resource Group (View all resources):"
terraform output -raw resource_group_url 2>/dev/null && echo "" || echo "  (checking...)"
echo ""

echo "📝 Tag Editor:"
terraform output -raw tag_editor_url 2>/dev/null && echo "" || echo "  (checking...)"
echo ""

echo "===================================="
echo ""
echo "✅ Quick Test API:"
API_URL=$(terraform output -raw api_gateway_url 2>/dev/null)
if [ -n "$API_URL" ]; then
  echo "curl \"$API_URL/questions?count=3\""
fi
