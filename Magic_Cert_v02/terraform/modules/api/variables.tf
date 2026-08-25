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
