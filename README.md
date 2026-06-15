# ShareBill - Shared Expense Management & Resolution Engine

ShareBill is a production-grade, collaborative financial ledger application designed to track group expenses (trips, household sharing, leisure activities), optimize outstanding debt settlements, and parse spreadsheet transaction records. It is equipped with a RAG-driven AI Accountant and an interactive CSV validation and resolution engine.

---

## 🚀 Key Features Built To Date

### 1. Group Ledger & Member Lifecycle Management
* **Dynamic Groups**: Users can create expense groups, track descriptions, and manage participant logs.
* **Soft Member Lifecycle**: Members can join or leave groups with historical timestamps (`joinedAt`, `leftAt`). Balance standings are audited dynamically so that members are only split on expenses occurring during their active membership window.
* **Optional Email Registration**: Users can add group members by email or **name only**. If name-only registration is chosen, the backend registers a guest profile with a unique dummy email address (`guest-username-timestamp@guest.sharebill.com`).

### 2. Expense Split Strategies
* **EQUAL**: Divides expenses equally among members with automatic decimal rounding adjustments.
* **PERCENTAGE**: Allocates shares based on custom percentage weights (sum validated to exactly 100%).
* **EXACT**: Assigns precise, custom currency amounts to each split participant.
* **SHARE**: Weight-based splits (e.g., Alice takes 2 shares, Bob takes 1 share).

### 3. Debt Minimization & Cash Settlements
* **Optimal Settlement Plan**: Runs a greedy cash settlement minimization algorithm that analyzes net balances (total paid minus split weights) and constructs a simplified transfer plan using the absolute minimum number of payments.
* **Settlement Records**: Allows group members to record payment receipts to balance ledger standing balances.
* **Ledger Deletion**: Allows deleting settlement receipts to restore original debt standings.

### 4. Production-Grade CSV Import Engine
An interactive, upload validation pipeline that cleanses raw transaction data before inserting them into active database tables.
* **CSV parser**: Supports custom headers (`date`, `description`, `paid_by`, `amount`, `currency`, `split_type`, `split_with`, `split_details`, `notes`).
* **16-Step Validation Engine**: Runs rule checks for:
  - **Duplicate Detection**: Flags exact duplicates and near duplicates (similarity >85% computed using Levenshtein distance metrics).
  - **Name Casing Normalization**: Auto-corrects lowercase/uppercase names to match registered member names.
  - **Guest Creations**: Automatically creates missing member accounts on final commit.
  - **Settlement Conversions**: Identifies settlement terms (`reimbursement`, `settled`, `paid back`, `refund transfer`) and prompts settlement conversion.
  - **Amount Limits**: Converts negative values to positive refund records, rejects zero values.
  - **Ambiguous Dates**: Flags formats like `04-05-2026` and prompts DD-MM-YYYY vs MM-DD-YYYY user selection.
  - **Lifecycle Audits**: Flags transaction dates lying outside participant join/leave dates.
  - **Percentage Integrity**: Rejects splits whose weights do not sum to 100%.
* **Interactive Vite Review Dashboard**: 
  - 4-tab dashboard (`Warnings`, `Review Required`, `Auto-Fixed`, `Rejected`).
  - Allows inline modifications: change duplicate strategy, toggle settlement conversion, select date formats, map payer dropdowns, skip/reject, or edit all fields via an inline modal.
  - **Real-time Preview Widget**: Computes exact statistics of active records prior to db commit.
  - **Error Logs Exporter**: Instantly compiles skipped/rejected rows into a downloadable `.txt` report.
  - **Activity Log Integration**: Audits every stage of the validation and final import runs.

### 5. RAG-Driven Financial Intelligence Agent
An autonomous, conversational accountant built into the workspace to query and reason over ledger details.
* **Live RAG Context**: Parallel Prisma query tools bundle group details (expenses, net stand balances, simplified debts, category totals, trip logs, anomalies) into prompt context.
* **Google Gemini 1.5 Flash AI Core**: Connects securely to Gemini REST API endpoints, maintaining message history threads to support follow-up questions.
* **9-Language Local Fallback Reasoning Engine**: If the API key is missing or fails, an offline rule-based reasoning engine calculates spend categories, top spenders, largest expenses, and minimum cash transfer steps, translating results into **English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Malayalam, or Punjabi**.
* **Visual Aids**: The React chat UI automatically renders structured tabular sheets, bullet points, and graphic settlement direction flowcharts.

---

## 🛠️ Technology Stack Used

### Backend API
- **Runtime**: Node.js (ES Modules syntax, `type: "module"`)
- **Framework**: Express.js
- **Database ORM**: Prisma client communicating with **PostgreSQL**
- **File Upload Handler**: Multer (disk and memory sandbox settings)
- **Security & Password Hashing**: JSON Web Tokens (JWT), bcryptjs
- **Environment**: Dotenv config validation triggers

### Frontend client
- **Build Tool & Bundler**: Vite + React
- **Styling**: Vanilla CSS for custom layouts (glassmorphic cards, animations, responsive spacing) + Tailwind CSS utility styling
- **Icons**: Lucide React
- **HTTP client**: Axios instance intercepts with authorization JWT tokens
- **Routing**: React Router DOM (protected route validation)

### 🤖 AI Model Used
- **Google Gemini 1.5 Flash API**: Chosen for low-latency JSON response streaming, robust multi-language capabilities, and high-fidelity structured data completions.
- **System Instruction Routing**: Formulates structured, parseable JSON payloads containing textual responses, bullet point arrays, and tabular rows.

---

## ⚙️ Development Setup & Installation

### Prerequisites
- Node.js (version 18+ or 20+)
- PostgreSQL database server running locally or hosted

### 1. Backend Configuration
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables. Create a `.env` file inside the `backend` folder:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/share_bill?schema=public"
   JWT_SECRET="your_secure_jwt_secret_token_key"
   GEMINI_API_KEY="your_google_gemini_api_key"
   NODE_ENV="development"
   ```
4. Generate the Prisma database client:
   ```bash
   npm run build
   ```
5. Run database migrations to build active tables:
   ```bash
   npm run prisma:migrate
   ```
6. Start the API development server:
   ```bash
   npm run dev
   ```
   *The backend will boot on `http://localhost:5000`.*

### 2. Frontend Configuration
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install client package dependencies:
   ```bash
   npm install
   ```
3. Configure frontend environment variables. Create a `.env` file inside the `frontend` folder:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client application will boot on `http://localhost:5173`.*

---

## 🧪 Testing the Engine
To run backend CSV validation rules, duplicate scoring models, and local AI fallback translations offline, execute our custom node test suite:
```bash
node C:\Users\ASUS\.gemini\antigravity-ide\brain\082c8c4a-3a7c-49b9-b876-f625bd95f91e\scratch\test_csv_resolution.js
```
The test suite parses mock CSV rows and verifies validations (negatives, duplicates, equal split conflicts, missing headers, dates, and lifecycles) against expected outcomes.
