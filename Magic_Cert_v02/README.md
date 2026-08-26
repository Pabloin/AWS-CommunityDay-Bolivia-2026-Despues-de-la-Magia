# Magic Cert v02 - AWS Serverless Deployment

## 🎯 Overview

Magic Cert v02 is the AWS serverless version of the quiz application, featuring:

- **S3 Static Website** for frontend hosting (HTTP)
- **API Gateway** for REST API endpoints
- **Lambda Functions** for backend logic (Node.js 18)
- **DynamoDB** for data persistence (on-demand)
- **CloudWatch** for monitoring and logging
- **Terraform** for infrastructure as code
- **Complete tagging** for cost tracking

**Estimated Cost:** $5-7/month (development), $18-32/month (production with moderate traffic)

---

## 📋 Architecture

```
Users (HTTP)
    ↓
S3 Static Website → React App
    ↓
API Gateway (HTTPS) → Lambda Functions → DynamoDB
    ↓
CloudWatch (Logs & Metrics)
```

### AWS Resources

| Resource | Purpose | Count |
|----------|---------|-------|
| **S3 Bucket** | Frontend hosting | 1 |
| **API Gateway** | REST API | 1 |
| **Lambda Functions** | Backend logic | 4 |
| **DynamoDB Tables** | Data storage | 4 |
| **CloudWatch** | Monitoring | Dashboards + Alarms |
| **Secrets Manager** | JWT secret | 1 |

### Lambda Functions

1. **questions** - Fetch quiz questions
2. **auth** - User registration and login
3. **user-profile** - Get/update user profile
4. **user-progress** - Track quiz attempts and statistics

### DynamoDB Tables

1. **questions** - Quiz questions database
2. **users** - User accounts
3. **progress** - Quiz attempts and scores
4. **sessions** - Guest sessions (24h TTL)

---

## 🚀 Quick Start

### Prerequisites

- AWS Account with admin permissions
- AWS CLI configured with a local profile or environment credentials
- Terraform >= 1.0
- Node.js >= 18
- Git

Create local, ignored environment/backend files for your machine:

```bash
cp terraform/backend.hcl.example terraform/backend.hcl
cat > .env <<EOF
AWS_PROFILE=your-profile-name
AWS_REGION=us-east-1
EOF
```

Update `terraform/backend.hcl` with your backend bucket, state key, region, lock table, and optional local profile. Direct Terraform commands must run with `AWS_PROFILE` set, or through the scripts that source `.env`.

### Step 1: Deploy Infrastructure

```bash
cd Magic_Cert_v02
chmod +x scripts/*.sh
./scripts/deploy.sh
```

This will:
1. Initialize Terraform
2. Package Lambda functions deterministically from `backend/functions/*/package-lock.json`
3. Show infrastructure plan
4. Ask for confirmation
5. Deploy all AWS resources
6. Output deployment URLs

### Step 2: Seed Questions

```bash
./scripts/seed-questions.sh
```

Loads questions from `scripts/seed-data/` into DynamoDB.

### Step 3: Deploy Frontend

```bash
./scripts/deploy-frontend.sh
```

Builds and uploads React app to S3.

---

## 📁 Project Structure

```
Magic_Cert_v02/
├── frontend/
│   ├── src/                         # React app source
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── terraform/
│   ├── main.tf                    # Main configuration
│   ├── variables.tf               # Input variables
│   ├── outputs.tf                 # Output values
│   ├── backend.hcl.example        # Remote state config template
│   └── modules/
│       ├── frontend/              # S3 static website infrastructure
│       ├── database/              # DynamoDB tables
│       ├── api/                   # API Gateway + Lambda
│       ├── monitoring/            # CloudWatch
│       └── cors/                  # CORS configuration
│
├── backend/
│   └── functions/
│       ├── questions/             # Questions API
│       ├── auth/                  # Authentication
│       ├── user-profile/          # User profile
│       └── user-progress/         # Progress tracking
│
├── scripts/
│   ├── lib/env.sh                 # Shared script environment loader
│   ├── setup-backend.sh           # One-time remote state bootstrap
│   ├── deploy.sh                  # Full deployment
│   ├── seed-questions.sh          # Seed DynamoDB
│   ├── deploy-frontend.sh         # Deploy to S3
│   ├── get-urls.sh                # Print deployed URLs
│   └── destroy.sh                 # Cleanup everything
│
├── ARCHITECTURE_REQ.md            # Architecture requirements
└── README.md                      # This file
```

