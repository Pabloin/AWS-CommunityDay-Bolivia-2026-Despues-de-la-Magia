# SAA-C03 Questions Guide

## 📋 Overview

This guide explains the structure of the extended SAA-C03 question bank organized by official exam domains.

---

## 📊 Exam Domain Structure (SAA-C03)

Based on the official AWS Certified Solutions Architect - Associate exam guide:

| Domain ID | Domain Name | Weight | Questions Created |
|-----------|-------------|--------|-------------------|
| **Domain 1** | Design Secure Architectures | 30% | 4 questions |
| **Domain 2** | Design Resilient Architectures | 26% | 4 questions |
| **Domain 3** | Design High-Performing Architectures | 24% | 4 questions |
| **Domain 4** | Design Cost-Optimized Architectures | 20% | 4 questions |

**Total: 16 questions** (Original 10 + 6 new domain-specific questions)

---

## 🆕 New Question File

**Location:** `src/data/saa-c03-questions-extended.json`

### Key Features

✅ **Domain-Organized**: Each question mapped to official exam domains  
✅ **Unique IDs**: Format `saa-c03-d{domain}-{number}` (e.g., `saa-c03-d1-001`)  
✅ **Domain Metadata**: Includes `domain`, `domainId`, and `domainName` fields  
✅ **Compatible**: Same structure as original questions  
✅ **Ready to Use**: Can be imported directly into the app

---

## 📝 Question Structure

### Extended Fields

Each question now includes:

```json
{
  "id": "saa-c03-d1-001",           // Unique ID with domain prefix
  "certification": "SAA-C03",
  "domain": "domain1",               // ✨ NEW: Domain identifier
  "domainName": "Design Secure Architectures",  // ✨ NEW: Domain name
  "category": "Security",
  "subcategory": "IAM",
  "difficulty": "easy|medium|hard",
  "question": "Question text...",
  "options": [...],
  "explanation": "...",
  "references": [...],
  "tags": [...]
}
```

### Domain Mapping

```
Domain 1 (d1) = Design Secure Architectures
Domain 2 (d2) = Design Resilient Architectures  
Domain 3 (d3) = Design High-Performing Architectures
Domain 4 (d4) = Design Cost-Optimized Architectures
```

---

## 📚 Question Breakdown by Domain

### Domain 1: Design Secure Architectures (30%)

**Questions Created: 4**

| ID | Category | Subcategory | Difficulty | Topic |
|----|----------|-------------|------------|-------|
| saa-c03-d1-001 | Security | IAM | Medium | IAM Identity Center with Active Directory |
| saa-c03-d1-002 | Security | Data Protection | Hard | KMS Customer Managed Keys |
| saa-c03-d1-003 | Networking | VPC | Medium | NAT Gateway for private subnets |
| saa-c03-d1-004 | Security | WAF | Medium | WAF + Shield for DDoS protection |

**Topics Covered:**
- Identity and access management
- Encryption and key management
- Network security
- Application security (WAF, Shield)

---

### Domain 2: Design Resilient Architectures (26%)

**Questions Created: 4**

| ID | Category | Subcategory | Difficulty | Topic |
|----|----------|-------------|------------|-------|
| saa-c03-d2-001 | Compute | Auto Scaling | Medium | Target tracking scaling with ALB |
| saa-c03-d2-002 | Database | RDS | Hard | Multi-AZ deployment for HA |
| saa-c03-d2-003 | Storage | S3 | Medium | S3 Versioning + MFA Delete |
| saa-c03-d2-004 | Application Integration | SQS | Medium | FIFO queues for ordering |

**Topics Covered:**
- High availability and fault tolerance
- Auto scaling strategies
- Data protection and recovery
- Decoupled architectures

---

### Domain 3: Design High-Performing Architectures (24%)

**Questions Created: 4**

| ID | Category | Subcategory | Difficulty | Topic |
|----|----------|-------------|------------|-------|
| saa-c03-d3-001 | Database | DynamoDB | Medium | DynamoDB DAX for low latency |
| saa-c03-d3-002 | Content Delivery | CloudFront | Easy | Global content delivery |
| saa-c03-d3-003 | Compute | EC2 | Hard | Placement groups for HPC |
| saa-c03-d3-004 | Storage | EFS | Medium | Shared NFS storage |

**Topics Covered:**
- Performance optimization
- Caching strategies
- Content delivery networks
- High-performance computing
- Storage performance

---

### Domain 4: Design Cost-Optimized Architectures (20%)

**Questions Created: 4**

| ID | Category | Subcategory | Difficulty | Topic |
|----|----------|-------------|------------|-------|
| saa-c03-d4-001 | Compute | EC2 | Medium | Spot Instances for batch processing |
| saa-c03-d4-002 | Storage | S3 | Medium | Lifecycle policies for cost savings |
| saa-c03-d4-003 | Compute | Lambda | Easy | Serverless for sporadic workloads |
| saa-c03-d4-004 | Database | RDS | Hard | Automated stop/start for dev databases |

**Topics Covered:**
- EC2 pricing models (Spot, Reserved, On-Demand)
- Storage class optimization
- Serverless cost benefits
- Resource scheduling

---

## 🔄 Integration with App

### Option 1: Replace Existing Questions

```typescript
// src/App.tsx
import saaC03Data from './data/saa-c03-questions-extended.json';

const questions: Question[] = saaC03Data.questions;
```

### Option 2: Combine Both Files

