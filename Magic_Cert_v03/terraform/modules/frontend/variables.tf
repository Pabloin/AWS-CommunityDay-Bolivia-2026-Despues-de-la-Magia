variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "api_url" {
  description = "API Gateway URL"
  type        = string
}

variable "custom_domain_name" {
  description = "Optional custom domain for the frontend CloudFront distribution."
  type        = string
  default     = ""
}

variable "additional_domain_names" {
  description = "Additional HTTPS aliases for the CloudFront distribution."
  type        = list(string)
  default     = []
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone name used to validate ACM and create the frontend alias record."
  type        = string
  default     = ""
}