---

## 🏷️ Resource Tagging

All resources are automatically tagged with:

```
Event:       aws-cday-bolivia-2026
Project:     magic-certs-local2prod
Owner:       @pablo-ezequiel-inchausti
Environment: production
ManagedBy:   terraform
```

**Cost Tracking:**
- Go to AWS Cost Explorer
- Filter by tag: `Event = aws-cday-bolivia-2026`
- View exact costs for this project

---

## 🔗 API Endpoints

Base URL: `https://{api-id}.execute-api.us-east-1.amazonaws.com/production`

### Public Endpoints

```
GET  /questions
     ?certification=SAA-C03
     &domain=all|domain1|domain2|domain3|domain4
     &count=3|5|10
     
     Returns: { success, questions[], total, returned }
```

### Authentication Endpoints

```
POST /auth/register
     Body: { email, password, name? }
     Returns: { success, user, token }

POST /auth/login
     Body: { email, password }
     Returns: { success, user, token }
```

### Protected Endpoints (Require JWT Token)

```
GET  /user/profile
     Headers: { Authorization: "Bearer <token>" }
     Returns: { success, profile }

GET  /user/progress?limit=20
     Headers: { Authorization: "Bearer <token>" }
     Returns: { success, history[] }

GET  /user/progress?stats=true
     Headers: { Authorization: "Bearer <token>" }
     Returns: { success, totalAttempts, averageScore, ... }

POST /user/progress
     Headers: { Authorization: "Bearer <token>" }
     Body: { certification, dataset, domain, totalQuestions, 
             correctAnswers, score, answers[], durationSeconds }
     Returns: { success, attempt }
```

---

## 🧪 Testing

### Test API Endpoints

```bash
# Get API URL
cd terraform
API_URL=$(terraform output -raw api_gateway_url)

# Test questions endpoint
curl "$API_URL/questions?count=3"

# Test registration
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Test login
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Test Frontend

```bash
# Get website URL
cd terraform
terraform output website_url
```

Open in browser and test:
1. Welcome page loads
2. Quiz starts with questions
3. Guest mode works
4. Registration works
5. Login works
6. Progress tracking works

---

## 📊 Monitoring

### CloudWatch Dashboard

```bash
cd terraform
terraform output cloudwatch_dashboard_url
```

Monitors:
- API Gateway requests and errors
- Lambda invocations and errors
- Lambda duration
- DynamoDB operations

### Resource Groups

View all project resources in one place:

```bash
cd terraform
terraform output resource_group_url
```

This opens the AWS Console showing:
- All S3 buckets
- All Lambda functions
- All DynamoDB tables
- All CloudWatch resources
- Everything tagged for this project

**Useful for:**
- Quick resource overview
- Cost tracking by tag
- Bulk operations
- Presentation demos

See `ARCHITECTURE_REQ.md` for the tagging strategy and resource grouping details.

### CloudWatch Alarms

If `alert_email` is configured, you'll receive alerts for:
- API Gateway 5XX errors (> 5 in 5 minutes)
- Lambda function errors (> 3 in 5 minutes)
- Lambda throttles (> 5 in 5 minutes)

### View Logs

```bash
# Questions function logs
aws logs tail /aws/lambda/magic-cert-questions-production --follow

