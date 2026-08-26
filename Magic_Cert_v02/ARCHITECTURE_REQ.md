# Magic Cert v02 - Architecture Requirements

## 📋 Document Overview

**Version:** 2.0 (Basic Cloud Deployment)  
**Status:** Requirements Definition  
**Date:** 2026  
**Purpose:** Define architecture requirements before implementation

---

## 🎯 AWS Community Day Strategy

**Presentation Context:** AWS Community Day Bolivia 2026 - "Después de la Magia"

**Architecture Evolution Story:**
- **v01:** Magic (AI-generated on localhost) - **$0/month**
- **v02:** AWS Serverless (S3 + API Gateway + Lambda + DynamoDB) - **$5-7/month** ✅
- **v03:** Production-Ready (+ CloudFront + Custom Domain + HTTPS) - **$25-30/month**

**Key Decision for v02:**
- ✅ **Skip CloudFront** to demonstrate true serverless cost optimization
- ✅ **HTTP is acceptable** for demo/MVP phase
- ✅ **100% AWS-native** architecture (no external CDN)
- ✅ **Clear upgrade path** to production features in v03
- ✅ **Better presentation narrative** showing incremental AWS adoption

**CloudFront postponed to v03 because:**
- Adds $15-20/month to base costs
- HTTPS with custom domain is a production feature, not MVP requirement
- Shows pragmatic AWS architecture decisions
- Demonstrates understanding of AWS pricing model
- Perfect for AWS Community Day audience (cost-conscious, technically savvy)

---

## 🎯 Project Goals

Transform Magic Cert from a localhost application (v01) to a production-ready serverless application on AWS with:

1. **Cost Optimization**: Pay only for actual usage (serverless)
2. **Data Persistence**: Store questions and user progress
3. **User Management**: Guest access + registered user tracking
4. **Infrastructure as Code**: Terraform-managed AWS resources
5. **Scalability**: Handle variable traffic without manual intervention

---

## 📊 Requirements Breakdown

### 1. Cost Requirements

#### Primary Objectives
- ✅ **Serverless Architecture**: No idle costs
- ✅ **Pay-per-use Model**: Only pay when app is actually used
- ✅ **Low/No Cost at Rest**: Minimal costs when no users active
- ✅ **Auto-scaling**: No manual capacity management

#### Cost Targets
- **Development/Staging**: < $5/month
- **Production (low traffic)**: < $20/month
- **Production (moderate traffic)**: < $50/month for ~1000 users/month

#### Cost Optimization Strategies
- Use AWS Free Tier where applicable
- Implement caching to reduce backend calls
- Use DynamoDB on-demand pricing
- Minimize Lambda invocations through efficient design
- Use CloudFront for static content delivery

---

### 2. Persistence Requirements

#### Data Storage Strategy: Amazon DynamoDB

**Why DynamoDB?**
- ✅ Serverless (no servers to manage)
- ✅ Auto-scaling capacity
- ✅ On-demand pricing model
- ✅ Single-digit millisecond latency
- ✅ Suitable for non-structured data
- ✅ Built-in backup and point-in-time recovery

#### Data Models

##### 2.1 Questions Database

**Table:** `magic-cert-questions`

**Purpose:** Store quiz questions with metadata

**Schema:**
```javascript
{
  PK: "QUESTION#SAA-C03#d1-001",      // Partition Key
  SK: "METADATA",                      // Sort Key
  certification: "SAA-C03",
  questionId: "saa-c03-d1-001",
  domain: "domain1",
  domainName: "Design Secure Architectures",
  category: "Security",
  subcategory: "IAM",
  difficulty: "medium",
  question: "Question text...",
  options: [...],                      // Array of options
  correctAnswers: ["b"],               // Array of correct option IDs
  explanation: "...",
  references: [...],
  tags: [...],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  version: 1
}
```

**Access Patterns:**
- Get all questions by certification
- Get questions by domain
- Get questions by difficulty
- Get random N questions with filters

##### 2.2 User Progress Database

**Table:** `magic-cert-users`

