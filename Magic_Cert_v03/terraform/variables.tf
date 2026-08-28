# Magic Cert v02 - Terraform Variables

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "magic-cert-v03"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "deployment_id" {
  description = "Optional deployment identifier appended to resource names to run multiple isolated copies of this stack."
  type        = string
  default     = ""

  validation {
    condition     = can(regex("^[a-z0-9-]*$", var.deployment_id))
    error_message = "deployment_id must be empty or contain only lowercase letters, numbers, and hyphens."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "custom_domain_name" {
  description = "Optional custom domain for the frontend CloudFront distribution."
  type        = string
  default     = "cert.magic.glaciar.org"
}

variable "additional_domain_names" {
  description = "Additional HTTPS aliases for the frontend CloudFront distribution."
  type        = list(string)
  default     = []
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone name used to validate ACM and create the frontend alias record."
  type        = string
  default     = "magic.glaciar.org"
}

variable "owner" {
  description = "Resource owner (GitHub username)"
  type        = string
  default     = "@pablo-ezequiel-inchausti"
}

variable "repository_url" {
  description = "GitHub repository URL"
  type        = string
  default     = "github.com/Pabloin/AWS-CommunityDay-Bolivia-2026-Despues-de-la-Magia"
}

variable "alert_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  default     = ""
}

variable "bedrock_role_arn" {
  description = "Cross-account IAM role ARN to assume before invoking Amazon Bedrock. Leave empty to disable AI endpoints."
  type        = string
  default     = ""
}

variable "bedrock_role_external_id" {
  description = "Optional external ID required by the cross-account Bedrock role trust policy."
  type        = string
  default     = ""
  sensitive   = true
}

variable "bedrock_region" {
  description = "AWS region where Bedrock model access is enabled in the Bedrock account."
  type        = string
  default     = "us-east-1"
}

variable "bedrock_model_id" {
  description = "Amazon Bedrock model ID used by Magic Cert AI endpoints."
  type        = string
  default     = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
}

variable "ai_daily_quota_per_user" {
  description = "Maximum number of AI explanations allowed per authenticated user per UTC day."
  type        = number
  default     = 20
}

variable "api_throttling_rate_limit" {
  description = "Steady-state API Gateway stage throttling rate limit in requests per second."
  type        = number
  default     = 10
}

variable "api_throttling_burst_limit" {
  description = "Short burst API Gateway stage throttling limit in requests."
  type        = number
  default     = 20
}
