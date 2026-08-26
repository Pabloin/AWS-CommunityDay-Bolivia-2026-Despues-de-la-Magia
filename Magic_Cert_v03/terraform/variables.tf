# Magic Cert v02 - Terraform Variables

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "magic-cert"
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
  default     = "github.com/pablo-ezequiel-inchausti/magic-cert"
}

variable "alert_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  default     = ""
}