**Purpose:** Store user accounts and authentication

**Schema:**
```javascript
{
  PK: "USER#email@example.com",       // Partition Key
  SK: "PROFILE",                       // Sort Key
  userId: "uuid-v4",
  email: "email@example.com",
  passwordHash: "bcrypt-hash",         // Hashed password
  name: "User Name",
  registeredAt: "2026-01-01T00:00:00Z",
  lastLoginAt: "2026-01-01T00:00:00Z",
  accountType: "registered",           // "guest" | "registered"
  preferences: {
    defaultDataset: "extended",
    defaultQuestionCount: 5
  }
}
```

**Table:** `magic-cert-progress`

**Purpose:** Store user quiz attempts and progress

**Schema:**
```javascript
{
  PK: "USER#uuid",                     // Partition Key
  SK: "ATTEMPT#2026-01-01T12:00:00Z",  // Sort Key
  attemptId: "uuid-v4",
  userId: "uuid-v4",
  certification: "SAA-C03",
  dataset: "extended",                 // "basic" | "extended"
  domain: "domain1",                   // or "all"
  totalQuestions: 5,
  correctAnswers: 4,
  score: 80,
  answers: [                           // Array of answer records
    {
      questionId: "saa-c03-d1-001",
      selectedAnswers: ["b"],
      correctAnswers: ["b"],
      isCorrect: true,
      timeSpent: 45                    // seconds
    }
  ],
  startedAt: "2026-01-01T12:00:00Z",
  completedAt: "2026-01-01T12:05:00Z",
  durationSeconds: 300
}
```

**Access Patterns:**
- Get user profile by email
- Get user's quiz history
- Get user statistics by domain
- Calculate aggregate scores

##### 2.3 Guest Sessions (Optional)

**Table:** `magic-cert-sessions`

**Purpose:** Temporary storage for guest users (TTL enabled)

**Schema:**
```javascript
{
  PK: "SESSION#uuid",                  // Partition Key
  SK: "DATA",                          // Sort Key
  sessionId: "uuid-v4",
  attempts: [...],                     // Same as progress.answers
  createdAt: "2026-01-01T12:00:00Z",
  ttl: 1735689600                      // Auto-delete after 24 hours
}
```

#### DynamoDB Configuration

**Billing Mode:** On-Demand (pay per request)  
**Backup:** Point-in-time recovery enabled  
**Encryption:** AWS-managed encryption at rest  
**Global Tables:** Not required for v02 (single region)

---

### 3. Security Requirements

#### 3.1 Authentication & Authorization

**Two-Tier Access Model:**

##### Tier 1: Guest Users (No Authentication)
- ✅ Can access and use the quiz application
- ✅ Can take quizzes and see immediate results
- ✅ Results stored temporarily (24 hours TTL)
- ❌ Cannot track long-term progress
- ❌ Cannot access statistics or history

##### Tier 2: Registered Users (Authenticated)
- ✅ All guest capabilities
- ✅ Persistent progress tracking
- ✅ Quiz history across sessions
- ✅ Performance statistics by domain
- ✅ Study progress tracking

#### 3.2 Authentication Mechanism

**Basic Authentication (v02):**
- Username (email) and password
- Passwords hashed with bcrypt (cost factor: 10)
- JWT tokens for session management
- Token expiry: 7 days
- Refresh token mechanism

**Future Enhancement (v03):**
- Google OAuth integration
- AWS Cognito User Pools
- Social login (GitHub, LinkedIn)

#### 3.3 API Security

**Requirements:**
- ✅ HTTPS only (no HTTP)
- ✅ CORS configuration for frontend domain
- ✅ Rate limiting per IP/user
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (using DynamoDB = NoSQL)
- ✅ XSS protection headers
- ✅ API request signing (AWS Signature V4)

**Rate Limits:**
- Guest users: 100 requests/hour
- Registered users: 500 requests/hour
- Authentication attempts: 5 failed attempts = 15 min lockout

#### 3.4 Data Security

