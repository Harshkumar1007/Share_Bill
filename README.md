# ShareBill - Shared Expense Tracker & Debt Minimizer

I built ShareBill to solve a common problem: splitting bills with roommates, friends, or travel groups, and dealing with the mess of who owes whom. It handles different ways of splitting bills (equally, by percentage, by exact amounts, or by shares), lets you upload spreadsheets of bills with a smart validation engine, and features an AI assistant that answers questions about group expenses and settlement plans in multiple languages.

---

## 🚀 Implemented Features

### 1. User & Group Management
* **Authentication:** Safe user sign-up and log-in powered by JWT (JSON Web Tokens).
* **Dynamic Groups:** Create groups, add descriptions, and manage members.
* **Member Timelines:** Track when members join or leave groups using `joinedAt` and `leftAt` timestamps. The splitting algorithm is smart enough to only include them in expense splits if they were active members in the group when the bill occurred.
* **Guest Members:** Add members by name only if they do not want to register with an email. The backend generates a placeholder guest profile with a unique dummy email address (`guest-name-timestamp@guest.sharebill.com`) so they can participate in splits immediately.

### 2. Multi-Strategy Bill Splits
* **EQUAL:** Splits the bill evenly among participants, handling rounding differences.
* **PERCENTAGE:** Allocates costs by custom percentage weights (sum validated to exactly 100%).
* **EXACT:** Let you assign exact decimal money figures to each participant.
* **SHARE:** Uses ratios/shares (e.g., Alice takes 2 shares, Bob takes 1 share).

### 3. Smart Debt Settlement
* **Minimized Cash Transfers:** Runs a greedy debt-minimization algorithm that analyzes net balances (what each person paid minus what they owe) and generates a simplified payment plan using the absolute minimum number of peer-to-peer transfers.
* **Settle Up Logs:** Record cash payments directly in the app to clear outstanding standings, with options to delete wrong settlement entries.

### 4. Interactive CSV Import Engine
* **Upload Dashboard:** Drag and drop or browse to upload a `.csv` file of bills.
* **13 Validation Rules:** Checks for duplicate rows, near duplicates (>85% text similarity), invalid split weights, missing payers, date ambiguities, future dates, and multiple currencies.
* **Compliance Handling:**
  * **Negative Amounts (Refunds):** Negative refund amounts are preserved exactly in the database and import statistics rather than converting them to positive values.
  * **Payer & Participant Mapping:** Map unknown payer names to active group members or automatically register them as guest members on import.
  * **Settlement Detections:** Automatically detects settlement keywords (like "paid back") and lets you convert the row directly to a Settlement record.
* **Dashboard Tab Panels:** Reviews rows sorted into Warnings, Review Required, Auto-Fixed, Rejected, and AI Suggestions, with inline modal editors and safety auto-apply filters.

### 5. RAG-Driven AI Assistant
* **Retrieval-Augmented Context:** Queries database tables to load group balances, expenses, refunds, and debt settlements.
* **Gemini 1.5 Flash:** Answers questions about group spending and explains settlement plans in natural language.
* **Offline Fallback Engine:** If the Gemini API key is missing or goes offline, a local fallback reasoning engine takes over to compute top spenders, category totals, and minimum transfer steps.
* **9-Language Support:** The offline fallback translator outputs answers in English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Malayalam, or Punjabi.
* **Dedicated Intent Handlers:** Matches requests for refund histories, expense timelines, high-debt spenders, settlement math explanations, and trip summaries.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Vanilla CSS, Tailwind CSS (for utility styling), Axios, and Lucide React.
* **Backend:** Node.js, Express, Prisma ORM.
* **Database:** PostgreSQL.

---

## ☁️ Deployment Architecture

* **Frontend:** Hosted on **Vercel** as a static single-page application.
* **Backend:** Hosted on **Render** as a Node.js web service.
* **Database:** Managed Serverless PostgreSQL database hosted on **Neon**.

```
  [ React Client ]  --->  Hosted on Vercel
         |
         v (HTTP Requests + JWT)
  [ Express API ]   --->  Hosted on Render
         |
         v (Prisma ORM Client)
  [ PostgreSQL ]    --->  Hosted on Neon
```

---

## ⚙️ How to Run Locally

### 1. Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/share_bill?schema=public"
   JWT_SECRET="your_jwt_secret_token_key"
   GEMINI_API_KEY="your_api_key_here"
   NODE_ENV="development"
   ```
4. Build the Prisma client:
   ```bash
   npm run build
   ```
5. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

### 2. Frontend
1. Open another terminal and go to the frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Seeding and Local Testing

I've written some scripts to seed the database and verify the AI assistant offline.
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Seed the database with a test group and dummy expenses:
   ```bash
   node src/seed_test_group.js
   ```
3. Run the AI Assistant query and fallback translation tests:
   ```bash
   node src/run_acceptance_test.js
   ```
