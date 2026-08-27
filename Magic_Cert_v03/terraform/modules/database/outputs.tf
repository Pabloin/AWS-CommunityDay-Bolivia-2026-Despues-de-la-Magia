output "questions_table_name" {
  description = "Questions table name"
  value       = aws_dynamodb_table.questions.name
}

output "questions_table_arn" {
  description = "Questions table ARN"
  value       = aws_dynamodb_table.questions.arn
}

output "users_table_name" {
  description = "Users table name"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "Users table ARN"
  value       = aws_dynamodb_table.users.arn
}

output "progress_table_name" {
  description = "Progress table name"
  value       = aws_dynamodb_table.progress.name
}

output "progress_table_arn" {
  description = "Progress table ARN"
  value       = aws_dynamodb_table.progress.arn
}

output "sessions_table_name" {
  description = "Sessions table name"
  value       = aws_dynamodb_table.sessions.name
}

output "sessions_table_arn" {
  description = "Sessions table ARN"
  value       = aws_dynamodb_table.sessions.arn
}

output "ai_usage_table_name" {
  description = "AI usage quota table name"
  value       = aws_dynamodb_table.ai_usage.name
}

output "ai_usage_table_arn" {
  description = "AI usage quota table ARN"
  value       = aws_dynamodb_table.ai_usage.arn
}