**At Rest:**
- DynamoDB encryption enabled (AWS-managed keys)
- S3 bucket encryption for static assets
- Secrets stored in AWS Secrets Manager

**In Transit:**
- TLS 1.2+ for all connections
- HTTPS for CloudFront distribution
- WSS for WebSocket (if needed)

#### 3.5 IAM Security

**Principle of Least Privilege:**
- Lambda execution roles with minimal permissions
- Separate roles per function
- No wildcard permissions in production
- Resource-based policies where applicable

---

### 4. Infrastructure as Code Requirements

#### 4.1 Terraform Configuration

**Why Terraform?**
- ✅ Infrastructure versioning in Git
- ✅ Reproducible environments
- ✅ Multi-environment support (dev, staging, prod)
- ✅ State management
- ✅ Provider ecosystem (AWS, CloudFlare)
- ✅ Default tags across all resources

**Terraform Structure:**

```
Magic_Cert_v02/
├── terraform/
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── terraform.tfvars
│   │   │   └── backend.hcl
│   │   ├── staging/
│   │   └── production/
│   │
│   ├── modules/
│   │   ├── frontend/              # S3 + CloudFront
│   │   ├── api/                   # API Gateway + Lambda
│   │   ├── database/              # DynamoDB tables
│   │   ├── auth/                  # Authentication Lambda
│   │   ├── monitoring/            # CloudWatch
│   │   └── dns/                   # Route53 (advanced)
│   │
│   ├── variables.tf
│   ├── outputs.tf
│   └── versions.tf
│
└── scripts/
    ├── deploy.sh
    ├── deploy-frontend.sh
    ├── destroy.sh
    ├── get-urls.sh
    ├── seed-questions.sh
    └── setup-backend.sh
```

**Required Variables:**
```hcl
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Custom domain (optional)"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "magic-cert"
}

variable "owner" {
  description = "Resource owner (GitHub username)"
  type        = string
  default     = "@pablo-ezequiel-inchausti"
}
```

---

### 4.2 Resource Tagging Strategy

**All AWS resources will be tagged with:**

```hcl
# Configure AWS Provider with default tags
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Event       = "aws-cday-bolivia-2026"
      Project     = "magic-certs-local2prod"
      Owner       = "@pablo-ezequiel-inchausti"
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "github.com/pablo-ezequiel-inchausti/magic-cert"  # Update with actual repo
    }
  }
}
```

**Tag Usage Benefits:**
- ✅ **Cost Allocation:** Track costs by Event, Project, Environment
- ✅ **Resource Discovery:** Find all resources for this project
- ✅ **Access Control:** IAM policies based on tags
- ✅ **Automation:** Cleanup scripts using tags
- ✅ **Compliance:** Owner tracking and accountability
- ✅ **Presentation:** Show professional AWS practices

**AWS Cost Explorer Filters:**
```
Tag: Event = aws-cday-bolivia-2026
Tag: Project = magic-certs-local2prod
Tag: Environment = production
```

**Example Tag Application:**
Every resource (S3, Lambda, DynamoDB, API Gateway, etc.) will automatically have:
```json
{
  "Event": "aws-cday-bolivia-2026",
  "Project": "magic-certs-local2prod",
  "Owner": "@pablo-ezequiel-inchausti",
  "Environment": "production",
  "ManagedBy": "terraform",
  "Repository": "github.com/pablo-ezequiel-inchausti/magic-cert"
}
```

**Resource-Specific Tag Examples:**

```hcl
# S3 Bucket - tags applied automatically
resource "aws_s3_bucket" "website" {
  bucket = "${var.project_name}-frontend-${var.environment}"
  # default_tags from provider automatically applied
}

# Lambda Function - can add additional tags
resource "aws_lambda_function" "auth" {
  function_name = "${var.project_name}-auth-${var.environment}"
  
  tags = {
    Component = "authentication"
    Runtime   = "nodejs18.x"
  }
  # default_tags from provider also applied
}

# DynamoDB Table
resource "aws_dynamodb_table" "questions" {
  name = "${var.project_name}-questions-${var.environment}"
  
  tags = {
    Component = "database"
    DataType  = "questions"
  }
  # default_tags from provider also applied
}
```

