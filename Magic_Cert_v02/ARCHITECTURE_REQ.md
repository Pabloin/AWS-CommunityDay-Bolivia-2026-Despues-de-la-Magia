# Magic Cert v02 - Architecture Requirements

## Document Purpose

This file is the architecture contract for v02. Its utility is to keep the repo, Terraform, demo scripts, and talk narrative aligned.

Use it to answer:

- What is v02 supposed to prove?
- What is intentionally excluded until v03?
- Which decisions are architectural, not accidental script leftovers?
- What must be true before the AWS Community Day demo?

This should not be a dump of every possible AWS best practice. It should be short enough to audit before a talk and concrete enough to catch drift in the codebase.

## Presentation Context

**Event:** AWS Community Day Bolivia 2026  
**Talk:** "Despues de la Magia"  
**Story:** moving from an AI-generated local app to a deliberately designed AWS architecture.

Architecture progression:

| Version | Scope | Expected Cost | Message |
|---------|-------|---------------|---------|
| v01 | Local app | $0/month | The AI-generated starting point works locally. |
| v02 | Serverless AWS MVP | ~$5-10/month at low traffic | Architecture turns the demo into a real cloud system. |
| v03 | Production hardening | ~$20-30/month+ | Add custom domain, HTTPS frontend, CDN, stronger auth, CI/CD. |

## v02 Architecture Decision

v02 is a **demo-grade serverless cloud architecture**, not the final production architecture.

Key decisions:

- Use S3 static website hosting for the React frontend.
- Use API Gateway REST API over HTTPS for backend calls.
- Use Lambda for backend business logic.
- Use DynamoDB on-demand tables for persistence.
- Use Terraform for infrastructure and Lambda packaging.
- Keep frontend deployment and question seeding as explicit operational scripts.
- Skip CloudFront, Route53, ACM, Cognito, WAF, and GitHub Actions until v03.

Important tradeoff:

- The frontend website is served by S3 website hosting over HTTP in v02.
- API Gateway remains HTTPS.
- This is acceptable for the talk/demo cost story, but it is not acceptable for a real production login experience.

## Current Repository Shape

```text
Magic_Cert_v02/
├── frontend/                       # React/Vite app
├── backend/
│   └── functions/                  # Lambda source packages
│       ├── questions/
│       ├── auth/
│       ├── user-profile/
│       └── user-progress/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── backend.hcl.example         # committed template
│   └── modules/
│       ├── api/
│       ├── database/
│       ├── frontend/
│       ├── monitoring/
│       └── resource-group/
└── scripts/
    ├── lib/env.sh                  # shared AWS profile/env loader
    ├── setup-backend.sh            # one-time backend bootstrap
    ├── deploy.sh                   # Terraform deploy wrapper
    ├── deploy-frontend.sh          # build and upload frontend artifact
    ├── seed-questions.sh           # load demo data
    ├── get-urls.sh                 # print deployed URLs
    └── destroy.sh                  # teardown helper
```

Local-only files:

- `.env`: local AWS profile/region.
- `terraform/backend.hcl`: local backend configuration.
- `terraform/.terraform-build/`: generated Lambda build output.
- `terraform/tfplan`: generated plan file.
- `frontend/dist/`: generated frontend build output.

These should stay ignored.

## Infrastructure Requirements

### Terraform Ownership

Terraform owns:

- S3 bucket for frontend static website hosting.
- API Gateway REST API and stage.
- Lambda functions, IAM role/policies, and log groups.
- DynamoDB tables.
- Secrets Manager secret for JWT signing.
- CloudWatch dashboard/alarms.
- Resource Groups for tag-based discovery.
- S3 remote state bucket and lock table bootstrap resources.

Terraform also packages Lambda functions deterministically from:

- `backend/functions/*/index.js`
- `backend/functions/*/package.json`
- `backend/functions/*/package-lock.json`

Terraform does not own:

- Uploading frontend build artifacts.
- Seeding demo questions.
- Local AWS profile selection.
- Manual console actions such as enabling cost allocation tags.

Reasoning: infrastructure should be reproducible through Terraform, while application artifact deployment and demo data are explicit operational steps.

### AWS Profile and Backend

