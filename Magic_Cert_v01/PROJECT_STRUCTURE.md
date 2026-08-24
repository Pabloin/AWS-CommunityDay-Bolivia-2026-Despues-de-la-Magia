# Project Structure

## Complete Directory Tree

```
AWS-CommunityDay-Bolivia-2026-Despues-de-la-Magia/
├── .git/                           # Git repository
├── .gitignore                      # Git ignore rules
│
├── README.md                       # Main project documentation
├── QUESTION_STRUCTURE.md           # Question format documentation
├── PROJECT_STRUCTURE.md            # This file
├── package.json                    # Node.js dependencies and scripts
│
├── public/                         # Static assets (empty, ready for use)
│   └── (images, icons, etc.)
│
├── src/                           # Source code
│   ├── components/                # React components (empty, ready for use)
│   │   ├── Quiz/
│   │   ├── Question/
│   │   ├── Results/
│   │   └── Navigation/
│   │
│   ├── pages/                     # Page components (empty, ready for use)
│   │   ├── Home/
│   │   ├── QuizSelection/
│   │   ├── QuizTaking/
│   │   └── Results/
│   │
│   ├── data/                      # Question banks (JSON files)
│   │   ├── saa-c03-questions.json    # ✅ 10 sample SAA-C03 questions
│   │   ├── dva-c02-questions.json    # (to be added)
│   │   ├── soa-c02-questions.json    # (to be added)
│   │   └── ...                        # (other certifications)
│   │
│   ├── utils/                     # Utility functions
│   │   ├── questionLoader.ts         # ✅ Question management utility
│   │   └── exampleUsage.ts           # ✅ Usage examples
│   │
│   └── types/                     # TypeScript type definitions
│       └── question.ts               # ✅ Question interfaces
│
└── tests/                         # Test files (empty, ready for use)
    ├── unit/
    └── integration/
```

## Created Files Summary

### Documentation Files
- ✅ **README.md** - Main project overview and setup instructions
- ✅ **QUESTION_STRUCTURE.md** - Complete documentation of question format
- ✅ **PROJECT_STRUCTURE.md** - This file, showing directory organization
- ✅ **package.json** - Node.js project configuration

### Source Code Files
- ✅ **src/types/question.ts** - TypeScript interfaces for questions and quiz sessions
- ✅ **src/data/saa-c03-questions.json** - 10 sample SAA-C03 questions covering various categories
- ✅ **src/utils/questionLoader.ts** - Utility class for managing and filtering questions
- ✅ **src/utils/exampleUsage.ts** - Examples of how to use the QuestionLoader

### Empty Directories (Ready for Development)
- 📁 **public/** - For static assets (images, icons, fonts)
- 📁 **src/components/** - For React components
- 📁 **src/pages/** - For page-level components
- 📁 **tests/** - For unit and integration tests

## Sample Questions Created

The `src/data/saa-c03-questions.json` file contains **10 complete sample questions** covering:

1. **Compute** - EC2 Auto Scaling & Load Balancing (Easy, Multi-select)
2. **Storage** - S3 Lifecycle Policies (Medium)
3. **Database** - RDS Read Replicas (Medium)
4. **Security** - IAM Identity Center (Easy)
5. **Networking** - NAT Gateway for Private Subnets (Hard)
6. **Storage** - EBS Volume Types (Medium)
7. **Application Integration** - SQS FIFO Queues (Medium)
8. **Monitoring** - CloudWatch Alarms (Easy)
9. **Content Delivery** - CloudFront CDN (Medium)
10. **Security** - KMS Encryption (Hard)

### Question Categories Covered
- Compute (EC2)
- Storage (S3, EBS)
- Database (RDS)
- Networking (VPC, NAT Gateway)
- Security (IAM, KMS)
- Application Integration (SQS)
- Monitoring (CloudWatch)
- Content Delivery (CloudFront)

### Difficulty Distribution
- Easy: 3 questions
- Medium: 5 questions
- Hard: 2 questions

## Next Steps for Development

### Phase 1: Core Functionality
1. Install dependencies: `npm install`
2. Create React components in `src/components/`
3. Build quiz-taking interface
4. Implement answer validation
5. Add results/scoring display

### Phase 2: Enhanced Features
1. Add more SAA-C03 questions (target: 100+)
2. Create questions for other certifications (DVA-C02, SOA-C02)
3. Implement quiz sessions with progress tracking
4. Add category-specific practice modes
5. Build statistics and progress tracking

### Phase 3: UI/UX Polish
1. Design responsive layouts
2. Add animations and transitions
3. Implement theme support (light/dark mode)
4. Add accessibility features
5. Mobile optimization

### Phase 4: Advanced Features
1. User authentication and profiles
2. Progress persistence (localStorage/database)
3. Performance analytics
4. Spaced repetition for weak areas
5. Timed exam mode
6. Bookmark questions for review

## File Size Reference

- **saa-c03-questions.json**: ~14 KB (10 questions)
- Estimated for 100 questions: ~140 KB
- Estimated for 500 questions: ~700 KB

## Question Format Quick Reference

```json
{
  "id": "certification-number",
  "certification": "SAA-C03",
  "category": "Category Name",
  "subcategory": "Service Name",
  "difficulty": "easy|medium|hard",
  "question": "Question text",
  "options": [
    {"id": "a", "text": "Option text", "isCorrect": false}
  ],
  "explanation": "Detailed explanation",
  "references": ["AWS docs URLs"],
  "tags": ["tag1", "tag2"]
}
```

## Contributing Guidelines

When adding new questions:
1. Follow the structure in `QUESTION_STRUCTURE.md`
2. Add to appropriate JSON file in `src/data/`
3. Use sequential IDs (e.g., saa-c03-011, saa-c03-012)
4. Include detailed explanations
5. Link to current AWS documentation
6. Validate JSON syntax before committing

## Technologies Used

- **TypeScript**: Type-safe code
- **React**: UI framework (to be implemented)
- **Vite**: Build tool and dev server
- **JSON**: Question data storage

---

Last updated: Project initialization with sample questions