**Cost Allocation Tags Activation:**

After deployment, activate cost allocation tags in AWS Billing console:
1. Go to AWS Billing → Cost Allocation Tags
2. Activate tags: `Event`, `Project`, `Owner`, `Environment`
3. Wait 24 hours for tags to appear in Cost Explorer
4. Filter costs by tag in Cost Explorer

**Operational Tagging Checks:**

Use tags to validate resource coverage and support cleanup after the demo:

```bash
# List all resources for this event
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --output table

# Count tagged resources
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  | jq '.ResourceTagMappingList | length'

# Group tagged resources by AWS service
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Project,Values=magic-certs-local2prod \
  | jq '.ResourceTagMappingList | group_by(.ResourceARN | split(":")[2]) | map({service: .[0].ResourceARN | split(":")[2], count: length})'
```

**Component-Specific Tags:**

| Resource Type | Additional Tags | Example Values |
|---------------|-----------------|----------------|
| Lambda Functions | `Component`, `Function` | `api`, `questions` |
| DynamoDB Tables | `Component`, `DataType` | `database`, `questions` |
| S3 Buckets | `Component`, `Purpose` | `frontend`, `static-website` |
| API Gateway | `Component` | `api` |
| CloudWatch Logs | `Component` | `logging` |

**Tag Compliance Checklist:**

- [ ] Provider configured with `default_tags`
- [ ] Required tags defined: `Event`, `Project`, `Owner`, `Environment`, `ManagedBy`
- [ ] Component-specific tags added where useful
- [ ] Cost allocation tags activated in AWS Billing
- [ ] Resource discovery command tested
- [ ] Cleanup procedure documented

---

### 4.3 Terraform State Management

**State Backend Configuration:**

Remote backend: S3 bucket
```json
{
  "Event": "aws-cday-bolivia-2026",
  "Project": "magic-certs-local2prod",
  "Owner": "@pablo-ezequiel-inchausti",
  "Environment": "production",
  "ManagedBy": "terraform"
}
```

---

### 4.3 Terraform State Management
- Remote backend: S3 bucket
- State locking: DynamoDB table
- Encrypted state files
- Versioned state bucket

**Required Variables:**
```hcl
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Custom domain (optional)"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "magic-cert"
}
```

---

### 5. Application Architecture

#### 5.1 High-Level Architecture (Basic v02 - S3 Only)

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                                │
│                  (Guest + Registered)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────────┐
         │ HTTP                      │ HTTPS
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   Amazon S3     │         │  API Gateway    │  ← REST API
│ Static Website  │         │  (REST/HTTPS)   │
│  (React App)    │         └────────┬────────┘
└─────────────────┘                  │
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
                     ▼                               ▼
            ┌─────────────────┐           ┌─────────────────┐
            │  Lambda Function│           │ Lambda Function │
            │   (Questions)   │           │     (Auth)      │
            └────────┬────────┘           └────────┬────────┘
                     │                              │
                     │                              │
                     ▼                              ▼
            ┌──────────────────────────────────────────────┐
            │           Amazon DynamoDB                     │
            │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
            │  │Questions │  │  Users   │  │ Progress │   │
            │  │  Table   │  │  Table   │  │  Table   │   │
            │  └──────────┘  └──────────┘  └──────────┘   │
            └──────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  CloudWatch Logs │  ← Monitoring
                    │   & Metrics      │
                    └──────────────────┘
