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

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
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
  default     = "amazon.nova-lite-v1:0"
}
