#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

APP_PROFILE="${AWS_PROFILE:-magic-account}"
BEDROCK_TEST_PROFILE="${BEDROCK_TEST_PROFILE:-}"
BEDROCK_ROLE_ARN="${BEDROCK_ROLE_ARN:?Set BEDROCK_ROLE_ARN to the cross-account role ARN}"
BEDROCK_EXTERNAL_ID="${BEDROCK_EXTERNAL_ID:?Set BEDROCK_EXTERNAL_ID to the role ExternalId}"
BEDROCK_REGION="${BEDROCK_REGION:-us-east-1}"
BEDROCK_MODEL_ID="${BEDROCK_MODEL_ID:-us.anthropic.claude-haiku-4-5-20251001-v1:0}"

echo "Testing Bedrock cross-account access..."
echo "App profile: $APP_PROFILE"
echo "Model: $BEDROCK_MODEL_ID"
echo "Region: $BEDROCK_REGION"

PAYLOAD_FILE="$(mktemp)"
OUTPUT_FILE="$(mktemp)"
trap 'rm -f "$PAYLOAD_FILE" "$OUTPUT_FILE"' EXIT

if [[ "$BEDROCK_MODEL_ID" == *"anthropic."* ]]; then
  printf '%s' '{"anthropic_version":"bedrock-2023-05-31","max_tokens":32,"temperature":0,"messages":[{"role":"user","content":"Reply with exactly: Bedrock preflight OK"}]}' > "$PAYLOAD_FILE"
else
  printf '%s' '{"messages":[{"role":"user","content":[{"text":"Reply with exactly: Bedrock preflight OK"}]}],"inferenceConfig":{"max_new_tokens":32,"temperature":0}}' > "$PAYLOAD_FILE"
fi

if [ -n "$BEDROCK_TEST_PROFILE" ]; then
  echo "Direct Bedrock profile: $BEDROCK_TEST_PROFILE"
  INVOKE=(aws bedrock-runtime invoke-model --profile "$BEDROCK_TEST_PROFILE")
else
  if ! CREDENTIALS=$(aws sts assume-role \
    --profile "$APP_PROFILE" \
    --role-arn "$BEDROCK_ROLE_ARN" \
    --role-session-name magic-cert-preflight \
    --external-id "$BEDROCK_EXTERNAL_ID" \
    --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
    --output text); then
    echo "Bedrock preflight FAILED: caller cannot assume the role directly." >&2
    echo "Use BEDROCK_TEST_PROFILE for a direct quota/model test; the production trust is Lambda-only." >&2
    exit 1
  fi

  read -r ACCESS_KEY SECRET_KEY SESSION_TOKEN <<< "$CREDENTIALS"
  INVOKE=(env "AWS_ACCESS_KEY_ID=$ACCESS_KEY" "AWS_SECRET_ACCESS_KEY=$SECRET_KEY" "AWS_SESSION_TOKEN=$SESSION_TOKEN" aws bedrock-runtime invoke-model)
fi

if "${INVOKE[@]}" \
    --region "$BEDROCK_REGION" \
    --model-id "$BEDROCK_MODEL_ID" \
    --content-type application/json \
    --accept application/json \
    --body "fileb://$PAYLOAD_FILE" \
    "$OUTPUT_FILE" >/dev/null; then
  echo "Bedrock preflight OK"
  node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(process.argv[1], "utf8")); console.log(p.output?.message?.content?.[0]?.text || "Response received")' "$OUTPUT_FILE"
else
  echo "Bedrock preflight FAILED" >&2
  exit 1
fi
