# AWS Resource Groups for Magic Cert v02

## 🎯 Overview

Resource Groups allow you to view and manage all Magic Cert resources together in the AWS Console.

## 📦 Resource Groups Created

### 1. **Main Project Group** (`magic-cert-production`)

**Filters:**
- `Event = aws-cday-bolivia-2026`
- `Project = magic-certs-local2prod`
- `Environment = production`

**Purpose:** View all project resources in one place

**Includes:**
- S3 buckets
- Lambda functions
- DynamoDB tables
- API Gateway
- CloudWatch resources
- Secrets Manager
- All other project resources

### 2. **By Owner Group** (`magic-cert-by-owner-production`)

**Filters:**
- `Owner = @pablo-ezequiel-inchausti`
- `Event = aws-cday-bolivia-2026`

**Purpose:** View all resources owned by you across all projects

### 3. **Event Group** (`aws-cday-bolivia-2026-all-resources`)

**Filters:**
- `Event = aws-cday-bolivia-2026`

**Purpose:** View ALL resources for AWS Community Day Bolivia 2026 (across multiple projects if any)

---

## 🌐 Access Resource Groups

### After Deployment

Get the URLs:
```bash
cd terraform
terraform output resource_group_url
terraform output tag_editor_url
```

### Direct AWS Console URLs

**Main Resource Group:**
```
https://console.aws.amazon.com/resource-groups/group/magic-cert-production
```

**Tag Editor:**
```
https://console.aws.amazon.com/resource-groups/tag-editor
```

**Resource Groups Home:**
```
https://console.aws.amazon.com/resource-groups/home
```

---

## 📊 Using Resource Groups

### View All Resources

1. Go to AWS Console → Resource Groups & Tag Editor
2. Click on "Saved Resource Groups"
3. Select `magic-cert-production`
4. See all resources with:
   - Resource type
   - Resource name
   - Region
   - Tags
   - Status

### Tag Editor

1. Go to Tag Editor in AWS Console
2. Select region: `us-east-1`
3. Add filters:
   - Tag: `Event = aws-cday-bolivia-2026`
4. Click "Search resources"
5. View all tagged resources

### Bulk Operations

From a Resource Group, you can:
- ✅ View resource details
- ✅ Navigate to individual resources
- ✅ See resource relationships
- ✅ Export resource list
- ✅ Manage tags in bulk

---

## 💰 Cost Tracking with Resource Groups

### AWS Cost Explorer Integration

1. Go to **AWS Cost Explorer**
2. Filter by tags:
   - `Event = aws-cday-bolivia-2026`
   - `Project = magic-certs-local2prod`
3. View costs grouped by:
   - Service
   - Tag
   - Resource

### Cost Allocation Tags

After deployment, activate these tags in AWS Billing:
1. Go to **Billing → Cost Allocation Tags**
2. Activate:
   - ✅ `Event`
   - ✅ `Project`
   - ✅ `Owner`
   - ✅ `Environment`
3. Wait 24 hours for tags to appear in Cost Explorer

---

## 🔍 Use Cases for Presentations

### 1. Show All Resources at Once

During your AWS Community Day presentation:
1. Open Resource Group: `magic-cert-production`
2. Show all resources in one view
3. Highlight the tagging strategy

**Talking point:**
> "Every resource is tagged and grouped. This is how we track costs and manage resources in production."

### 2. Demonstrate Cost Tracking

1. Open AWS Cost Explorer
2. Filter by `Event = aws-cday-bolivia-2026`
3. Show exact costs for the project

**Talking point:**
> "Using tags and resource groups, we can track every dollar spent on this project. Currently running at $X/month."

### 3. Quick Resource Discovery

1. Open Tag Editor
2. Search by tag: `Project = magic-certs-local2prod`
3. Show instant resource discovery

**Talking point:**
> "With proper tagging, finding resources is instant. No manual searching through services."

---

## 🛠️ Managing Resources via CLI

### List all resources in a group

```bash
# Using Resource Groups API
aws resource-groups list-group-resources \
  --group-name magic-cert-production \
  --profile magic-account \
  --region us-east-1

# Using Tag API (all resources with Event tag)
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --profile magic-account \
  --region us-east-1
```

### Count resources by type

```bash
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --profile magic-account \
  --region us-east-1 \
  | jq '.ResourceTagMappingList | group_by(.ResourceARN | split(":")[2]) | map({service: .[0].ResourceARN | split(":")[2], count: length})'
```

### Export resource list

```bash
aws resource-groups list-group-resources \
  --group-name magic-cert-production \
  --profile magic-account \
  --region us-east-1 \
  --output table > magic-cert-resources.txt
```

---

## 📋 Resource Group Query Structure

The resource groups use **Tag-based queries**:

```json
{
  "ResourceTypeFilters": ["AWS::AllSupported"],
  "TagFilters": [
    {
      "Key": "Event",
      "Values": ["aws-cday-bolivia-2026"]
    },
    {
      "Key": "Project",
      "Values": ["magic-certs-local2prod"]
    },
    {
      "Key": "Environment",
      "Values": ["production"]
    }
  ]
}
```

This matches **all AWS resource types** with these tags.

---

## 🧹 Cleanup Using Resource Groups

### Find all resources before destruction

```bash
# List everything
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --profile magic-account \
  --region us-east-1

# Count total
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --profile magic-account \
  --region us-east-1 \
  | jq '.ResourceTagMappingList | length'
```

### Verify cleanup after destruction

```bash
# After running terraform destroy, verify no resources remain
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Event,Values=aws-cday-bolivia-2026 \
  --profile magic-account \
  --region us-east-1

# Should return empty list or only IAM roles (sometimes delayed)
```

---

## 📈 Advanced: CloudWatch Insights

Resource Groups can be used with CloudWatch:

```bash
# Create CloudWatch dashboard for the resource group
aws cloudwatch put-dashboard \
  --dashboard-name magic-cert-resources \
  --dashboard-body file://dashboard.json \
  --profile magic-account
```

---

## 🎓 Best Practices

### 1. ✅ Consistent Tagging
All resources have the same core tags:
- `Event`
- `Project`
- `Owner`
- `Environment`
- `ManagedBy`

### 2. ✅ Hierarchical Grouping
- Event level (all event resources)
- Project level (this specific project)
- Owner level (your resources)

### 3. ✅ Cost Visibility
Tags enable:
- Cost allocation by project
- Budget tracking by event
- Owner accountability

### 4. ✅ Easy Discovery
Find resources in seconds vs minutes of manual searching

### 5. ✅ Bulk Management
Apply changes to entire groups instead of individual resources

---

## 📚 Additional Resources

**AWS Documentation:**
- [Resource Groups User Guide](https://docs.aws.amazon.com/ARG/latest/userguide/)
- [Tag Editor](https://docs.aws.amazon.com/ARG/latest/userguide/tag-editor.html)
- [Cost Allocation Tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)

**Terraform Documentation:**
- [aws_resourcegroups_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/resourcegroups_group)

---

**Last Updated:** 2026  
**Project:** Magic Cert v02  
**Event:** AWS Community Day Bolivia 2026
