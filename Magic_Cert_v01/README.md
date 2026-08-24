# AWS Certification Quiz Application

An interactive quiz application for AWS certification preparation, starting with SAA-C03 (Solutions Architect Associate).

## 📋 Project Overview

This application helps users prepare for AWS certifications through interactive quizzes with detailed explanations and references to official AWS documentation.

## 🏗️ Project Structure

```
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── data/           # Question banks (JSON files)
│   │   └── saa-c03-questions.json
│   ├── utils/          # Utility functions
│   │   └── questionLoader.ts
│   └── types/          # TypeScript type definitions
│       └── question.ts
├── public/             # Static assets
├── tests/              # Test files
├── QUESTION_STRUCTURE.md   # Documentation for question format
└── README.md
```

## 📚 Available Certifications

Currently available:
- **SAA-C03**: AWS Certified Solutions Architect - Associate (10 sample questions)

Coming soon:
- DVA-C02: Developer Associate
- SOA-C02: SysOps Administrator Associate
- SAP-C02: Solutions Architect Professional
- DOP-C02: DevOps Engineer Professional

## 🎯 Features

- Multiple choice questions with detailed explanations
- Questions organized by:
  - Certification type
  - Category (Compute, Storage, Database, etc.)
  - Difficulty level (Easy, Medium, Hard)
  - AWS services and topics
- Official AWS documentation references
- Quiz statistics and progress tracking
- Random question generation with filters

## 📖 Question Structure

Questions follow a standardized format documented in `QUESTION_STRUCTURE.md`. Each question includes:

- Unique ID
- Certification type
- Category and subcategory
- Difficulty level
- Question text with multiple choice options
- Detailed explanation
- AWS documentation references
- Searchable tags

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📝 Adding New Questions

1. Review the question structure in `QUESTION_STRUCTURE.md`
2. Add questions to the appropriate JSON file in `src/data/`
3. Follow the validation checklist
4. Ensure all references link to current AWS documentation

Example question structure:
```json
{
  "id": "saa-c03-001",
  "certification": "SAA-C03",
  "category": "Compute",
  "subcategory": "EC2",
  "difficulty": "medium",
  "question": "Your question text here...",
  "options": [
    {"id": "a", "text": "Option A", "isCorrect": false},
    {"id": "b", "text": "Option B", "isCorrect": true}
  ],
  "explanation": "Detailed explanation...",
  "references": ["https://docs.aws.amazon.com/..."],
  "tags": ["ec2", "compute"]
}
```

## 🛠️ Technology Stack

- **Frontend**: React / TypeScript
- **State Management**: TBD
- **Styling**: TBD
- **Testing**: Jest / React Testing Library
- **Build Tool**: Vite / Webpack

## 📊 Question Categories

### SAA-C03 Categories
- Compute (EC2, Lambda, ECS)
- Storage (S3, EBS, EFS)
- Database (RDS, DynamoDB, Aurora)
- Networking (VPC, Route 53, CloudFront)
- Security (IAM, KMS, Cognito)
- Application Integration (SQS, SNS, EventBridge)
- Monitoring (CloudWatch, CloudTrail)
- Content Delivery (CloudFront)
- Management & Governance
- Cost Optimization

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add questions following the documented structure
4. Ensure questions are accurate and well-explained
5. Submit a pull request

## 📄 License

TBD

## 🔗 Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [AWS Certification](https://aws.amazon.com/certification/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## 📞 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Note**: This is an unofficial study resource. Please refer to official AWS certification guides and documentation for exam preparation.
AWS CommunityDay Bolivia 2026: Talk "Despues de la Magia: de Localhost a Produccion"
