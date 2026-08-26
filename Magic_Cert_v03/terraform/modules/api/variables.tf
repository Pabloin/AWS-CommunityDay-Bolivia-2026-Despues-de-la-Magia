variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
}

variable "questions_table_name" {
  description = "Questions DynamoDB table name"
  type        = string
}

variable "users_table_name" {
  description = "Users DynamoDB table name"
  type        = string
}

variable "progress_table_name" {
  description = "Progress DynamoDB table name"
  type        = string
}

variable "sessions_table_name" {
  description = "Sessions DynamoDB table name"
  type        = string
}

variable "questions_table_arn" {
  description = "Questions DynamoDB table ARN"
  type        = string
}

variable "users_table_arn" {
  description = "Users DynamoDB table ARN"
  type        = string
}

variable "progress_table_arn" {
  description = "Progress DynamoDB table ARN"
  type        = string
}

variable "sessions_table_arn" {
  description = "Sessions DynamoDB table ARN"
  type        = string
}

variable "bedrock_role_arn" {
  description = "Cross-account IAM role ARN to assume before invoking Amazon Bedrock. Leave empty to disable AI endpoints."
  type        = string
  default     = ""
}

variable "bedrock_external_id" {
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
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}
