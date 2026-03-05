"""
Seed script: insert default categories for both jurisdictions.
Run: python seed_categories.py
"""

import sys
sys.path.insert(0, ".")

from app.db.database import SessionLocal
from app.models.category import Category

CATEGORIES = [
    # Income — Both
    {"name": "Consulting / Services", "name_fr": "Conseil / Services", "type": "income", "jurisdiction": "both"},
    {"name": "Product Sales", "name_fr": "Ventes de produits", "type": "income", "jurisdiction": "both"},
    {"name": "Freelance", "name_fr": "Freelance / Indépendant", "type": "income", "jurisdiction": "both"},
    {"name": "Rental Income", "name_fr": "Revenus locatifs", "type": "income", "jurisdiction": "both"},
    {"name": "Investment", "name_fr": "Investissements", "type": "income", "jurisdiction": "both"},
    {"name": "Other Income", "name_fr": "Autres revenus", "type": "income", "jurisdiction": "both"},
    # Expense — Both
    {"name": "Office Supplies", "name_fr": "Fournitures de bureau", "type": "expense", "jurisdiction": "both"},
    {"name": "Software / SaaS", "name_fr": "Logiciels / SaaS", "type": "expense", "jurisdiction": "both"},
    {"name": "Travel", "name_fr": "Déplacements / Voyages", "type": "expense", "jurisdiction": "both"},
    {"name": "Meals & Entertainment", "name_fr": "Repas et représentation", "type": "expense", "jurisdiction": "both"},
    {"name": "Professional Services", "name_fr": "Services professionnels", "type": "expense", "jurisdiction": "both"},
    {"name": "Telecommunications", "name_fr": "Télécommunications", "type": "expense", "jurisdiction": "both"},
    {"name": "Bank Fees", "name_fr": "Frais bancaires", "type": "expense", "jurisdiction": "both"},
    {"name": "Insurance", "name_fr": "Assurances", "type": "expense", "jurisdiction": "both"},
    {"name": "Rent / Lease", "name_fr": "Loyer / Location", "type": "expense", "jurisdiction": "both"},
    {"name": "Other Expenses", "name_fr": "Autres dépenses", "type": "expense", "jurisdiction": "both"},
    # Quebec-specific
    {"name": "Quebec Payroll (RL-1)", "name_fr": "Salaires Québec (RL-1)", "type": "expense", "jurisdiction": "quebec"},
    {"name": "CNESST Contributions", "name_fr": "Cotisations CNESST", "type": "expense", "jurisdiction": "quebec"},
    {"name": "RRQ Contributions", "name_fr": "Cotisations RRQ", "type": "expense", "jurisdiction": "quebec"},
    # France-specific
    {"name": "URSSAF Contributions", "name_fr": "Cotisations URSSAF", "type": "expense", "jurisdiction": "france"},
    {"name": "French Payroll", "name_fr": "Salaires France", "type": "expense", "jurisdiction": "france"},
    {"name": "CFE / CVAE", "name_fr": "CFE / CVAE", "type": "expense", "jurisdiction": "france"},
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Category).count()
        if existing > 0:
            print(f"Categories already seeded ({existing} found). Skipping.")
            return

        for cat_data in CATEGORIES:
            cat = Category(**cat_data)
            db.add(cat)
        db.commit()
        print(f"Seeded {len(CATEGORIES)} categories.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
