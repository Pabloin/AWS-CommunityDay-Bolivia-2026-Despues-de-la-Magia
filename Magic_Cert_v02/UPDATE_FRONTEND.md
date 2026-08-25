# Update Frontend to Use AWS API

## 🎯 Quick Summary

The frontend (v01) currently works standalone with local data. To connect it to AWS:

### Option 1: Test API Independently (Recommended for Demo)

The API already works! Test it:

```bash
cd terraform
API_URL=$(terraform output -raw api_gateway_url)

# Test questions endpoint
curl "$API_URL/questions?count=5"

# Test with domain filter
curl "$API_URL/questions?domain=domain1&count=3"
```

**For your presentation:** Show the API working with curl commands. The frontend integration can wait for v03.

---

### Option 2: Quick Frontend Integration (15 min)

To make the React app call the AWS API:

**Step 1: Create environment file**

```bash
cd ../Magic_Cert_v01

# Get API URL
API_URL=$(cd ../Magic_Cert_v02/terraform && terraform output -raw api_gateway_url)

# Create .env.production
cat > .env.production << EOF
VITE_API_URL=$API_URL
EOF

echo "✓ Created .env.production with API_URL=$API_URL"
```

**Step 2: Update App.tsx to use API**

The API service is already created at `src/services/api.ts`.

In `src/App.tsx`, change the question loading:

```typescript
// Add at top
import { fetchQuestions } from './services/api';

// In handleStart function, replace question loading with:
const questions = await fetchQuestions('SAA-C03', selectedDomain, selectedCount);
if (questions.length === 0) {
  // Fallback to local data
  const localData = selectedDataset === 'extended' 
    ? extendedQuestions 
    : basicQuestions;
  // ... existing filter logic
}
```

**Step 3: Build and deploy**

```bash
# Build
npm run build

# Deploy to S3
cd ../Magic_Cert_v02
./scripts/deploy-frontend.sh
```

---

### Option 3: Full Integration (v03 scope)

For complete integration with auth, progress tracking, etc., this is better suited for v03 where you'll add:
- User authentication UI
- Progress tracking dashboard
- Statistics page
- CloudFront + custom domain

---

## 🎓 For AWS Community Day Demo

### Recommended Approach:

**Show 2 versions side-by-side:**

1. **v01 (localhost):**
   ```
   cd Magic_Cert_v01
   npm run dev
   ```
   - Opens at http://localhost:5173
   - "This is AI-generated, runs on my laptop"

2. **v02 API (AWS):**
   ```bash
   curl "$API_URL/questions?count=5" | jq
   ```
   - Shows JSON from DynamoDB
   - "Same questions, now from AWS serverless infrastructure"

3. **AWS Console:**
   - Show Resource Group (all 27 resources)
   - Show CloudWatch Dashboard
   - Show Cost Explorer ($5-7/month)

**Talking points:**
- "v01: Quick prototype with AI"
- "v02: Production API on AWS" 
- "Frontend integration coming in v03"
- "This shows incremental, practical development"

---

## 🔌 API Endpoints Available

### Questions
```
GET /questions?certification=SAA-C03&domain=all&count=5
Response: { success: true, questions: [...], total: 26, returned: 5 }
```

### Authentication
```
POST /auth/register
Body: { email, password, name? }
Response: { success: true, user: {...}, token: "..." }

POST /auth/login  
Body: { email, password }
Response: { success: true, user: {...}, token: "..." }
```

### User Progress (requires auth token)
```
GET /user/progress?limit=20
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, history: [...] }

POST /user/progress
Headers: { Authorization: "Bearer <token>" }
Body: { certification, dataset, domain, totalQuestions, correctAnswers, ... }
Response: { success: true, attempt: {...} }

GET /user/progress?stats=true
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, totalAttempts, averageScore, ... }
```

---

## ✅ What's Already Done

- ✅ API service created (`src/services/api.ts`)
- ✅ TypeScript interfaces defined
- ✅ Fallback to local data included
- ✅ Error handling implemented

---

## 🚀 Next Steps (Your Choice)

**For Demo (Easiest):**
- Keep v01 as-is (localhost with local data)
- Show API working independently with curl
- Explain v03 will have full integration

**For Working App (15 min):**
- Follow Option 2 above
- Frontend will call AWS API
- Still works if API is down (fallback)

**For Production (v03):**
- Add full authentication UI
- Add progress tracking dashboard
- Add CloudFront + HTTPS
- Add CI/CD pipeline

---

**Current Status:**  
✅ Backend API fully functional  
✅ Frontend works standalone  
⏳ Integration optional for demo  

**Recommendation:** Demo the API with curl, keep frontend integration for v03.
