# API Module - API Gateway + Lambda Functions

# Secrets Manager for JWT secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.project_name}-jwt-secret-${var.environment}"
  description = "JWT secret for Magic Cert authentication"

  tags = {
    Component = "security"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    secret = random_password.jwt_secret.result
  })
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

locals {
  lambda_sources = {
    questions = {
      directory = "questions"
    }
    auth = {
      directory = "auth"
    }
    user_profile = {
      directory = "user-profile"
    }
    user_progress = {
      directory = "user-progress"
    }
    ai_practice = {
      directory = "ai-practice"
    }
  }
}

resource "null_resource" "lambda_package_dependencies" {
  triggers = {
    source_hash = sha256(join("", [for source in values(local.lambda_sources) : join("", [
      filesha256("${path.root}/../backend/functions/${source.directory}/index.js"),
      filesha256("${path.root}/../backend/functions/${source.directory}/package.json"),
      filesha256("${path.root}/../backend/functions/${source.directory}/package-lock.json")
    ])]))
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      TERRAFORM_ROOT="$(pwd)"
      BUILD_ROOT="$TERRAFORM_ROOT/.terraform-build"
      SOURCE_ROOT="$TERRAFORM_ROOT/../backend/functions"
      rm -rf "$BUILD_ROOT"
      mkdir -p "$BUILD_ROOT"

      while IFS=: read -r FUNCTION_NAME SOURCE_NAME; do
        BUILD_DIR="$BUILD_ROOT/$FUNCTION_NAME"
        SOURCE_DIR="$SOURCE_ROOT/$SOURCE_NAME"
        mkdir -p "$BUILD_DIR"
        cp "$SOURCE_DIR/index.js" "$SOURCE_DIR/package.json" "$SOURCE_DIR/package-lock.json" "$BUILD_DIR/"
        cd "$BUILD_DIR"
        npm ci --omit=dev --silent
      done <<'FUNCTIONS'
      questions:questions
      auth:auth
      user_profile:user-profile
      user_progress:user-progress
      ai_practice:ai-practice
      FUNCTIONS
    EOT

    interpreter = ["/bin/bash", "-c"]
  }
}

data "archive_file" "lambda_package" {
  for_each = local.lambda_sources

  type        = "zip"
  source_dir  = "${path.root}/.terraform-build/${each.key}"
  output_path = "${path.root}/.terraform-build/${each.key}.zip"

  depends_on = [null_resource.lambda_package_dependencies]
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Component = "iam"
  }
}

# Lambda CloudWatch Logs Policy
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda DynamoDB Policy
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.project_name}-lambda-dynamodb-${var.environment}"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          var.questions_table_arn,
          "${var.questions_table_arn}/index/*",
          var.users_table_arn,
          "${var.users_table_arn}/index/*",
          var.progress_table_arn,
          "${var.progress_table_arn}/index/*",
          var.sessions_table_arn,
          "${var.sessions_table_arn}/index/*"
        ]
      }
    ]
  })
}

# Lambda Secrets Manager Policy
resource "aws_iam_role_policy" "lambda_secrets" {
  name = "${var.project_name}-lambda-secrets-${var.environment}"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.jwt_secret.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_assume_bedrock" {
  count = var.bedrock_role_arn != "" ? 1 : 0

  name = "${var.project_name}-lambda-assume-bedrock-${var.environment}"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sts:AssumeRole"
        ]
        Resource = var.bedrock_role_arn
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "questions" {
  name              = "/aws/lambda/${aws_lambda_function.questions.function_name}"
  retention_in_days = 7

  tags = {
    Component = "logging"
  }
}

resource "aws_cloudwatch_log_group" "auth" {
  name              = "/aws/lambda/${aws_lambda_function.auth.function_name}"
  retention_in_days = 7

  tags = {
    Component = "logging"
  }
}

resource "aws_cloudwatch_log_group" "user_profile" {
  name              = "/aws/lambda/${aws_lambda_function.user_profile.function_name}"
  retention_in_days = 7

  tags = {
    Component = "logging"
  }
}

resource "aws_cloudwatch_log_group" "user_progress" {
  name              = "/aws/lambda/${aws_lambda_function.user_progress.function_name}"
  retention_in_days = 7

  tags = {
    Component = "logging"
  }
}

resource "aws_cloudwatch_log_group" "ai_practice" {
  name              = "/aws/lambda/${aws_lambda_function.ai_practice.function_name}"
  retention_in_days = 7

  tags = {
    Component = "logging"
  }
}

resource "aws_lambda_function" "questions" {
  filename      = data.archive_file.lambda_package["questions"].output_path
  function_name = "${var.project_name}-questions-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  source_code_hash = data.archive_file.lambda_package["questions"].output_base64sha256

  environment {
    variables = {
      QUESTIONS_TABLE = var.questions_table_name
      ENVIRONMENT     = var.environment
    }
  }

  tags = {
    Component = "api"
    Function  = "questions"
  }
}

resource "aws_lambda_function" "auth" {
  filename      = data.archive_file.lambda_package["auth"].output_path
  function_name = "${var.project_name}-auth-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  source_code_hash = data.archive_file.lambda_package["auth"].output_base64sha256

  environment {
    variables = {
      USERS_TABLE    = var.users_table_name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      ENVIRONMENT    = var.environment
    }
  }

  tags = {
    Component = "api"
    Function  = "authentication"
  }
}

