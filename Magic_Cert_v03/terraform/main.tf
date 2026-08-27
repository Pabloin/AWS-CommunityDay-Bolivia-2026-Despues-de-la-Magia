# Magic Cert v02 - Main Terraform Configuration

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Event       = "aws-cday-bolivia-2026"
      Project     = "magic-certs-local2prod"
      Owner       = var.owner
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = var.repository_url
      Release     = "magic-cert-v03"
    }
  }
}

# Local variables
locals {
  account_id      = data.aws_caller_identity.current.account_id
  region          = data.aws_region.current.name
  resource_prefix = var.deployment_id != "" ? "${var.project_name}-${var.deployment_id}" : var.project_name

  common_tags = {
    Component    = "magic-cert-v03"
    DeploymentId = var.deployment_id != "" ? var.deployment_id : "default"
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Modules
module "database" {
  source = "./modules/database"

  project_name = local.resource_prefix
  environment  = var.environment
}

module "frontend" {
  source = "./modules/frontend"

  project_name       = local.resource_prefix
  environment        = var.environment
  api_url            = module.api.api_url
  custom_domain_name = var.custom_domain_name
  hosted_zone_name   = var.hosted_zone_name
}

module "api" {
  source = "./modules/api"

  project_name               = local.resource_prefix
  environment                = var.environment
  account_id                 = local.account_id
  region                     = local.region
  questions_table_name       = module.database.questions_table_name
  users_table_name           = module.database.users_table_name
  progress_table_name        = module.database.progress_table_name
  sessions_table_name        = module.database.sessions_table_name
  ai_usage_table_name        = module.database.ai_usage_table_name
  questions_table_arn        = module.database.questions_table_arn
  users_table_arn            = module.database.users_table_arn
  progress_table_arn         = module.database.progress_table_arn
  sessions_table_arn         = module.database.sessions_table_arn
  ai_usage_table_arn         = module.database.ai_usage_table_arn
  bedrock_role_arn           = var.bedrock_role_arn
  bedrock_external_id        = var.bedrock_role_external_id
  bedrock_region             = var.bedrock_region
  bedrock_model_id           = var.bedrock_model_id
  ai_daily_quota_per_user    = var.ai_daily_quota_per_user
  api_throttling_rate_limit  = var.api_throttling_rate_limit
  api_throttling_burst_limit = var.api_throttling_burst_limit
}

module "monitoring" {
  source = "./modules/monitoring"

  project_name     = local.resource_prefix
  environment      = var.environment
  alert_email      = var.alert_email
  api_gateway_id   = module.api.api_gateway_id
  api_gateway_arn  = module.api.api_gateway_arn
  lambda_functions = module.api.lambda_functions
}

module "resource_group" {
  source = "./modules/resource-group"

  project_name = local.resource_prefix
  environment  = var.environment
  owner        = var.owner
}