```

**Note:** v02 uses S3 static website hosting (HTTP) to minimize costs. CloudFront (HTTPS + CDN) will be added in v03.

#### 5.2 AWS Services Used (Basic v02)

| Service | Purpose | Pricing Model | v02 | v03 |
|---------|---------|---------------|-----|-----|
| **S3** | Static website hosting | Storage + Requests | ✅ | ✅ |
| **API Gateway** | REST API endpoints | Per request | ✅ | ✅ |
| **Lambda** | Backend business logic | Per invocation + duration | ✅ | ✅ |
| **DynamoDB** | NoSQL database | On-demand per request | ✅ | ✅ |
| **CloudWatch** | Logging & monitoring | Log ingestion + storage | ✅ | ✅ |
| **Secrets Manager** | Store secrets (DB, JWT) | Per secret per month | ✅ | ✅ |
| **CloudFront** | CDN, HTTPS, caching | Data transfer + Requests | ❌ | ✅ |
| **Route53** | DNS management | Per hosted zone + queries | ❌ | ✅ |
| **ACM** | SSL/TLS certificates | Free | ❌ | ✅ |

**v02 Decision:** Skip CloudFront, Route53, and ACM to minimize costs (~$5-7/month vs ~$20-30/month)  
**v03 Upgrade:** Add CloudFront + custom domain for production features

#### 5.3 API Endpoints

**Public Endpoints (No Auth):**
```
GET  /api/questions?certification=SAA-C03&domain=all&count=5
POST /api/sessions                    # Create guest session
GET  /api/certifications              # List available certs
```

**Authentication Endpoints:**
```
POST /api/auth/register               # Create account
POST /api/auth/login                  # Login (returns JWT)
POST /api/auth/refresh                # Refresh JWT token
POST /api/auth/logout                 # Invalidate token
```

**Protected Endpoints (Auth Required):**
```
GET  /api/user/profile                # Get user profile
PUT  /api/user/profile                # Update profile
GET  /api/user/progress               # Get quiz history
POST /api/user/progress               # Save quiz attempt
GET  /api/user/statistics             # Get aggregate stats
GET  /api/user/statistics/{domain}    # Domain-specific stats
```

---

### 6. Advanced Features (v03 - Custom Domain & CDN)

#### 6.1 CloudFront & Custom Domain (v03 Only)

**Why postpone to v03:**
- CloudFront costs ~$5-15/month (significant for demo)
- S3 static website adequate for v02
- Better cost progression story for presentation:
  - v01: $0 (localhost)
  - v02: ~$5-7/month (basic AWS)
  - v03: ~$20-30/month (production-ready)

**Target Domain:** `magic-cert.glaciar.org`

**Requirements:**
- Route53 hosted zone for `glaciar.org`
- ACM certificate for `magic-cert.glaciar.org`
- CloudFront distribution with custom domain
- DNS A record (alias) pointing to CloudFront

**Terraform Resources Needed:**
```hcl
# Route53 hosted zone (or use existing)
resource "aws_route53_zone" "main" {
  name = "glaciar.org"
}

# ACM certificate (FREE!)
resource "aws_acm_certificate" "cert" {
  domain_name       = "magic-cert.glaciar.org"
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
}

# Route53 record for validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-magic-cert"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["magic-cert.glaciar.org"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-magic-cert"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Custom error response for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}

# Origin Access Identity for CloudFront to access S3
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "Magic Cert OAI"
}

# Route53 A record to CloudFront
resource "aws_route53_record" "magic_cert" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "magic-cert.glaciar.org"
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}
```

**v03 Benefits:**
- ✅ HTTPS with custom domain
- ✅ Global CDN (lower latency)
- ✅ DDoS protection (AWS Shield)
- ✅ Edge caching (faster loads)
- ✅ Professional URL

#### 6.2 CI/CD with GitHub Actions

**GitHub Actions Workflow:**

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy Magic Cert

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  terraform:
    name: Terraform Plan/Apply
    runs-on: ubuntu-latest
    
    permissions:
      id-token: write   # Required for OIDC
      contents: read
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
          aws-region: us-east-1
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform/environments/production
      
      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: ./terraform/environments/production
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve tfplan
        working-directory: ./terraform/environments/production
  
  frontend:
    name: Build and Deploy Frontend
    needs: terraform
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./Magic_Cert_v02/frontend
      
      - name: Build
        run: npm run build
        working-directory: ./Magic_Cert_v02/frontend
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
          aws-region: us-east-1
      
      - name: Deploy to S3
        run: |
          aws s3 sync ./dist s3://magic-cert-frontend --delete
        working-directory: ./Magic_Cert_v02/frontend
      
      # Only for v03 with CloudFront
      # - name: Invalidate CloudFront
      #   run: |
      #     aws cloudfront create-invalidation \
      #       --distribution-id ${{ secrets.CLOUDFRONT_ID }} \
      #       --paths "/*"
```

