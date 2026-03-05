# Compta Expert 🍁🇫🇷

A bilingual (French/English) accounting web application for managing finances across two jurisdictions: **Quebec (Canada)** and **France (Europe)**. Supports CAD and EUR as primary currencies with full multi-currency tracking.

---

## Features

### 🔑 Historical Exchange Rates — Core Principle

Every transaction permanently stores the exchange rate **at the date of the transaction**, fetched from the [Frankfurter API](https://api.frankfurter.app) at creation time and never recalculated.

> `1 CAD = 0.6821 EUR — rate as of 2025-03-01`

- Original amount, converted amount, rate used, and rate date are always displayed together
- Rates are immutable — editing a transaction never touches the stored rate
- Works even for weekend/holiday dates (Frankfurter returns the last available rate)

---

### 📊 Dashboard

- Summary cards: total income, total expenses, net balance — per jurisdiction and combined
- Currency toggle: view all amounts in CAD, EUR, or both side by side
- Monthly trend area chart (Recharts)
- Recent transactions feed
- Year selector for historical views

### 💳 Transaction Management

- Create, edit, and delete transactions
- Fields: date, description, category, amount, currency (CAD/EUR/USD/GBP), jurisdiction (Quebec/France), type (income/expense), notes
- On creation: historical exchange rate is automatically fetched for that date and stored permanently
- Expandable rows showing: converted amount, historical rate label, tax breakdown, notes
- Filter by type (income/expense) and jurisdiction

### 🍁 Quebec Tax Module

- **TPS** (5%) and **TVQ** (9.975%) calculation
- **CTI** (Crédit de taxe sur les intrants) and **RTI** (Remboursement de la taxe sur les intrants) tracking for recoverable input taxes
- Quarterly remittance summary for the CRA and Revenu Québec
- Annual payroll data summary for **RL-1** and **T4** slip preparation
- Covers all 4 quarters (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec)

### 🇫🇷 France Tax Module

- **TVA** tracking at all French rates: 20%, 10%, 5.5%, 2.1%, 0%
- TVA collectée (on sales) vs TVA déductible (on recoverable purchases)
- Monthly **CA3** declaration summary
- **FEC export** (Fichier des Écritures Comptables) in DGFiP pipe-delimited format, with double-entry bookkeeping lines for clients, suppliers, product accounts, and TVA accounts

### 📄 Reporting & Exports

- **Profit & Loss** statement by period and/or jurisdiction
- Export to **PDF** (ReportLab) — bilingual, with historical rate footnote on every line
- Export to **CSV** — all transactions with original amount, converted amount, rate used, and rate date
- **FEC export** (France) downloadable from the tax module

### 🌐 Bilingual UI (FR / EN)

- Full French interface by default, switchable to English at any time
- Language toggle in the sidebar — persisted across sessions
- Jurisdiction switcher: Québec 🍁 / France 🇫🇷 / Both — persisted globally

### ⚙️ Settings

- User profile (name, email)
- Default currency per account
- Preferred language (FR/EN)
- Fiscal year start month (January or custom)

### 🔒 Security

- JWT authentication (register / login / protected routes)
- Passwords hashed with bcrypt
- Rate limiting on auth endpoints: 20 req/min on login, 10 req/min on register
- CORS restricted to configured origins only
- Passwords validated server-side (min 8 characters)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 + FastAPI |
| Frontend | React 18 + TypeScript + TailwindCSS |
| Database | PostgreSQL 15 (Docker) · SQLite (standalone) |
| ORM | SQLAlchemy 2 |
| Auth | JWT — PyJWT 2.8 |
| Exchange rates | [Frankfurter API](https://api.frankfurter.app) — free, no key required |
| PDF export | ReportLab |
| Charts | Recharts |
| State | Zustand |
| Containers | Docker Compose + nginx |

---

## Running with Docker

```bash
docker compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost | App (nginx → React frontend) |
| http://localhost:8000 | Backend API |
| http://localhost:8000/docs | Interactive API docs (Swagger) |

Seed the default categories (first run only):

```bash
docker compose exec backend python seed_categories.py
```

**Development mode** (hot reload for both frontend and backend):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## Standalone Desktop App (no Docker required)

Produces a self-contained executable — no Python, Node.js, or PostgreSQL needed. Uses SQLite for local storage.

**Mac / Linux:**
```bash
./build_standalone.sh
# → backend/dist/ComptaExpert.app  (Mac)
# → backend/dist/ComptaExpert/     (Linux)
```

**Windows:**
```bat
build_standalone.bat
# → backend\dist\ComptaExpert\ComptaExpert.exe
```

User data is stored in platform-native locations:

| Platform | Location |
|----------|---------|
| Mac | `~/Library/Application Support/ComptaExpert/` |
| Windows | `%APPDATA%\ComptaExpert\` |
| Linux | `~/.compta_expert/` |

**Estimated bundle size:** ~65 MB uncompressed · ~32 MB compressed

---

## Project Structure

```
Compta-expert/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Config, JWT, security
│   │   ├── db/           # SQLAlchemy session
│   │   ├── models/       # ORM models (User, Transaction, Category, TaxEntry)
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── standalone_launcher.py   # PyInstaller entry point
│   ├── compta_expert.spec       # PyInstaller spec
│   ├── requirements.txt
│   └── seed_categories.py
├── frontend/
│   └── src/
│       ├── components/   # Layout, TransactionForm, AmountDisplay, SummaryCard
│       ├── pages/        # Dashboard, Transactions, TaxQuebec, TaxFrance, Reports, Settings
│       ├── hooks/        # useT (i18n)
│       ├── store/        # Zustand (auth, language, jurisdiction, currency)
│       ├── i18n/         # FR / EN translations
│       ├── types/        # TypeScript interfaces
│       └── utils/        # axios instance, formatCurrency, formatDate
├── build_standalone.sh   # One-command standalone build (Mac/Linux)
├── build_standalone.bat  # One-command standalone build (Windows)
├── docker-compose.yml
└── docker-compose.dev.yml
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | SQLite (standalone) / set in compose | PostgreSQL or SQLite connection string |
| `SECRET_KEY` | *(required)* | JWT signing key — use a long random string in production |
| `ALLOWED_ORIGINS` | `http://localhost,...` | Comma-separated CORS allowed origins |
| `FRANKFURTER_API_URL` | `https://api.frankfurter.app` | Exchange rate API base URL |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT lifetime (24 hours) |