resource "aws_lambda_function" "user_profile" {
  filename      = data.archive_file.lambda_package["user_profile"].output_path
  function_name = "${var.project_name}-user-profile-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  source_code_hash = data.archive_file.lambda_package["user_profile"].output_base64sha256

  environment {
    variables = {
      USERS_TABLE    = var.users_table_name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      ENVIRONMENT    = var.environment
    }
  }

  tags = {
    Component = "api"
    Function  = "user-profile"
  }
}

resource "aws_lambda_function" "user_progress" {
  filename      = data.archive_file.lambda_package["user_progress"].output_path
  function_name = "${var.project_name}-user-progress-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  source_code_hash = data.archive_file.lambda_package["user_progress"].output_base64sha256

  environment {
    variables = {
      PROGRESS_TABLE = var.progress_table_name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      ENVIRONMENT    = var.environment
    }
  }

  tags = {
    Component = "api"
    Function  = "user-progress"
  }
}

resource "aws_lambda_function" "ai_practice" {
  filename      = data.archive_file.lambda_package["ai_practice"].output_path
  function_name = "${var.project_name}-ai-practice-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  source_code_hash = data.archive_file.lambda_package["ai_practice"].output_base64sha256

  environment {
    variables = {
      BEDROCK_ROLE_ARN    = var.bedrock_role_arn
      BEDROCK_EXTERNAL_ID = var.bedrock_external_id
      BEDROCK_REGION      = var.bedrock_region
      BEDROCK_MODEL_ID    = var.bedrock_model_id
      ENVIRONMENT         = var.environment
    }
  }

  tags = {
    Component = "api"
    Function  = "ai-practice"
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "Magic Cert API Gateway"

  tags = {
    Component = "api"
  }
}

# API Gateway Resources
resource "aws_api_gateway_resource" "questions" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "questions"
}

resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_resource" "auth_register" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "register"
}

resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

resource "aws_api_gateway_resource" "user" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "user"
}

resource "aws_api_gateway_resource" "user_profile" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.user.id
  path_part   = "profile"
}

resource "aws_api_gateway_resource" "user_progress" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.user.id
  path_part   = "progress"
}

resource "aws_api_gateway_resource" "ai" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "ai"
}

resource "aws_api_gateway_resource" "ai_explain" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.ai.id
  path_part   = "explain"
}

# API Gateway Methods - Questions
resource "aws_api_gateway_method" "questions_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.questions.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "questions_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.questions.id
  http_method             = aws_api_gateway_method.questions_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.questions.invoke_arn
}

# API Gateway Methods - Auth Register
resource "aws_api_gateway_method" "auth_register_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_register.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_register_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.auth_register.id
  http_method             = aws_api_gateway_method.auth_register_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth.invoke_arn
}

# API Gateway Methods - Auth Login
resource "aws_api_gateway_method" "auth_login_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_login_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.auth_login.id
  http_method             = aws_api_gateway_method.auth_login_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth.invoke_arn
}

# API Gateway Methods - User Profile
resource "aws_api_gateway_method" "user_profile_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.user_profile.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "user_profile_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.user_profile.id
  http_method             = aws_api_gateway_method.user_profile_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.user_profile.invoke_arn
}

# API Gateway Methods - User Progress GET
resource "aws_api_gateway_method" "user_progress_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.user_progress.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "user_progress_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.user_progress.id
  http_method             = aws_api_gateway_method.user_progress_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.user_progress.invoke_arn
}

# API Gateway Methods - User Progress POST
resource "aws_api_gateway_method" "user_progress_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.user_progress.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "user_progress_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.user_progress.id
  http_method             = aws_api_gateway_method.user_progress_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.user_progress.invoke_arn
}

# API Gateway Methods - AI Explain
resource "aws_api_gateway_method" "ai_explain_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.ai_explain.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "ai_explain_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.ai_explain.id
  http_method             = aws_api_gateway_method.ai_explain_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ai_practice.invoke_arn
}

# CORS Configuration for all resources
module "cors_questions" {
  source = "../cors"

  api_id      = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.questions.id
}

module "cors_auth_register" {
  source = "../cors"

  api_id      = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_register.id
}

module "cors_auth_login" {
  source = "../cors"

  api_id      = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_login.id
}

module "cors_user_profile" {
  source = "../cors"

  api_id      = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.user_profile.id
}

module "cors_user_progress" {
  source = "../cors"

  api_id      = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.user_progress.id
}

module "cors_ai_explain" {
  source = "../cors"

  api_id      = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.ai_explain.id
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "questions" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.questions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "auth" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "user_profile" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.user_profile.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "user_progress" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.user_progress.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "ai_practice" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_practice.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.questions.id,
      aws_api_gateway_method.questions_get.id,
      aws_api_gateway_integration.questions_get.id,
      aws_api_gateway_resource.auth_register.id,
      aws_api_gateway_method.auth_register_post.id,
      aws_api_gateway_integration.auth_register_post.id,
      aws_api_gateway_resource.auth_login.id,
      aws_api_gateway_method.auth_login_post.id,
      aws_api_gateway_integration.auth_login_post.id,
      aws_api_gateway_resource.ai.id,
      aws_api_gateway_resource.ai_explain.id,
      aws_api_gateway_method.ai_explain_post.id,
      aws_api_gateway_integration.ai_explain_post.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.questions_get,
    aws_api_gateway_integration.auth_register_post,
    aws_api_gateway_integration.auth_login_post,
    aws_api_gateway_integration.user_profile_get,
    aws_api_gateway_integration.user_progress_get,
    aws_api_gateway_integration.user_progress_post,
    aws_api_gateway_integration.ai_explain_post,
  ]
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  tags = {
    Component = "api"
  }
}