#### 6.3 OIDC Configuration with AWS

**Why OIDC?**
- ✅ No long-lived AWS credentials in GitHub
- ✅ Short-lived, automatically rotated tokens
- ✅ More secure than access keys
- ✅ Auditable via CloudTrail

**AWS IAM Setup:**

**1. Create OIDC Provider:**
```
Provider URL: https://token.actions.githubusercontent.com
Audience: sts.amazonaws.com
```

**2. Create IAM Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
```

**3. Attach Policies:**
- Terraform state access (S3, DynamoDB)
- Resource creation permissions
- S3 deployment permissions
- CloudFront invalidation permissions

#### 6.4 Cognito Integration (v03 Advanced)

**When to Upgrade to Cognito:**
- Need OAuth/OIDC providers (Google, GitHub)
- Need MFA support
- Need advanced security features
- Need user groups/roles

**Cognito Resources:**
```hcl
resource "aws_cognito_user_pool" "main" {
  name = "magic-cert-users"
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }
  
  auto_verified_attributes = ["email"]
  
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = false
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "magic-cert-web"
  user_pool_id = aws_cognito_user_pool.main.id
  
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}
```

---

## 🎯 Additional Recommendations

### 1. **Monitoring & Observability**

**Recommended Additions:**

#### CloudWatch Dashboards
- API Gateway request count & errors
- Lambda invocation metrics & errors
- DynamoDB read/write capacity & throttles
- S3 request metrics (v02)
- CloudFront cache hit ratio (v03 only)
- User authentication success/failure rates

#### CloudWatch Alarms
```
- API Gateway 5xx errors > 5% for 5 minutes
- Lambda error rate > 1% for 5 minutes
- DynamoDB throttled requests > 10
- CloudFront 5xx error rate > 5% (v03 only)
```

#### X-Ray Tracing (Optional)
- End-to-end request tracing
- Performance bottleneck identification
- Service map visualization

### 2. **Backup & Disaster Recovery**

**DynamoDB:**
- Point-in-time recovery (PITR) enabled
- On-demand backups before major changes
- Backup retention: 7-30 days
- Cross-region backup (advanced)

**S3:**
- Versioning enabled
- Lifecycle policies for old versions
- Cross-region replication (advanced)

**Terraform State:**
- S3 bucket versioning enabled
- Backup to separate account (paranoid mode)

### 3. **Cost Monitoring**

**AWS Budgets:**
```
- Development: Alert at $10/month
- Staging: Alert at $25/month
- Production: Alert at $50/month
```

**Cost Allocation Tags (Already Configured):**
```
Event: aws-cday-bolivia-2026
Project: magic-certs-local2prod
Owner: @pablo-ezequiel-inchausti
Environment: dev|staging|production
ManagedBy: terraform
```

**Tag-Based Cost Reports:**
- Filter by `Event` to see total AWS Community Day costs
- Filter by `Environment` to compare dev vs production costs
- Filter by `Project` to track this specific project
- Group by `Component` tag to see costs per service (frontend, api, database)

**Cost Optimization Using Tags:**
```bash
# Find all resources for cleanup
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026

