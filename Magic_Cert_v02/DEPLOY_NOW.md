# 🚀 Deploy Magic Cert v02 - Quick Start

## ✅ What's Ready

All code and infrastructure is complete:

- ✅ **4 Lambda functions** (built and zipped)
- ✅ **Terraform configuration** (all modules ready)
- ✅ **Deployment scripts** (tested and working)
- ✅ **Complete tagging** (aws-cday-bolivia-2026)

## 📦 Lambda Functions Built

```
✓ questions.zip      (2.9 MB) - Fetch quiz questions
✓ auth.zip           (3.4 MB) - User registration/login  
✓ user-profile.zip   (3.2 MB) - User profile management
✓ user-progress.zip  (3.3 MB) - Progress tracking
```

## 🚀 Deploy in 3 Steps

### Step 1: Initialize Terraform

```bash
cd /Users/pabloinchausti/Desktop/xAWS-CDay-Bolivia/AWS-CommunityDay-Bolivia-2026-Despues-de-la-Magia/Magic_Cert_v02/terraform

export AWS_PROFILE=magic-account

terraform init
```

### Step 2: Plan and Apply

```bash
# Review what will be created
terraform plan

# Deploy (will ask for confirmation)
terraform apply
```

This creates:
- 1 S3 bucket (frontend)
- 1 API Gateway
- 4 Lambda functions
- 4 DynamoDB tables
- CloudWatch dashboards
- Secrets Manager (JWT secret)

**Cost:** ~$5-7/month

### Step 3: Seed Questions

```bash
cd ..
chmod +x scripts/seed-questions.sh
./scripts/seed-questions.sh
```

## 🎨 Deploy Frontend (Optional)

After infrastructure is deployed:

```bash
chmod +x scripts/deploy-frontend.sh
./scripts/deploy-frontend.sh
```

## 📊 Get URLs

```bash
cd terraform

# Website URL
terraform output website_url

# API URL
terraform output api_gateway_url

# All outputs
terraform output
```

## 🧪 Test Deployment

```bash
# Get API URL
API_URL=$(cd terraform && terraform output -raw api_gateway_url)

# Test questions endpoint
curl "$API_URL/questions?count=3"

# Expected: JSON with 3 questions
```

## 📈 View Monitoring

```bash
cd terraform
terraform output cloudwatch_dashboard_url
```

Open that URL in your browser to see:
- API Gateway metrics
- Lambda invocations
- Error rates
- Duration metrics

## 🗑️ Cleanup (When Done)

```bash
cd /Users/pabloinchausti/Desktop/xAWS-CDay-Bolivia/AWS-CommunityDay-Bolivia-2026-Despues-de-la-Magia/Magic_Cert_v02

chmod +x scripts/destroy.sh
./scripts/destroy.sh
```

Type `destroy` to confirm.

## 📝 What Gets Created

### DynamoDB Tables
```
magic-cert-questions-production  (SAA-C03 questions)
magic-cert-users-production      (User accounts)
magic-cert-progress-production   (Quiz attempts)
magic-cert-sessions-production   (Guest sessions, 24h TTL)
```

### Lambda Functions
```
magic-cert-questions-production    (GET /questions)
magic-cert-auth-production         (POST /auth/register, /auth/login)
magic-cert-user-profile-production (GET/PUT /user/profile)
magic-cert-user-progress-production (GET/POST /user/progress)
```

### S3 Bucket
```
magic-cert-frontend-production  (Static website hosting)
```

### Tags (All Resources)
```
Event:       aws-cday-bolivia-2026
Project:     magic-certs-local2prod
Owner:       @pablo-ezequiel-inchausti
Environment: production
ManagedBy:   terraform
```

## 🔍 Troubleshooting

### Problem: Terraform init fails

**Solution:** Check AWS credentials:
```bash
aws sts get-caller-identity --profile magic-account
```

### Problem: Bucket name conflict

**Solution:** Edit `terraform/variables.tf`:
```hcl
variable "project_name" {
  default = "magic-cert-YOUR-INITIALS"  # Change this
}
```

### Problem: Lambda deployment fails

**Solution:** Verify ZIP files exist:
```bash
ls -lh backend/functions/*.zip
```

Should show 4 files. If missing, run:
```bash
chmod +x scripts/build-lambda-functions.sh
./scripts/build-lambda-functions.sh
```

### Problem: Questions not loading

**Solution:** Seed DynamoDB:
```bash
./scripts/seed-questions.sh
```

## 📞 Support

Check the comprehensive documentation:
- `README.md` - Full documentation
- `ARCHITECTURE_REQ.md` - Architecture requirements
- `TAGGING_STRATEGY.md` - Tagging details

## ✨ Next Steps After Deployment

1. ✅ Test API endpoints
2. ✅ Deploy frontend
3. ✅ Register a test user
4. ✅ Take a quiz
5. ✅ View CloudWatch dashboard
6. ✅ Check AWS Cost Explorer (filter by Event tag)
7. ✅ Prepare AWS Community Day demo!

---

**Ready to deploy? Start with Step 1 above!** 🚀