AWS credentials are environment concerns, not committed Terraform provider settings.

Requirements:

- `provider "aws"` must not hardcode `profile`.
- Scripts load `AWS_PROFILE` and `AWS_REGION` from local `.env`.
- `terraform/backend.hcl` may contain a local profile, but it is ignored.
- `terraform/backend.hcl.example` documents the expected backend shape.

Current backend pattern:

```hcl
terraform {
  backend "s3" {}
}
```

Then initialize with:

```bash
terraform init -backend-config=backend.hcl
```

## Runtime Architecture

```text
Users
  |
  | HTTP
  v
S3 Static Website
  |
  | HTTPS API calls
  v
API Gateway REST API
  |
  v
Lambda functions
  |
  v
DynamoDB tables

CloudWatch receives logs and metrics.
Secrets Manager stores the JWT secret.
Resource Groups expose tagged resource views.
```

### AWS Services

| Service | v02 Use | Notes |
|---------|---------|-------|
| S3 | Static website bucket | Public website hosting for demo frontend. |
| API Gateway | REST API | HTTPS backend endpoint. |
| Lambda | Backend logic | Questions, auth, profile, progress. |
| DynamoDB | Persistence | On-demand billing, PITR enabled. |
| Secrets Manager | JWT secret | Avoids committed secrets. |
| CloudWatch | Logs, dashboard, alarms | Retention should stay bounded. |
| Resource Groups | Discovery by tags | Useful for demo and cleanup. |

## API Requirements

Implemented v02 endpoints:

```text
GET  /questions
POST /auth/register
POST /auth/login
GET  /user/profile
GET  /user/progress
POST /user/progress
```

Out of scope for current v02 unless explicitly added:

- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /certifications`
- `POST /sessions`
- `PUT /user/profile`
- `GET /user/statistics`

Requirement: documentation and frontend calls must use the actual deployed paths. The current API base URL already includes the stage, for example:

```text
https://rthmygn9wl.execute-api.us-east-1.amazonaws.com/production
```

## Data Requirements

### DynamoDB Tables

| Table | Purpose | Current Requirement |
|-------|---------|---------------------|
| `magic-cert-questions-production` | Question catalog | Seeded from `scripts/seed-data/`. |
| `magic-cert-users-production` | Registered user records | Used by auth/profile Lambda code. |
| `magic-cert-progress-production` | Quiz progress | Used by progress Lambda code. |
| `magic-cert-sessions-production` | Guest sessions | TTL enabled for temporary records. |

Requirements:

- Use on-demand billing for demo simplicity.
- Enable point-in-time recovery.
- Use AWS-managed encryption at rest.
- Keep seed data outside Terraform apply.
- Seed data must be repeatable and safe to rerun.

## Security Requirements

### v02 Must Have

- No secrets committed to Git.
- JWT secret stored in Secrets Manager.
- Passwords hashed before storage.
- Lambda role has only DynamoDB and Secrets Manager permissions needed by the functions.
- CORS configured for frontend access.
- CloudWatch log retention set, not infinite.
- S3 state bucket encrypted and versioned.
- Public S3 access limited to static website assets.

### v02 Known Gaps

These are acceptable for the demo but should be called out honestly:

- Frontend is HTTP because S3 website hosting is used without CloudFront.
- No Cognito.
- No WAF.
- No custom domain.
- No frontend HTTPS.
- No formal refresh-token flow.
- No CI/CD pipeline.
- API Gateway throttling/rate limiting is not yet a first-class requirement in Terraform.
- Lambda functions currently share one execution role.

### v03 Security Requirements

- CloudFront with HTTPS-only viewer policy.
- ACM certificate for custom domain.
- Route53 DNS.
- Cognito or external OIDC provider for production authentication.
- WAF managed rules and rate limiting.
- Separate Lambda roles if least-privilege boundaries need to be stricter.
- CI/CD with GitHub OIDC, no long-lived AWS keys.

## Cost Requirements

v02 cost targets:

- Idle/demo: under $10/month.
- Low traffic: under $20/month.
- Moderate demo traffic: under $50/month.

Cost choices:

- S3 website hosting instead of CloudFront.
- DynamoDB on-demand.
- Lambda/API Gateway pay per request.
- CloudWatch log retention set to 7 days.
- No NAT Gateway, EC2, RDS, OpenSearch, or always-on compute.

Manual requirement:

- Activate AWS cost allocation tags in Billing after deployment. Terraform can tag resources, but AWS Billing tag activation is an account-level action.

## Tagging Requirements

Provider default tags:

```hcl
Event       = "aws-cday-bolivia-2026"
Project     = "magic-certs-local2prod"
Owner       = var.owner
Environment = var.environment
ManagedBy   = "terraform"
Repository  = var.repository_url
```

Resource-specific tags should add context:

| Resource Type | Extra Tags |
|---------------|------------|
| Lambda | `Component`, `Function` |
| DynamoDB | `Component`, `DataType` |
| S3 website bucket | `Component`, `Purpose` |
| CloudWatch logs | `Component` |

Operational checks:

```bash
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --output table
```

## Script Policy

Shell scripts are allowed only when they represent a clear operator workflow.

Allowed scripts:

- `setup-backend.sh`: bootstrap remote state resources.
- `deploy.sh`: wrapper around Terraform init/plan/apply.
- `deploy-frontend.sh`: build and upload frontend artifact.
- `seed-questions.sh`: load demo questions.
- `get-urls.sh`: print useful outputs for demo.
- `destroy.sh`: teardown resources.

Not allowed:

- Manual Lambda ZIP packaging scripts.
- Hidden Terraform provisioners that seed data.
- Hidden Terraform provisioners that deploy frontend artifacts.
- Hardcoded AWS profiles in scripts or provider config.

## Demo Acceptance Criteria

Before the talk, all of these should pass:

```bash
cd Magic_Cert_v02
bash -n scripts/*.sh scripts/lib/env.sh
npm --prefix frontend run build
terraform -chdir=terraform validate
terraform -chdir=terraform plan
./scripts/get-urls.sh
curl "$(terraform -chdir=terraform output -raw api_gateway_url)/questions?count=3"
```

Expected Terraform result:

```text
No changes. Your infrastructure matches the configuration.
```

Expected demo URLs:

- Frontend: `http://magic-cert-frontend-production.s3-website-us-east-1.amazonaws.com`
- API: `https://rthmygn9wl.execute-api.us-east-1.amazonaws.com/production`

## v03 Backlog

Production hardening candidates:

- CloudFront distribution in front of S3.
- HTTPS frontend with ACM certificate.
- Custom domain with Route53.
- S3 bucket private behind CloudFront origin access control.
- Cognito or OIDC-based authentication.
- GitHub Actions CI/CD with AWS OIDC.
- API Gateway throttling and usage plans.
- WAF managed rules and rate limits.
- OpenAPI spec.
- Automated smoke tests.
- Budget alarms.
- Separate dev/staging/prod environment directories if the project needs parallel environments.

## Requirements Checklist

### v02 Must Have

- [x] S3 static website infrastructure.
- [x] API Gateway REST API.
- [x] Lambda backend functions.
- [x] DynamoDB persistence.
- [x] Secrets Manager JWT secret.
- [x] Terraform-managed infrastructure.
- [x] Remote Terraform state.
- [x] Deterministic Lambda packaging from source and lockfiles.
- [x] Explicit frontend deployment script.
- [x] Explicit question seeding script.
- [x] Resource tagging.
- [x] CloudWatch logs and dashboard.
- [x] Clean Terraform plan.

### v02 Should Have Before Talk

- [ ] Confirm frontend flow works from the public S3 website URL.
- [ ] Confirm registration/login works from the browser.
- [ ] Confirm question seeding count is correct.
- [ ] Confirm Resource Groups show the expected tagged resources.
- [ ] Confirm Cost Allocation Tags are activated in AWS Billing.
- [ ] Capture a fallback screenshot or local recording for the demo.

### Explicitly Out of Scope for v02

- CloudFront.
- Custom domain.
- HTTPS frontend.
- Cognito.
- WAF.
- GitHub Actions deployment.
- Multi-region architecture.
- Admin dashboard.
- Native mobile app.
- Payment functionality.