# Calculate total monthly cost by tag
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=TAG,Key=Project
```

**Savings Opportunities:**
- Enable CloudWatch Logs retention (7-30 days, not indefinite)
- Use S3 Intelligent-Tiering for static assets
- Enable DynamoDB auto-scaling for predictable patterns
- Review Lambda memory allocation vs. duration

### 4. **Security Enhancements**

**AWS WAF (Optional but Recommended):**
- SQL injection protection
- XSS protection
- Rate limiting rules
- Geo-blocking (if needed)
- Bot protection

**AWS Shield Standard:**
- Free DDoS protection (automatically enabled)

**AWS Shield Advanced (Overkill for v02):**
- Only if expecting attacks

**Security Headers:**
```
Content-Security-Policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
```

### 5. **Performance Optimizations**

**S3 (v02):**
- Enable transfer acceleration (optional)
- Use appropriate cache-control headers
- Compress assets before upload (gzip)

**CloudFront (v03 only):**
- Enable compression (gzip, brotli)
- Custom cache policies
- Origin failover (advanced)

**API Gateway:**
- Enable API caching (5-300 seconds)
- Request/response transformations
- Throttling per stage

**Lambda:**
- Provisioned concurrency for critical functions (costs more)
- Lambda@Edge for personalization (advanced)
- Right-size memory allocation

**DynamoDB:**
- Use single-table design for cost efficiency
- Implement caching layer (ElastiCache - advanced)
- Use DynamoDB Accelerator (DAX) if needed

### 6. **Testing Strategy**

**Pre-Deployment:**
- Unit tests for Lambda functions
- Integration tests for API endpoints
- Load testing (Apache JMeter, Locust)
- Security scanning (OWASP ZAP)

**Post-Deployment:**
- Smoke tests after deployment
- Synthetic monitoring (CloudWatch Synthetics)
- Real user monitoring (RUM)

### 7. **Documentation Requirements**

**Should Create:**
- API documentation (OpenAPI/Swagger spec)
- Deployment runbook
- Disaster recovery playbook
- Troubleshooting guide
- User onboarding guide

### 8. **Resource Cleanup Strategy**

**Tag-Based Cleanup (Important for Demo):**

After AWS Community Day, easily find and remove all resources:

```bash
# List all resources with event tag
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --output table

# Or use Terraform destroy (recommended)
cd terraform/environments/production
terraform destroy -auto-approve