# Auth function logs
aws logs tail /aws/lambda/magic-cert-auth-production --follow
```

---

## 💰 Cost Optimization

### Current Cost Breakdown (Production)

```
S3:                 $2-3/month
API Gateway:        $3-5/month
Lambda:             $5-10/month
DynamoDB:           $5-10/month
CloudWatch:         $2-3/month
Secrets Manager:    $0.40/month
───────────────────────────────
Total:              $18-32/month
```

### Cost Reduction Tips

1. **Enable CloudWatch Logs retention** (7-14 days max)
2. **Use on-demand pricing** for DynamoDB (already configured)
3. **Monitor Lambda memory** allocation vs duration
4. **Delete unused log groups** after testing
5. **Destroy dev/staging** when not in use

### Track Costs

```bash
# View costs by tag
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=TAG,Key=Event \
```

---

## 🔧 Troubleshooting

### Terraform Errors

**Problem:** Lambda package creation fails during Terraform apply

**Solution:** Check that Node.js/npm are installed locally and each function has a valid `package-lock.json`:
```bash
npm --version
ls backend/functions/*/package-lock.json
```

**Problem:** `Error: creating S3 bucket: BucketAlreadyExists`

**Solution:** Bucket names must be globally unique. Change `project_name` in `terraform/variables.tf`:
```hcl
variable "project_name" {
  default     = "magic-cert-YOURNAME"
}
```

### Lambda Errors

**Problem:** Lambda function returning 500 errors

**Solution:** Check CloudWatch logs:
```bash
```

Common issues:
- Missing environment variables
- DynamoDB permissions
- Secrets Manager access

### API Gateway Errors

**Problem:** CORS errors in browser

**Solution:** Verify CORS module is applied to all resources. Check browser console for specific header issues.

### DynamoDB Errors

**Problem:** `AccessDeniedException` when querying tables

**Solution:** Verify IAM role has permissions:
```bash
cd terraform
terraform state show module.api.aws_iam_role_policy.lambda_dynamodb
```

---

## 🗑️ Cleanup

### Destroy All Resources

```bash
./scripts/destroy.sh
```

This will:
1. Empty S3 buckets
2. Destroy all Terraform-managed resources
3. Remove DynamoDB tables and data
4. Delete Lambda functions
5. Remove CloudWatch logs

**⚠️ Warning:** This is irreversible!

### Manual Cleanup

If automatic cleanup fails:

```bash
# List all resources by tag
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \

# Delete specific resources manually
```

---

## 📝 Development Workflow

### Make Infrastructure Changes

1. Edit Terraform files in `terraform/` or `terraform/modules/`
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply changes

### Update Lambda Functions

1. Edit function code in `backend/functions/FUNCTION_NAME/`
2. Run `terraform apply` to package and deploy updates

### Update Frontend

1. Edit the React app in `frontend/`
2. Run `./scripts/deploy-frontend.sh`

---

## 🎓 AWS Community Day Presentation

### Demo Flow

1. **Show v01 (localhost)**
   - "AI-generated quiz app running locally"
   - Cost: $0

2. **Show v02 deployment**
   - Run `./scripts/deploy.sh`
   - Show Terraform plan
   - Explain resources being created
   - Show tagging strategy

3. **Show AWS Console**
   - S3 bucket with static files
   - DynamoDB tables
   - Lambda functions
   - API Gateway
   - CloudWatch dashboard

4. **Show Cost Explorer**
   - Filter by `Event` tag
   - Show current costs: ~$5-7/month
   - Compare to traditional EC2: ~$20-50/month

5. **Test Live Application**
   - Open website URL
   - Take a quiz (guest mode)
   - Register user
   - Login
   - Show progress tracking

6. **Show v03 Roadmap**
   - Add CloudFront for HTTPS
   - Custom domain (magic-cert.glaciar.org)
   - Cost increases to ~$25-30/month
   - But adds production features

### Key Talking Points

- ✅ **Serverless = Pay per use**
- ✅ **Infrastructure as Code** with Terraform
- ✅ **Complete tagging** for cost visibility
- ✅ **100% AWS native** (no external services)
- ✅ **Auto-scaling** (no capacity planning)
- ✅ **High availability** (multi-AZ by default)

---

## 📚 Additional Resources

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway Best Practices](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-develop.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Cost Allocation Tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)

---

## 🤝 Contributing

For improvements or bug fixes:

1. Create a new branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Submit pull request

---

## 📄 License

MIT License - AWS Community Day Bolivia 2026

---

## 👤 Author

**Pablo Ezequiel Inchausti** (@pablo-ezequiel-inchausti)

**Event:** AWS Community Day Bolivia 2026  
**Talk:** "Después de la Magia" - From AI-Generated App to AWS Production

---

**Questions?** Open an issue or contact the author.

**Cost concerns?** Remember to destroy resources when not in use: `./scripts/destroy.sh`
