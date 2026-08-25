# Magic Cert v02 - Tagging Strategy

## 🏷️ Overview

All AWS resources will be automatically tagged using Terraform's `default_tags` feature in the AWS provider.

---

## 📋 Standard Tags (Applied to ALL Resources)

| Tag Key | Tag Value | Purpose |
|---------|-----------|---------|
| **Event** | `aws-cday-bolivia-2026` | Track all resources for this event |
| **Project** | `magic-certs-local2prod` | Identify project resources |
| **Owner** | `@pablo-ezequiel-inchausti` | Resource ownership and accountability |
| **Environment** | `dev` / `staging` / `production` | Separate environments |
| **ManagedBy** | `terraform` | Identify IaC-managed resources |
| **Repository** | `github.com/USER/REPO` | Link to source code |

---

## 🔧 Terraform Implementation

### Provider Configuration with Default Tags

```hcl
# terraform/main.tf or terraform/provider.tf

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Event       = "aws-cday-bolivia-2026"
      Project     = "magic-certs-local2prod"
      Owner       = "@pablo-ezequiel-inchausti"
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = var.repository_url
    }
  }
}
```

### Variables

```hcl
# terraform/variables.tf

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Resource owner (GitHub username)"
  type        = string
  default     = "@pablo-ezequiel-inchausti"
}

variable "repository_url" {
  description = "GitHub repository URL"
  type        = string
  default     = "github.com/pablo-ezequiel-inchausti/magic-cert"
}
```

### Resource Examples

All resources automatically inherit default tags:

```hcl
# S3 Bucket - auto-tagged
resource "aws_s3_bucket" "website" {
  bucket = "${var.project_name}-frontend-${var.environment}"
  # All default_tags automatically applied
}

# Lambda Function - auto-tagged + additional tags
resource "aws_lambda_function" "auth" {
  function_name = "${var.project_name}-auth-${var.environment}"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  
  # Additional resource-specific tags
  tags = {
    Component = "authentication"
    Runtime   = "nodejs18.x"
  }
  # default_tags from provider also applied
}

# DynamoDB Table - auto-tagged + additional tags
resource "aws_dynamodb_table" "questions" {
  name           = "${var.project_name}-questions-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"
  
  tags = {
    Component = "database"
    DataType  = "questions"
  }
  # default_tags from provider also applied
}

# API Gateway - auto-tagged
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "Magic Cert API Gateway"
  # All default_tags automatically applied
}
```

---

## 💰 Cost Allocation

### 1. Activate Cost Allocation Tags

After first deployment:

1. Go to **AWS Billing Console**
2. Navigate to **Cost Allocation Tags**
3. Activate these tags:
   - ✅ `Event`
   - ✅ `Project`
   - ✅ `Owner`
   - ✅ `Environment`
   - ✅ `ManagedBy`
4. Wait 24 hours for tags to appear in Cost Explorer

### 2. Cost Reports by Tag

**View costs by Event:**
```
AWS Cost Explorer → Filter by Tag → Event = aws-cday-bolivia-2026
```

**View costs by Environment:**
```
AWS Cost Explorer → Group by Tag → Environment
```

**View costs by Project:**
```
AWS Cost Explorer → Filter by Tag → Project = magic-certs-local2prod
```

### 3. AWS CLI Cost Queries

**Get total cost for the event:**
```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --filter file://cost-filter.json
```

**cost-filter.json:**
```json
{
  "Tags": {
    "Key": "Event",
    "Values": ["aws-cday-bolivia-2026"]
  }
}
```

**Group costs by environment:**
```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=TAG,Key=Environment
```

---

## 🔍 Resource Discovery

### Find All Resources for This Project

```bash
# List all resources with event tag
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --output table

# List resources by environment
aws resourcegroupstaggingapi get-resources \
  --tag-filters \
    Key=Event,Values=aws-cday-bolivia-2026 \
    Key=Environment,Values=production \
  --output json

# Count resources by service
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Project,Values=magic-certs-local2prod \
  | jq '.ResourceTagMappingList | group_by(.ResourceARN | split(":")[2]) | map({service: .[0].ResourceARN | split(":")[2], count: length})'
```

