output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_arn" {
  description = "API Gateway ARN"
  value       = aws_api_gateway_rest_api.main.arn
}

output "api_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "lambda_functions" {
  description = "Lambda function names and ARNs"
  value = {
    questions = {
      name = aws_lambda_function.questions.function_name
      arn  = aws_lambda_function.questions.arn
    }
    auth = {
      name = aws_lambda_function.auth.function_name
      arn  = aws_lambda_function.auth.arn
    }
    user_profile = {
      name = aws_lambda_function.user_profile.function_name
      arn  = aws_lambda_function.user_profile.arn
    }
    user_progress = {
      name = aws_lambda_function.user_progress.function_name
      arn  = aws_lambda_function.user_progress.arn
    }
  }
}

output "jwt_secret_arn" {
  description = "JWT Secret ARN"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}
