# Compta Expert 🍁🇫🇷

Application de comptabilité bilingue (FR/EN) pour la gestion financière au **Québec (Canada)** et en **France (Europe)**.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Python 3.11 + FastAPI |
| Frontend | React 18 + TypeScript + TailwindCSS |
| Base de données | PostgreSQL 15 |
| ORM | SQLAlchemy 2 |
| Auth | JWT (python-jose) |
| Taux de change | [Frankfurter API](https://api.frankfurter.app) |
| Conteneurs | Docker Compose |

## Lancement rapide

```bash
docker compose up --build
```

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Docs API : http://localhost:8000/docs

## Fonctionnalités principales

### 🔑 Taux de change historiques (fonctionnalité critique)

Chaque transaction stocke de façon permanente le taux de change à la **date de la transaction**,
jamais au taux actuel. Ce taux est récupéré via Frankfurter API et ne sera jamais recalculé.

Exemple d'affichage : `1 CAD = 0.6821 EUR — taux au 2025-03-01`

### 📊 Tableau de bord
- Totaux revenus / dépenses / solde net par juridiction (Québec / France / les deux)
- Toggle devise : CAD, EUR, ou les deux côte à côte
- Graphique de tendance mensuelle (Recharts)

### 💳 Transactions
- CRUD complet avec récupération automatique du taux historique à la création
- Affichage : montant original + montant converti + taux utilisé + date du taux

### 🍁 Module fiscal Québec
- TPS (5%) et TVQ (9.975%)
- CTI (Crédit de taxe sur les intrants) / RTI (Remboursement de la taxe sur les intrants)
- Résumé trimestriel pour l'ARC et Revenu Québec
- Données de base pour RL-1 et T4

### 🇫🇷 Module fiscal France
- Suivi TVA (20%, 10%, 5.5%, 2.1%)
- TVA collectée vs TVA déductible
- Résumé déclaration CA3
- Export FEC (Fichier des Écritures Comptables, format DGFiP)

### 📄 Rapports
- Compte de résultat par période / juridiction
- Export PDF (ReportLab) et CSV
- Tous les rapports affichent : montant original + montant converti + taux historique utilisé

## Structure du projet

```
Compta-expert/
├── backend/
│   ├── app/
│   │   ├── api/         # Routes FastAPI
│   │   ├── core/        # Config, sécurité
│   │   ├── db/          # Session SQLAlchemy
│   │   ├── models/      # Modèles SQLAlchemy
│   │   ├── schemas/     # Schémas Pydantic
│   │   └── services/    # Logique métier
│   ├── requirements.txt
│   └── seed_categories.py
├── frontend/
│   └── src/
│       ├── components/  # Composants React
│       ├── pages/       # Pages de l'app
│       ├── hooks/       # Hooks personnalisés
│       ├── store/       # Zustand store
│       ├── i18n/        # Traductions FR/EN
│       ├── types/       # Types TypeScript
│       └── utils/       # Utilitaires (axios, formatage)
├── nginx/
└── docker-compose.yml
```

## Variables d'environnement

```env
DATABASE_URL=postgresql://compta:compta_secret@db:5432/compta_expert
SECRET_KEY=change-me-in-production
FRANKFURTER_API_URL=https://api.frankfurter.app
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Initialisation des catégories

```bash
cd backend && python seed_categories.py
```
