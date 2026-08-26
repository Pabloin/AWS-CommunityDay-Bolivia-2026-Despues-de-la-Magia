# Resource Group Module - Group all project resources by tags

resource "aws_resourcegroups_group" "magic_cert" {
  name        = "${var.project_name}-${var.environment}"
  description = "Magic Cert v03 - AWS Community Day Bolivia 2026 - All project resources"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = [
        "AWS::AllSupported"
      ]
      TagFilters = [
        {
          Key    = "Event"
          Values = ["aws-cday-bolivia-2026"]
        },
        {
          Key    = "Project"
          Values = ["magic-certs-local2prod"]
        },
        {
          Key    = "Environment"
          Values = [var.environment]
        }
      ]
    })
  }

  tags = {
    Component = "resource-management"
    Purpose   = "group-project-resources"
  }
}

# Tag Editor / Resource Groups Tag API - This makes the group visible in Tag Editor
resource "aws_resourcegroups_group" "by_owner" {
  name        = "${var.project_name}-by-owner-${var.environment}"
  description = "Magic Cert resources grouped by owner"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = [
        "AWS::AllSupported"
      ]
      TagFilters = [
        {
          Key    = "Owner"
          Values = [var.owner]
        },
        {
          Key    = "Event"
          Values = ["aws-cday-bolivia-2026"]
        }
      ]
    })
  }

  tags = {
    Component = "resource-management"
    Purpose   = "group-by-owner"
  }
}

# Resource Group for Cost Tracking
resource "aws_resourcegroups_group" "by_event" {
  name        = "${var.project_name}-${var.environment}-all-resources"
  description = "Magic Cert v03 resources for AWS Community Day Bolivia 2026"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = [
        "AWS::AllSupported"
      ]
      TagFilters = [
        {
          Key    = "Event"
          Values = ["aws-cday-bolivia-2026"]
        }
      ]
    })
  }

  tags = {
    Component = "resource-management"
    Purpose   = "event-cost-tracking"
  }
}
