# AWS Certification Quiz - Question Structure

## Overview
This document describes the structure and format for quiz questions in the AWS Certification Quiz Application.

## Question Format

### TypeScript Interface
The complete TypeScript interface is defined in `src/types/question.ts`.

### JSON Structure

```json
{
  "id": "unique-question-id",
  "certification": "SAA-C03",
  "category": "Primary Category",
  "subcategory": "Specific Service or Topic",
  "difficulty": "easy|medium|hard",
  "question": "The question text goes here",
  "options": [
    {
      "id": "a",
      "text": "Option text",
      "isCorrect": true|false
    }
  ],
  "explanation": "Detailed explanation of the correct answer",
  "references": [
    "https://docs.aws.amazon.com/..."
  ],
  "tags": ["tag1", "tag2"]
}
```

## Field Descriptions

### Required Fields

- **id** (string): Unique identifier for the question
  - Format: `{certification}-{sequential-number}`
  - Example: `saa-c03-001`, `dva-c02-042`

- **certification** (string): AWS certification code
  - SAA-C03: Solutions Architect Associate
  - DVA-C02: Developer Associate
  - SOA-C02: SysOps Administrator Associate
  - SAP-C02: Solutions Architect Professional
  - DOP-C02: DevOps Engineer Professional
  - ANS-C01: Advanced Networking Specialty
  - SCS-C02: Security Specialty
  - DAS-C01: Data Analytics Specialty
  - MLS-C01: Machine Learning Specialty
  - DBS-C01: Database Specialty

- **category** (string): Primary domain or topic area
  - Examples: Compute, Storage, Database, Networking, Security, Application Integration, Monitoring, Content Delivery, Management & Governance, Analytics, Machine Learning, Migration, Cost Optimization

- **difficulty** (string): Question difficulty level
  - `easy`: Basic concepts, direct recall
  - `medium`: Application of concepts, scenario-based
  - `hard`: Complex scenarios, multiple factors, advanced concepts

- **question** (string): The question text
  - Should be clear and unambiguous
  - May include scenario descriptions
  - Note when multiple answers are required: "(Choose TWO)" or "(Choose THREE)"

- **options** (array): Answer choices
  - Minimum 4 options (typically 4-5)
  - Each option has:
    - **id** (string): Unique identifier within the question (a, b, c, d, e)
    - **text** (string): The option text
    - **isCorrect** (boolean): Whether this option is correct

- **explanation** (string): Detailed explanation
  - Explain why the correct answer is correct
  - Explain why incorrect answers are wrong
  - Provide context and reasoning

### Optional Fields

- **subcategory** (string): Specific AWS service or sub-topic
  - Examples: EC2, S3, RDS, Lambda, VPC, IAM, CloudWatch

- **references** (array of strings): Links to AWS documentation
  - Official AWS documentation URLs
  - Whitepapers
  - Blog posts from AWS

- **tags** (array of strings): Additional searchable keywords
  - Examples: high-availability, cost-optimization, auto-scaling, serverless

## Question Writing Guidelines

### Best Practices

1. **Clarity**: Questions should be clear and unambiguous
2. **Realistic**: Use realistic scenarios that reflect real-world use cases
3. **AWS Best Practices**: Align with AWS Well-Architected Framework
4. **Up-to-date**: Use current service names and features
5. **Fair Distractors**: Incorrect answers should be plausible but clearly wrong to someone who knows the material

### Question Types

1. **Single Answer**: Most common, one correct answer
2. **Multiple Answer**: Explicitly marked with "(Choose TWO)" or similar
3. **Scenario-Based**: Describe a situation and ask for the best solution
4. **Comparison**: Compare different approaches or services

### Difficulty Guidelines

**Easy Questions:**
- Direct service knowledge
- Basic feature identification
- Simple best practices
- Example: "Which service is used for object storage?"

**Medium Questions:**
- Application of concepts
- Scenario analysis
- Service combinations
- Trade-offs between options
- Example: "What's the most cost-effective way to...?"

**Hard Questions:**
- Complex multi-service scenarios
- Advanced configurations
- Subtle distinctions between similar options
- Performance/cost/security optimization
- Example: "A company needs to implement X with Y constraints while optimizing for Z..."

## Data File Organization

### Directory Structure
```
src/data/
├── saa-c03-questions.json    # Solutions Architect Associate
├── dva-c02-questions.json    # Developer Associate
├── soa-c02-questions.json    # SysOps Administrator
├── sap-c02-questions.json    # Solutions Architect Professional
├── dop-c02-questions.json    # DevOps Engineer Professional
└── ...                        # Other certifications
```

### File Format
Each JSON file contains:
```json
{
  "certification": "SAA-C03",
  "certificationName": "AWS Certified Solutions Architect - Associate",
  "version": "C03",
  "questions": [
    // Array of question objects
  ]
}
```

## Categories by Certification

### SAA-C03 Categories
1. **Compute**: EC2, Lambda, ECS, EKS, Elastic Beanstalk
2. **Storage**: S3, EBS, EFS, Storage Gateway
3. **Database**: RDS, DynamoDB, ElastiCache, Redshift, Aurora
4. **Networking**: VPC, Route 53, CloudFront, API Gateway, Direct Connect
5. **Security**: IAM, KMS, Secrets Manager, WAF, Shield, Cognito
6. **Application Integration**: SQS, SNS, EventBridge, Step Functions
7. **Monitoring**: CloudWatch, CloudTrail, X-Ray
8. **Management & Governance**: Organizations, Control Tower, Systems Manager, Trusted Advisor
9. **Cost Optimization**: Cost Explorer, Budgets, Savings Plans
10. **Migration**: Migration Hub, Database Migration Service, Server Migration Service

## Validation Checklist

Before adding a question, verify:

- [ ] Unique ID assigned
- [ ] Correct certification code
- [ ] Appropriate category and subcategory
- [ ] Difficulty level is appropriate
- [ ] Question is clear and grammatically correct
- [ ] At least 4 options provided
- [ ] Correct answer(s) marked with `isCorrect: true`
- [ ] Explanation is comprehensive and accurate
- [ ] AWS documentation links are current and valid
- [ ] Tags are relevant and helpful

## Examples

See `src/data/saa-c03-questions.json` for complete examples covering various categories and difficulty levels.

## Contributing

When adding new questions:
1. Follow the structure defined above
2. Use the validation checklist
3. Test questions for accuracy
4. Keep explanations concise but complete
5. Update references to match current AWS documentation
