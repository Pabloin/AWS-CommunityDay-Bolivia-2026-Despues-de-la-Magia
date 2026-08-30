# Magic Cert v02 - Terraform Outputs

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

# Frontend outputs
output "website_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = module.frontend.bucket_name
}

output "website_url" {
  description = "Website URL"
  value       = module.frontend.website_url
}

# API outputs
output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = module.api.api_gateway_id
}

# Database outputs
output "questions_table_name" {
  description = "Questions DynamoDB table name"
  value       = module.database.questions_table_name
}

output "users_table_name" {
  description = "Users DynamoDB table name"
  value       = module.database.users_table_name
}

output "progress_table_name" {
  description = "Progress DynamoDB table name"
  value       = module.database.progress_table_name
}

output "sessions_table_name" {
  description = "Sessions DynamoDB table name"
  value       = module.database.sessions_table_name
}

# Lambda outputs
output "lambda_functions" {
  description = "Lambda function names"
  value       = module.api.lambda_functions
}

# Monitoring outputs
output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = module.monitoring.dashboard_url
}

# Resource Group outputs
output "resource_group_name" {
  description = "Resource group name"
  value       = module.resource_group.resource_group_name
}

output "resource_group_url" {
  description = "AWS Console URL to view all project resources"
  value       = module.resource_group.resource_group_url
}

output "resource_group_by_owner_url" {
  description = "AWS Console URL for V2 resources owned by this deployment"
  value       = module.resource_group.by_owner_group_url
}

output "resource_group_by_version_url" {
  description = "AWS Console URL for V2 resources filtered by Release tag"
  value       = module.resource_group.by_event_group_url
}

output "tag_editor_url" {
  description = "AWS Tag Editor URL"
  value       = module.resource_group.tag_editor_url
}

# Deployment info
output "deployment_summary" {
  description = "Deployment summary"
  value       = <<-EOT
    
    ════════════════════════════════════════════════════════════
    Magic Cert v02 - Deployment Summary
    ════════════════════════════════════════════════════════════
    
    Frontend:
      - Website URL: ${module.frontend.website_url}
      - S3 Bucket: ${module.frontend.bucket_name}
    
    Backend API:
      - API URL: ${module.api.api_url}
      - Endpoints:
        * GET  ${module.api.api_url}/questions
        * POST ${module.api.api_url}/auth/register
        * POST ${module.api.api_url}/auth/login
        * GET  ${module.api.api_url}/user/profile
        * GET  ${module.api.api_url}/user/progress
        * POST ${module.api.api_url}/user/progress
    
    Database:
      - Questions: ${module.database.questions_table_name}
      - Users: ${module.database.users_table_name}
      - Progress: ${module.database.progress_table_name}
      - Sessions: ${module.database.sessions_table_name}
    
    Monitoring:
      - Dashboard: ${module.monitoring.dashboard_url}
    
    Resource Groups:
      - View all resources: ${module.resource_group.resource_group_url}
      - View V2 resources by owner: ${module.resource_group.by_owner_group_url}
      - View V2 resources by Release tag: ${module.resource_group.by_event_group_url}
      - Tag Editor: ${module.resource_group.tag_editor_url}
    
    Next Steps:
      1. Seed questions: ./scripts/seed-questions.sh
      2. Build frontend: cd ../frontend && npm run build
      3. Deploy frontend: ./scripts/deploy-frontend.sh
      4. Test: open ${module.frontend.website_url}
    
    ════════════════════════════════════════════════════════════
  EOT
}
