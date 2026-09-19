from typing import Dict, Optional

# Canonical mapping for barriers
BARRIER_CANONICAL_MAP = {
    "energy isolation (loto)": "energy isolation (LOTO)",
    "energy isolation (LOTO)": "energy isolation (LOTO)",
    "loto": "energy isolation (LOTO)",
    "lockout": "energy isolation (LOTO)",
    "lockout/tagout": "energy isolation (LOTO)",
    "lockout / tagout": "energy isolation (LOTO)",
    "energy isolation": "energy isolation (LOTO)",
    "electrical isolation": "energy isolation (LOTO)",
    "pressure isolation": "pressure isolation / depressurization",
    "depressurization": "pressure isolation / depressurization",
    "atmospheric testing": "atmospheric testing",
    "gas testing": "gas testing",
    "gas test": "gas testing",
    "machine guard": "machine guarding",
    "machine guarding": "machine guarding",
    "equipment guard": "machine guarding",
    "coupling guard": "machine guarding",
    "fall protection": "fall protection system",
    "safety harness": "fall protection system",
    "harness": "fall protection system",
    "barricade": "exclusion zone / barricading",
    "barricading": "exclusion zone / barricading",
    "exclusion zone": "exclusion zone / barricading",
    "restricted area": "exclusion zone / barricading",
    "drop zone": "exclusion zone / barricading",
    "hot work permit": "hot work permit",
    "hot-work permit": "hot work permit",
    "excavation protection": "excavation protection",
    "shoring": "excavation protection",
    "trench box": "excavation protection",
    "standby attendant": "confined space controls",
    "hole watch": "confined space controls",
    "confined space controls": "confined space controls"
}

ACTIVITY_CANONICAL_MAP = {
    "confined space": "confined space entry",
    "confined space entry": "confined space entry",
    "vessel entry": "confined space entry",
    "hot work": "hot work",
    "welding": "hot work",
    "crane lift": "lifting operation",
    "lifting": "lifting operation",
    "lifting operation": "lifting operation",
    "pressure testing": "pressurized system maintenance",
    "line breaking": "pressurized system maintenance",
    "pressurized system maintenance": "pressurized system maintenance",
    "trenching": "excavation work",
    "excavation": "excavation work",
    "excavation work": "excavation work",
    "work at height": "work at height",
    "working at height": "work at height",
    "machinery operation / grinding": "machinery operation / grinding",
    "machinery maintenance": "machinery maintenance",
    "routine inspection": "routine inspection",
    "office inspection": "routine inspection"
}


def canonicalize_barrier(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    cleaned = name.strip().lower()
    return BARRIER_CANONICAL_MAP.get(cleaned, cleaned)


def canonicalize_activity(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    cleaned = name.strip().lower()
    return ACTIVITY_CANONICAL_MAP.get(cleaned, cleaned)
