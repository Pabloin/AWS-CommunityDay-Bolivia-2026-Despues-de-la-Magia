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
  }
  
  # Remote backend will be configured after initial setup
  # backend "s3" {
  #   bucket         = "magic-cert-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "magic-cert-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region  = var.aws_region
  profile = "magic-account"
  
  default_tags {
    tags = {
      Event       = "aws-cday-bolivia-2026"
      Project     = "magic-certs-local2prod"
      Owner       = var.owner
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = var.repository_url
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  common_tags = {
    Component = "magic-cert-v02"
  }
}

# Modules
module "database" {
  source = "./modules/database"
  
  project_name = var.project_name
  environment  = var.environment
}

module "frontend" {
  source = "./modules/frontend"
  
  project_name = var.project_name
  environment  = var.environment
}

module "api" {
  source = "./modules/api"
  
  project_name          = var.project_name
  environment           = var.environment
  account_id            = local.account_id
  region                = local.region
  questions_table_name  = module.database.questions_table_name
  users_table_name      = module.database.users_table_name
  progress_table_name   = module.database.progress_table_name
  sessions_table_name   = module.database.sessions_table_name
  questions_table_arn   = module.database.questions_table_arn
  users_table_arn       = module.database.users_table_arn
  progress_table_arn    = module.database.progress_table_arn
  sessions_table_arn    = module.database.sessions_table_arn
}

module "monitoring" {
  source = "./modules/monitoring"
  
  project_name    = var.project_name
  environment     = var.environment
  alert_email     = var.alert_email
  api_gateway_id  = module.api.api_gateway_id
  api_gateway_arn = module.api.api_gateway_arn
  lambda_functions = module.api.lambda_functions
}

module "resource_group" {
  source = "./modules/resource-group"
  
  project_name = var.project_name
  environment  = var.environment
  owner        = var.owner
}