# Verify no resources remain
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026
```

**Scheduled Cleanup (Optional):**
Create Lambda function to auto-cleanup dev/staging resources:
- Triggered nightly
- Filters resources by tags: `Environment=dev` AND `Event=aws-cday-bolivia-2026`
- Destroys resources older than X days
- Saves costs during development

**Cost Impact:**
Proper tagging ensures zero resources are left running after demo, preventing surprise AWS bills.

---

## 📋 Implementation Phases

### Phase 1: Basic Infrastructure (Week 1-2)
- ✅ Terraform setup (state backend, modules)
- ✅ S3 + CloudFront for frontend
- ✅ DynamoDB tables
- ✅ Basic Lambda functions
- ✅ API Gateway configuration

### Phase 2: Authentication & Backend Logic (Week 2-3)
- ✅ Authentication Lambda (JWT)
- ✅ User registration/login
- ✅ Questions API endpoints
- ✅ Progress tracking API
- ✅ Guest session handling

### Phase 3: Frontend Integration (Week 3-4)
- ✅ Update frontend for API calls
- ✅ Implement authentication UI
- ✅ User profile page
- ✅ Progress dashboard
- ✅ Error handling & loading states

### Phase 4: CI/CD & Monitoring (Week 4)
- ✅ GitHub Actions workflows
- ✅ OIDC configuration
- ✅ CloudWatch dashboards
- ✅ Alarms and notifications
- ✅ Documentation

### Phase 5: Advanced Features (Optional)
- ⭕ Custom domain (magic-cert.glaciar.org)
- ⭕ Cognito integration
- ⭕ AWS WAF rules
- ⭕ Advanced monitoring

---

## ✅ Requirements Checklist

### Must Have (v02 Basic)
- [x] Serverless architecture (cost optimization)
- [x] DynamoDB for persistence
- [x] Guest access (no auth required)
- [x] Registered user tracking
- [x] Basic username/password auth
- [x] Terraform for infrastructure
- [x] S3 + CloudFront deployment
- [x] API Gateway + Lambda backend
- [x] HTTPS only

### Should Have (v02 Enhanced)
- [x] CI/CD with GitHub Actions
- [x] OIDC for secure deployments
- [x] CloudWatch monitoring
- [x] Backup strategy
- [x] Cost alerts
- [x] API documentation
- [ ] Load testing

### Nice to Have (v03 - Production Features)
- [ ] CloudFront CDN
- [ ] Custom domain (magic-cert.glaciar.org)
- [ ] HTTPS with ACM certificate
- [ ] Cognito integration
- [ ] Google OAuth
- [ ] AWS WAF
- [ ] Multi-region deployment (overkill)
- [ ] Advanced caching (ElastiCache)
- [ ] Real-time features (WebSocket)

---

## 🚫 Out of Scope for v02

**Explicitly NOT included in v02:**
- Multi-region deployment
- Real-time collaboration features
- Mobile app (native)
- Offline mode
- Video/interactive content
- Payment integration
- Admin dashboard (manual DynamoDB edits OK for now)
- Content management system

---

## 💰 Estimated Costs (Monthly)

### Development Environment
```
S3: $0.50 (static website)
API Gateway: $1
Lambda: $1-2
DynamoDB: $1-2
CloudWatch: $1
Secrets Manager: $0.40
Total: ~$5-7/month ✅
```

### Production (1000 users, 5000 quiz attempts/month)
```
S3: $2-3 (static website)
API Gateway: $3-5
Lambda: $5-10
DynamoDB: $5-10
CloudWatch: $2-3
Secrets Manager: $0.40
Total: ~$18-32/month ✅
```

### Production v03 with CloudFront (Future)
```
S3: $2-3
CloudFront: $5-15 ⚠️
API Gateway: $3-5
Lambda: $5-10
DynamoDB: $5-10
CloudWatch: $2-3
Secrets Manager: $0.40
Route53: $0.50
Total: ~$23-47/month
```

**Cost Savings in v02:** ~$8-15/month by postponing CloudFront

**Note:** AWS Free Tier can cover most costs in first 12 months.

---

## 🎓 Success Criteria

**v02 is successful if:**

1. ✅ Application accessible via HTTP (S3 static website URL)
2. ✅ Zero infrastructure costs when idle (serverless)
3. ✅ Guest users can take quizzes without registration
4. ✅ Registered users can track progress across sessions
5. ✅ All infrastructure defined in Terraform
6. ✅ Changes deployed via GitHub Actions
7. ✅ Production costs < $35/month at moderate traffic
8. ✅ 99.9% uptime (based on AWS SLAs)
9. ✅ API response time < 500ms (p95)
10. ✅ No manual server management required

**v03 upgrade goals:**
- HTTPS with custom domain (magic-cert.glaciar.org)
- CloudFront CDN for global performance
- Advanced security features (WAF)
- Cognito for OAuth providers

---

## 📝 Next Steps

1. **Review & Approve** this requirements document
2. **Create Terraform modules** based on architecture
3. **Implement Lambda functions** for backend logic
4. **Update frontend** for API integration
5. **Setup CI/CD pipeline**
6. **Test in development** environment
7. **Deploy to production**
8. **Monitor & iterate**

---

## 📞 Questions to Resolve Before Implementation

1. **AWS Account:** Which AWS account will be used? Separate accounts per environment?
2. **Domain Name:** Confirm `magic-cert.glaciar.org` - is `glaciar.org` already owned?
3. **Region:** Primary AWS region? (Recommend `us-east-1` for ACM certificate with CloudFront)
4. **Budget Approval:** Confirm monthly budget authorization
5. **GitHub Repository:** Public or private? Existing or new repo?
6. **Cognito Decision:** Start with basic auth or go straight to Cognito?
7. **Monitoring:** Email/SMS for CloudWatch alarms - who should be notified?

---

**Document Status:** ✅ Ready for Review  
**Next Action:** Review, approve, and begin implementation  
**Version:** 1.0

---

*This document should be reviewed and approved before starting v02 implementation.*
