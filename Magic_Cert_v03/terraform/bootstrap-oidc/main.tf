terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

locals {
  oidc_url       = "https://token.actions.githubusercontent.com"
  repository_sub = "repo:${var.github_owner}@${var.github_owner_id}/${var.github_repository}@${var.github_repository_id}"
  tags = {
    Event       = "aws-cday-bolivia-2026"
    Project     = "magic-certs-local2prod"
    Component   = "github-actions-oidc"
    Environment = "shared"
    ManagedBy   = "terraform"
    Repository  = "github.com/${var.github_owner}/${var.github_repository}"
    Release     = "magic-cert-v03"
  }
}

resource "aws_iam_openid_connect_provider" "github" {
  url            = local.oidc_url
  client_id_list = ["sts.amazonaws.com"]
  tags           = local.tags
}

data "aws_iam_policy_document" "github_plan_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["${local.repository_sub}:pull_request"]
    }
  }
}

resource "aws_iam_role" "terraform_plan" {
  name               = "magic-cert-v03-github-plan"
  assume_role_policy = data.aws_iam_policy_document.github_plan_trust.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "terraform_plan_read_only" {
  role       = aws_iam_role.terraform_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy" "terraform_plan_state" {
  name = "terraform-state-access"
  role = aws_iam_role.terraform_plan.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
      Resource = [
        "arn:aws:s3:::${var.tf_state_bucket}",
        "arn:aws:s3:::${var.tf_state_bucket}/*"
      ]
      }, {
      Effect   = "Allow"
      Action   = ["dynamodb:DescribeTable", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
      Resource = var.tf_lock_table_arn
    }]
  })
}

data "aws_iam_policy_document" "github_apply_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["${local.repository_sub}:environment:${var.github_production_environment}"]
    }
  }
}

resource "aws_iam_role" "terraform_apply" {
  name               = "magic-cert-v03-github-apply"
  assume_role_policy = data.aws_iam_policy_document.github_apply_trust.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "terraform_apply_power_user" {
  role       = aws_iam_role.terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

resource "aws_iam_role_policy" "terraform_apply_permissions" {
  name = "terraform-iam-and-state-access"
  role = aws_iam_role.terraform_apply.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies",
        "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:AttachRolePolicy",
        "iam:DetachRolePolicy", "iam:PassRole", "iam:TagRole", "iam:UntagRole",
        "iam:ListAttachedRolePolicies", "iam:ListInstanceProfilesForRole"
      ]
      Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/magic-cert-*"
      }, {
      Effect   = "Allow"
      Action   = ["s3:*", "dynamodb:*", "logs:*", "apigateway:*", "lambda:*", "cloudwatch:*", "secretsmanager:*", "resource-groups:*", "resourcegroupstaggingapi:*", "iam:CreateServiceLinkedRole"]
      Resource = "*"
    }]
  })
}
