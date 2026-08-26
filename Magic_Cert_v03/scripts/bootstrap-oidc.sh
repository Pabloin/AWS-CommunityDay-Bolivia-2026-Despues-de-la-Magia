#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/lib/env.sh"

: "${GITHUB_OWNER:?Set GITHUB_OWNER in .env}"
: "${GITHUB_REPOSITORY:?Set GITHUB_REPOSITORY in .env}"
: "${GITHUB_OWNER_ID:?Set GITHUB_OWNER_ID in .env}"
: "${GITHUB_REPOSITORY_ID:?Set GITHUB_REPOSITORY_ID in .env}"
: "${TF_STATE_BUCKET:?Set TF_STATE_BUCKET in .env}"

BOOTSTRAP_DIR="$TERRAFORM_DIR/bootstrap-oidc"
LOCK_TABLE_ARN="arn:aws:dynamodb:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):table/magic-cert-terraform-locks"

echo "Bootstrapping GitHub Actions OIDC with AWS profile: $AWS_PROFILE"
cd "$BOOTSTRAP_DIR"

if [ -f backend.hcl ]; then
  terraform init -backend-config=backend.hcl
else
  terraform init \
    -backend-config="bucket=$TF_STATE_BUCKET" \
    -backend-config="key=v03/bootstrap-oidc.tfstate" \
    -backend-config="region=$AWS_REGION" \
    -backend-config="dynamodb_table=magic-cert-terraform-locks" \
    -backend-config="encrypt=true"
fi

terraform apply \
  -var="aws_region=$AWS_REGION" \
  -var="github_owner=$GITHUB_OWNER" \
  -var="github_repository=$GITHUB_REPOSITORY" \
  -var="github_owner_id=$GITHUB_OWNER_ID" \
  -var="github_repository_id=$GITHUB_REPOSITORY_ID" \
  -var="github_production_environment=${GITHUB_PRODUCTION_ENVIRONMENT:-production}" \
  -var="tf_state_bucket=$TF_STATE_BUCKET" \
  -var="tf_lock_table_arn=$LOCK_TABLE_ARN"

echo
echo "GitHub Actions roles:"
terraform output