---

## 🧹 Resource Cleanup

### Option 1: Terraform Destroy (Recommended)

```bash
cd terraform/environments/production
terraform destroy -auto-approve
```

### Option 2: Tag-Based Manual Cleanup

```bash
# List all resources to be deleted
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --output table

# Verify using AWS Console
# Then manually delete or use AWS CLI per service
```

### Option 3: Automated Cleanup Script

```bash
#!/bin/bash
# scripts/cleanup-by-tag.sh

EVENT_TAG="aws-cday-bolivia-2026"

echo "Finding all resources with Event tag: $EVENT_TAG"

# Get all resource ARNs
RESOURCES=$(aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=$EVENT_TAG \
  --query 'ResourceTagMappingList[*].ResourceARN' \
  --output text)

if [ -z "$RESOURCES" ]; then
  echo "No resources found with tag Event=$EVENT_TAG"
  exit 0
fi

echo "Found resources:"
echo "$RESOURCES"

echo ""
echo "⚠️  WARNING: This will attempt to delete all resources above!"
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Cleanup cancelled"
  exit 0
fi

# Note: Better to use terraform destroy
echo "Recommended: Use 'terraform destroy' instead of manual deletion"
```

---

## 📊 Presentation Benefits

### During AWS Community Day Talk

**Show Cost Transparency:**
```
"Every resource is tagged with the event name, so we can track 
exact costs for this demo. Let me show you in Cost Explorer..."
```

**Show Professional Practices:**
```
"Notice all resources have owner tags - this is critical for 
team accountability in production environments."
```

**Show Easy Cleanup:**
```
"After the demo, one command removes everything: terraform destroy.
Or we can query by tag to ensure nothing is left running."
```

---

## 🎯 Tag Validation

### Pre-Deployment Check

```bash
# After terraform plan, verify tags will be applied
terraform plan -out=tfplan
terraform show -json tfplan | jq '.planned_values.root_module.resources[].values.tags'
```

### Post-Deployment Verification

```bash
# Check if all resources have required tags
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  | jq '.ResourceTagMappingList[] | {arn: .ResourceARN, tags: .Tags}'

# Count resources by tag
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  | jq '.ResourceTagMappingList | length'
```

---

## 📝 Additional Component-Specific Tags

Beyond default tags, add component-specific tags:

| Resource Type | Additional Tags | Example Values |
|---------------|-----------------|----------------|
| **Lambda Functions** | `Component`, `Runtime` | `authentication`, `nodejs18.x` |
| **DynamoDB Tables** | `Component`, `DataType` | `database`, `questions` |
| **S3 Buckets** | `Component`, `Purpose` | `frontend`, `static-website` |
| **API Gateway** | `Component`, `Version` | `api`, `v1` |
| **CloudWatch Logs** | `Component`, `RetentionDays` | `logging`, `7` |

---

## 🔐 Tag-Based IAM Policies (Advanced)

Restrict access based on tags:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "lambda:*",
        "dynamodb:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:ResourceTag/Event": "aws-cday-bolivia-2026",
          "aws:ResourceTag/Owner": "@pablo-ezequiel-inchausti"
        }
      }
    }
  ]
}
```

This policy allows operations only on resources with matching tags.

---

## ✅ Tag Compliance Checklist

Before deploying to production:

- [ ] Provider configured with `default_tags`
- [ ] All required tags defined (Event, Project, Owner, Environment, ManagedBy)
- [ ] Variables configured for dynamic values (environment, owner)
- [ ] Cost allocation tags activated in AWS Billing
- [ ] Tag validation script tested
- [ ] Cleanup procedure documented
- [ ] Team trained on tag importance

---

## 📚 Resources

**AWS Documentation:**
- [Tagging Best Practices](https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html)
- [Cost Allocation Tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)
- [Resource Groups Tagging API](https://docs.aws.amazon.com/resourcegroupstagging/latest/APIReference/Welcome.html)

**Terraform Documentation:**
- [AWS Provider Default Tags](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#default_tags)

---

**Last Updated:** 2026  
**Owner:** @pablo-ezequiel-inchausti  
**Event:** AWS Community Day Bolivia 2026
