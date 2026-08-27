output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.website.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.website.arn
}

output "website_url" {
  description = "Website URL"
  value       = local.custom_domain_enabled ? "https://${var.custom_domain_name}" : "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "website_endpoint" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "custom_domain_name" {
  description = "Configured frontend custom domain name"
  value       = var.custom_domain_name
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN used by CloudFront"
  value       = local.custom_domain_enabled ? aws_acm_certificate_validation.frontend[0].certificate_arn : null
}