```typescript
// src/App.tsx
import originalQuestions from './data/saa-c03-questions.json';
import extendedQuestions from './data/saa-c03-questions-extended.json';

const questions: Question[] = [
  ...originalQuestions.questions,
  ...extendedQuestions.questions
];

// Total: 26 questions
```

### Option 3: Filter by Domain

```typescript
// src/App.tsx
import saaC03Data from './data/saa-c03-questions-extended.json';

// Get only Domain 1 questions (Security)
const domain1Questions = saaC03Data.questions.filter(
  q => q.domain === 'domain1'
);

// Get mixed domains quiz
const mixedQuiz = [
  ...saaC03Data.questions.filter(q => q.domain === 'domain1').slice(0, 3),
  ...saaC03Data.questions.filter(q => q.domain === 'domain2').slice(0, 3),
  ...saaC03Data.questions.filter(q => q.domain === 'domain3').slice(0, 2),
  ...saaC03Data.questions.filter(q => q.domain === 'domain4').slice(0, 2),
];
```

---

## 🎯 Enhanced Features You Can Add

### 1. Domain-Based Filtering

```typescript
// Add domain filter UI
const [selectedDomain, setSelectedDomain] = useState<string>('all');

const filteredQuestions = selectedDomain === 'all'
  ? questions
  : questions.filter(q => q.domain === selectedDomain);
```

### 2. Domain Statistics

```typescript
// Calculate score by domain
const domainStats = {
  domain1: { correct: 0, total: 0 },
  domain2: { correct: 0, total: 0 },
  domain3: { correct: 0, total: 0 },
  domain4: { correct: 0, total: 0 },
};

// Show breakdown: "Domain 1: 3/4 correct (75%)"
```

### 3. Weighted Scoring

```typescript
// Score based on official exam weights
const domainWeights = {
  domain1: 0.30, // 30%
  domain2: 0.26, // 26%
  domain3: 0.24, // 24%
  domain4: 0.20, // 20%
};

const weightedScore = Object.entries(domainStats).reduce((total, [domain, stats]) => {
  const domainScore = (stats.correct / stats.total) * 100;
  return total + (domainScore * domainWeights[domain]);
}, 0);
```

---

## 📋 Question Quality Standards

All questions follow AWS best practices:

✅ **Realistic Scenarios**: Based on real-world use cases  
✅ **Clear Requirements**: Unambiguous question text  
✅ **Plausible Distractors**: Wrong answers that test understanding  
✅ **Detailed Explanations**: Why correct and why others are wrong  
✅ **Official References**: Links to AWS documentation  
✅ **Relevant Tags**: For easy filtering and search

---

## 🔍 Question ID Convention

Format: `saa-c03-d{domain}-{sequential}`

Examples:
- `saa-c03-d1-001` = Domain 1, Question 1
- `saa-c03-d2-004` = Domain 2, Question 4
- `saa-c03-d3-002` = Domain 3, Question 2
- `saa-c03-d4-003` = Domain 4, Question 3

This format:
- Makes domain filtering easy
- Maintains uniqueness
- Shows question organization at a glance
- Allows for easy expansion (d1-005, d1-006, etc.)

---

## 📈 Expanding the Question Bank

### To Add More Questions:

1. **Follow the ID convention**: `saa-c03-d{domain}-{next-number}`
2. **Include all required fields**: domain, domainName, category, etc.
3. **Maintain difficulty distribution**: Mix of easy (30%), medium (50%), hard (20%)
4. **Cover diverse topics**: All services within each domain
5. **Validate JSON**: Ensure proper formatting

### Template for New Questions:

```json
{
  "id": "saa-c03-d1-005",
  "certification": "SAA-C03",
  "domain": "domain1",
  "domainName": "Design Secure Architectures",
  "category": "Security",
  "subcategory": "Service Name",
  "difficulty": "medium",
  "question": "Question text here?",
  "options": [
    {"id": "a", "text": "Option A", "isCorrect": false},
    {"id": "b", "text": "Option B", "isCorrect": true},
    {"id": "c", "text": "Option C", "isCorrect": false},
    {"id": "d", "text": "Option D", "isCorrect": false}
  ],
  "explanation": "Detailed explanation here.",
  "references": [
    "https://docs.aws.amazon.com/..."
  ],
  "tags": ["tag1", "tag2", "tag3"]
}
```

---

## 🎓 Study Recommendations

### Domain-Based Study Plan:

**Week 1-2: Domain 1** (Design Secure Architectures - 30%)
- IAM, KMS, WAF, Shield
- VPC security, Security Groups, NACLs
- Data encryption, key management

**Week 3: Domain 2** (Design Resilient Architectures - 26%)
- High availability patterns
- Auto Scaling, Load Balancing
- Backup and disaster recovery

**Week 4: Domain 3** (Design High-Performing Architectures - 24%)
- Performance optimization
- Caching (CloudFront, ElastiCache, DAX)
- Storage performance (EBS, EFS, S3)

**Week 5: Domain 4** (Design Cost-Optimized Architectures - 20%)
- EC2 pricing models
- Storage optimization
- Serverless cost benefits

---

## ✅ Next Steps

1. **Review Questions**: Check `saa-c03-questions-extended.json`
2. **Test Integration**: Import into your app
3. **Add Features**: Domain filtering, statistics
4. **Expand**: Add more questions following the template
5. **Practice**: Use domain-based study approach

---

**Questions created: 16 (4 per domain)**  
**Format: JSON, compatible with Magic Cert v01**  
**Ready to integrate and use!** 🚀
