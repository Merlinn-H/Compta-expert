# Compta Expert 🍁🇫🇷

> 🇫🇷 [Français](#français) · 🇬🇧 [English](#english)

---

## 📥 Télécharger / Download

| Plateforme | Lien |
|------------|------|
| 🍎 **macOS** | [Dernière version / Latest release →](../../releases/latest) |
| 🪟 **Windows** | [Dernière version / Latest release →](../../releases/latest) |

> Aucun prérequis — Python, Node.js et PostgreSQL sont inclus dans l'exécutable.
> No prerequisites — Python, Node.js and PostgreSQL are bundled in the executable.

---

## Français

Application de comptabilité bilingue (FR/EN) pour la gestion financière au **Québec (Canada)** et en **France (Europe)**. Prend en charge le CAD et l'EUR comme devises principales avec un suivi multidevise complet.

### Fonctionnalités

#### 🔑 Taux de change historiques — Principe fondamental

Chaque transaction stocke de façon permanente le taux de change à la **date de la transaction**, récupéré via l'[API Frankfurter](https://api.frankfurter.app) à la création et jamais recalculé.

> `1 CAD = 0,6821 EUR — taux au 2025-03-01`

- Montant original, montant converti, taux utilisé et date du taux toujours affichés ensemble
- Les taux sont immuables — modifier une transaction ne touche jamais au taux stocké
- Fonctionne même pour les week-ends et jours fériés (Frankfurter retourne le dernier taux disponible)

#### 📊 Tableau de bord

- Cartes récapitulatives : revenus totaux, dépenses totales, solde net — par juridiction et combiné
- Toggle devise : afficher tout en CAD, EUR, ou les deux côte à côte
- Graphique de tendance mensuelle (Recharts)
- Fil des transactions récentes
- Sélecteur d'année pour les vues historiques

#### 💳 Gestion des transactions

- Créer, modifier et supprimer des transactions
- Champs : date, description, catégorie, montant, devise (CAD/EUR/USD/GBP), juridiction (Québec/France), type (revenu/dépense), notes
- À la création : le taux de change historique est automatiquement récupéré et stocké de façon permanente
- Lignes dépliables : montant converti, libellé du taux, détail des taxes, notes
- Filtrage par type (revenu/dépense) et juridiction

#### 🍁 Module fiscal Québec

- Calcul de la **TPS** (5 %) et de la **TVQ** (9,975 %)
- Suivi du **CTI** (Crédit de taxe sur les intrants) et du **RTI** (Remboursement de la taxe sur les intrants)
- Résumé trimestriel de versement pour l'ARC et Revenu Québec
- Résumé annuel de la paie pour la préparation des feuillets **RL-1** et **T4**
- Couvre les 4 trimestres (jan.–mars, avr.–juin, juil.–sept., oct.–déc.)

#### 🇫🇷 Module fiscal France

- Suivi de la **TVA** à tous les taux français : 20 %, 10 %, 5,5 %, 2,1 %, 0 %
- TVA collectée (sur ventes) vs TVA déductible (sur achats récupérables)
- Résumé de la déclaration **CA3** mensuelle
- **Export FEC** (Fichier des Écritures Comptables) au format DGFiP délimité par des pipes, avec les écritures en partie double (clients, fournisseurs, comptes de produits/charges, TVA)

#### 📄 Rapports et exports

- **Compte de résultat** par période et/ou juridiction
- Export **PDF** (ReportLab) — bilingue, avec note de bas de page sur le taux historique pour chaque ligne
- Export **CSV** — toutes les transactions avec montant original, montant converti, taux utilisé et date du taux
- **Export FEC** (France) téléchargeable depuis le module fiscal

#### 🌐 Interface bilingue (FR / EN)

- Interface entièrement en français par défaut, basculable en anglais à tout moment
- Toggle de langue dans la barre latérale — persisté entre les sessions
- Sélecteur de juridiction : Québec 🍁 / France 🇫🇷 / Les deux — persisté globalement

#### ⚙️ Paramètres

- Profil utilisateur (nom, courriel)
- Devise par défaut du compte
- Langue préférée (FR/EN)
- Mois de début de l'exercice fiscal (janvier ou personnalisé)

#### 🔒 Sécurité

- Authentification JWT (inscription / connexion / routes protégées)
- Mots de passe hachés avec bcrypt
- Limitation de débit sur les endpoints d'auth : 20 req/min à la connexion, 10 req/min à l'inscription
- CORS restreint aux origines configurées uniquement
- Validation côté serveur du mot de passe (min. 8 caractères)

### Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Python 3.11 + FastAPI |
| Frontend | React 18 + TypeScript + TailwindCSS |
| Base de données | PostgreSQL 15 (Docker) · SQLite (standalone) |
| ORM | SQLAlchemy 2 |
| Auth | JWT — PyJWT 2.8 |
| Taux de change | [Frankfurter API](https://api.frankfurter.app) — gratuit, sans clé |
| Export PDF | ReportLab |
| Graphiques | Recharts |
| État global | Zustand |
| Conteneurs | Docker Compose + nginx |

### Lancement avec Docker

```bash
docker compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost | Application (nginx → React) |
| http://localhost:8000 | API backend |
| http://localhost:8000/docs | Docs API interactives (Swagger) |

Initialiser les catégories par défaut (premier lancement uniquement) :

```bash
docker compose exec backend python seed_categories.py
```

**Mode développement** (rechargement à chaud frontend + backend) :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Application desktop standalone (sans Docker)

Produit un exécutable autonome — aucun prérequis (ni Python, ni Node.js, ni PostgreSQL). Utilise SQLite pour le stockage local.

**Mac / Linux :**
```bash
./build_standalone.sh
# → backend/dist/ComptaExpert.app  (Mac)
# → backend/dist/ComptaExpert/     (Linux)
```

**Windows :**
```bat
build_standalone.bat
# → backend\dist\ComptaExpert\ComptaExpert.exe
```

Les données utilisateur sont stockées dans des emplacements natifs :

| Plateforme | Emplacement |
|------------|-------------|
| Mac | `~/Library/Application Support/ComptaExpert/` |
| Windows | `%APPDATA%\ComptaExpert\` |
| Linux | `~/.compta_expert/` |

**Taille estimée :** ~65 Mo décompressé · ~32 Mo compressé

### Structure du projet

```
Compta-expert/
├── backend/
│   ├── app/
│   │   ├── api/          # Routeurs FastAPI
│   │   ├── core/         # Config, JWT, sécurité
│   │   ├── db/           # Session SQLAlchemy
│   │   ├── models/       # Modèles ORM (User, Transaction, Category, TaxEntry)
│   │   ├── schemas/      # Schémas Pydantic
│   │   └── services/     # Logique métier
│   ├── standalone_launcher.py   # Point d'entrée PyInstaller
│   ├── compta_expert.spec       # Spec PyInstaller
│   ├── requirements.txt
│   └── seed_categories.py
├── frontend/
│   └── src/
│       ├── components/   # Layout, TransactionForm, AmountDisplay, SummaryCard
│       ├── pages/        # Dashboard, Transactions, TaxQuebec, TaxFrance, Reports, Settings
│       ├── hooks/        # useT (i18n)
│       ├── store/        # Zustand (auth, langue, juridiction, devise)
│       ├── i18n/         # Traductions FR / EN
│       ├── types/        # Interfaces TypeScript
│       └── utils/        # Instance axios, formatCurrency, formatDate
├── build_standalone.sh   # Build standalone en une commande (Mac/Linux)
├── build_standalone.bat  # Build standalone en une commande (Windows)
├── docker-compose.yml
└── docker-compose.dev.yml
```

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DATABASE_URL` | SQLite (standalone) / défini dans compose | Chaîne de connexion PostgreSQL ou SQLite |
| `SECRET_KEY` | *(obligatoire)* | Clé de signature JWT — utiliser une chaîne aléatoire longue en production |
| `ALLOWED_ORIGINS` | `http://localhost,...` | Origines CORS autorisées, séparées par des virgules |
| `FRANKFURTER_API_URL` | `https://api.frankfurter.app` | URL de base de l'API de taux de change |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Durée de vie du JWT (24 heures) |

---

## English

A bilingual (French/English) accounting web application for managing finances across two jurisdictions: **Quebec (Canada)** and **France (Europe)**. Supports CAD and EUR as primary currencies with full multi-currency tracking.

### Features

#### 🔑 Historical Exchange Rates — Core Principle

Every transaction permanently stores the exchange rate **at the date of the transaction**, fetched from the [Frankfurter API](https://api.frankfurter.app) at creation time and never recalculated.

> `1 CAD = 0.6821 EUR — rate as of 2025-03-01`

- Original amount, converted amount, rate used, and rate date are always displayed together
- Rates are immutable — editing a transaction never touches the stored rate
- Works even for weekend/holiday dates (Frankfurter returns the last available rate)

#### 📊 Dashboard

- Summary cards: total income, total expenses, net balance — per jurisdiction and combined
- Currency toggle: view all amounts in CAD, EUR, or both side by side
- Monthly trend area chart (Recharts)
- Recent transactions feed
- Year selector for historical views

#### 💳 Transaction Management

- Create, edit, and delete transactions
- Fields: date, description, category, amount, currency (CAD/EUR/USD/GBP), jurisdiction (Quebec/France), type (income/expense), notes
- On creation: historical exchange rate is automatically fetched for that date and stored permanently
- Expandable rows showing: converted amount, historical rate label, tax breakdown, notes
- Filter by type (income/expense) and jurisdiction

#### 🍁 Quebec Tax Module

- **TPS** (5%) and **TVQ** (9.975%) calculation
- **CTI** (Crédit de taxe sur les intrants) and **RTI** (Remboursement de la taxe sur les intrants) tracking for recoverable input taxes
- Quarterly remittance summary for the CRA and Revenu Québec
- Annual payroll data summary for **RL-1** and **T4** slip preparation
- Covers all 4 quarters (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec)

#### 🇫🇷 France Tax Module

- **TVA** tracking at all French rates: 20%, 10%, 5.5%, 2.1%, 0%
- TVA collectée (on sales) vs TVA déductible (on recoverable purchases)
- Monthly **CA3** declaration summary
- **FEC export** (Fichier des Écritures Comptables) in DGFiP pipe-delimited format, with double-entry bookkeeping lines for clients, suppliers, product accounts, and TVA accounts

#### 📄 Reporting & Exports

- **Profit & Loss** statement by period and/or jurisdiction
- Export to **PDF** (ReportLab) — bilingual, with historical rate footnote on every line
- Export to **CSV** — all transactions with original amount, converted amount, rate used, and rate date
- **FEC export** (France) downloadable from the tax module

#### 🌐 Bilingual UI (FR / EN)

- Full French interface by default, switchable to English at any time
- Language toggle in the sidebar — persisted across sessions
- Jurisdiction switcher: Québec 🍁 / France 🇫🇷 / Both — persisted globally

#### ⚙️ Settings

- User profile (name, email)
- Default currency per account
- Preferred language (FR/EN)
- Fiscal year start month (January or custom)

#### 🔒 Security

- JWT authentication (register / login / protected routes)
- Passwords hashed with bcrypt
- Rate limiting on auth endpoints: 20 req/min on login, 10 req/min on register
- CORS restricted to configured origins only
- Passwords validated server-side (min 8 characters)

### Tech Stack

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

### Running with Docker

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

### Standalone Desktop App (no Docker required)

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

### Project Structure

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

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | SQLite (standalone) / set in compose | PostgreSQL or SQLite connection string |
| `SECRET_KEY` | *(required)* | JWT signing key — use a long random string in production |
| `ALLOWED_ORIGINS` | `http://localhost,...` | Comma-separated CORS allowed origins |
| `FRANKFURTER_API_URL` | `https://api.frankfurter.app` | Exchange rate API base URL |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT lifetime (24 hours) |
