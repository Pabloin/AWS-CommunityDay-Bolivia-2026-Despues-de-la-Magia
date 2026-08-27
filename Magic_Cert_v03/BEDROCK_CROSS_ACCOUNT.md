# Cross-Account Bedrock Pattern

Magic Cert runs in the application AWS account. Bedrock model access can live in a separate AWS account by letting the Magic Cert Lambda execution role assume a Bedrock invocation role in that account.

## Flow

```text
Browser
  -> API Gateway /ai/explain
  -> Magic Cert ai-practice Lambda
  -> sts:AssumeRole into Bedrock account
  -> bedrock:InvokeModel
```

## 1. Deploy Magic Cert once

Deploy the app stack and get the Lambda execution role ARN:

```bash
cd Magic_Cert_v03/terraform
terraform output -raw lambda_execution_role_arn
```

Use that ARN as `app_lambda_execution_role_arn` in the Bedrock account.

## 2. Create the role in the Bedrock account

Run this Terraform from credentials/profile for the AWS account that has Bedrock model access enabled.

```hcl
variable "app_lambda_execution_role_arn" {
  description = "Magic Cert Lambda execution role ARN from the app account."
  type        = string
}

variable "external_id" {
  description = "Shared external ID required when Magic Cert assumes this role."
  type        = string
  sensitive   = true
}

variable "bedrock_region" {
  description = "Region where Bedrock model access is enabled."
  type        = string
  default     = "us-east-1"
}

resource "aws_iam_role" "magic_cert_bedrock_invoke" {
  name = "MagicCertBedrockInvokeRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = var.app_lambda_execution_role_arn
      }
      Action = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "sts:ExternalId" = var.external_id
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "bedrock_invoke" {
  name = "bedrock-invoke"
  role = aws_iam_role.magic_cert_bedrock_invoke.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ]
      Resource = [
        "arn:aws:bedrock:${var.bedrock_region}:647239283646:inference-profile/*",
        "arn:aws:bedrock:*::foundation-model/*"
      ]
    }]
  })
}

output "bedrock_role_arn" {
  value = aws_iam_role.magic_cert_bedrock_invoke.arn
}
```

## 3. Configure Magic Cert

Set the returned Bedrock role ARN in the Magic Cert app account deployment. The external ID must match the one configured in the Bedrock account role trust policy.

```bash
export TF_VAR_bedrock_role_arn="arn:aws:iam::123456789012:role/MagicCertBedrockInvokeRole"
export TF_VAR_bedrock_role_external_id="replace-with-shared-external-id"
export TF_VAR_bedrock_region="us-east-1"
export TF_VAR_bedrock_model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0"
export TF_VAR_ai_daily_quota_per_user="20"
```

Then redeploy Magic Cert:

```bash
cd Magic_Cert_v03
./scripts/deploy.sh
```

## Notes

- The app account only gets `sts:AssumeRole` on the specific Bedrock role ARN.
- The Bedrock account role only trusts the Magic Cert Lambda execution role.
- `/ai/explain` requires an app JWT and consumes one DynamoDB-backed daily quota unit per successful request validation before invoking Bedrock.
- `BEDROCK_ROLE_ARN` is intentionally not hardcoded in Terraform. Use `TF_VAR_bedrock_role_arn`, `terraform.tfvars`, CI variables, or another secret/config source.
- The AI Lambda supports Amazon Nova model IDs and Anthropic model IDs, including regional inference profiles such as `us.anthropic.claude-haiku-4-5-20251001-v1:0`.
- Claude Haiku 4.5 must be invoked through an inference profile; direct on-demand invocation of its foundation model ID is not supported.
- If `bedrock_role_arn` is empty, `/ai/explain` deploys but returns `BEDROCK_ROLE_NOT_CONFIGURED`.
