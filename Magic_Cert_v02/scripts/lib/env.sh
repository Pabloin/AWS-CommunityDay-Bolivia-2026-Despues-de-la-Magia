#!/bin/bash
# Shared environment bootstrap for Magic Cert v02 scripts.

if [ -z "${PROJECT_ROOT:-}" ]; then
  echo "PROJECT_ROOT must be set before sourcing scripts/lib/env.sh"
  exit 1
fi

ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/.env}"

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

: "${AWS_PROFILE:?Set AWS_PROFILE or create Magic_Cert_v02/.env}"
export AWS_PROFILE
export AWS_REGION="${AWS_REGION:-us-east-1}"
export TERRAFORM_DIR="${TERRAFORM_DIR:-$PROJECT_ROOT/terraform}"
