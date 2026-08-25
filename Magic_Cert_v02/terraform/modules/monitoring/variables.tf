variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "alert_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
}

variable "api_gateway_id" {
  description = "API Gateway ID"
  type        = string
}

variable "api_gateway_arn" {
  description = "API Gateway ARN"
  type        = string
}

variable "lambda_functions" {
  description = "Map of Lambda functions with name and ARN"
  type = map(object({
    name = string
    arn  = string
  }))
}
