output "plan_role_arn" {
  value = aws_iam_role.terraform_plan.arn
}

output "apply_role_arn" {
  value = aws_iam_role.terraform_apply.arn
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}
