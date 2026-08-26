# Monitoring Module - CloudWatch Dashboards and Alarms

# SNS Topic for Alarms (if email provided)
resource "aws_sns_topic" "alerts" {
  count = var.alert_email != "" ? 1 : 0
  name  = "${var.project_name}-alerts-${var.environment}"

  tags = {
    Component = "monitoring"
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "API Requests" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "API Gateway Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            for name, func in var.lambda_functions : [
              "AWS/Lambda",
              "Invocations",
              { stat = "Sum", label = name }
            ]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Lambda Invocations"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            for name, func in var.lambda_functions : [
              "AWS/Lambda",
              "Errors",
              { stat = "Sum", label = name }
            ]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Lambda Errors"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            for name, func in var.lambda_functions : [
              "AWS/Lambda",
              "Duration",
              { stat = "Average", label = name }
            ]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Lambda Duration (ms)"
        }
      }
    ]
  })
}

# CloudWatch Alarms - API Gateway 5XX Errors
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  count               = var.alert_email != "" ? 1 : 0
  alarm_name          = "${var.project_name}-api-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]

  dimensions = {
    ApiName = "${var.project_name}-api-${var.environment}"
  }

  tags = {
    Component = "monitoring"
  }
}

# CloudWatch Alarms - Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = var.alert_email != "" ? var.lambda_functions : {}

  alarm_name          = "${var.project_name}-lambda-${each.key}-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "This metric monitors Lambda function ${each.key} errors"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]

  dimensions = {
    FunctionName = each.value.name
  }

  tags = {
    Component = "monitoring"
  }
}

# CloudWatch Alarms - Lambda Throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = var.alert_email != "" ? var.lambda_functions : {}

  alarm_name          = "${var.project_name}-lambda-${each.key}-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors Lambda function ${each.key} throttles"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]

  dimensions = {
    FunctionName = each.value.name
  }

  tags = {
    Component = "monitoring"
  }
}
