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

variable "ai_usage_table_name" {
  description = "AI usage quota table name"
  type        = string
}

variable "ai_usage_table_arn" {
  description = "AI usage quota table ARN"
  type        = string
}

variable "bedrock_role_arn" {
  description = "Optional cross-account IAM role ARN to assume before invoking Amazon Bedrock. Leave empty for same-account invocation."
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
