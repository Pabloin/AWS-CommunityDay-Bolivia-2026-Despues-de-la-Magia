variable "aws_region" {
  type        = string
  description = "AWS region for the bootstrap resources"
  default     = "us-east-1"
}

variable "github_owner" {
  type        = string
  description = "GitHub organization or user"
}

variable "github_repository" {
  type        = string
  description = "GitHub repository name"
}

variable "github_owner_id" {
  type        = string
  description = "Immutable GitHub owner ID used in the OIDC subject claim"
}

variable "github_repository_id" {
  type        = string
  description = "Immutable GitHub repository ID used in the OIDC subject claim"
}

variable "github_production_environment" {
  type        = string
  description = "GitHub environment used by the protected apply job"
  default     = "production"
}

variable "tf_state_bucket" {
  type        = string
  description = "Existing Terraform state bucket"
}

variable "tf_lock_table_arn" {
  type        = string
  description = "ARN of the existing Terraform lock table"
}
