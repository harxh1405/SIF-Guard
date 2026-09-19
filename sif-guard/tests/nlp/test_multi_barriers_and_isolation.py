import pytest
from app.services.extraction.rules.activity_rules import activity_rule_engine
from app.services.extraction.rules.hazard_rules import hazard_rule_engine
from app.services.extraction.rules.energy_rules import energy_rule_engine
from app.services.extraction.rules.exposure_rules import exposure_consequence_engine
from app.services.extraction.rules.barrier_rules import barrier_rule_engine
from app.services.extraction.resolver.resolver import entity_resolver
from app.services.extraction.provenance import EntityEvidence


def test_gap6_isolated_activity_rule_engine():
    """Gap #6: Direct unit test for ActivityRuleEngine in isolation."""
    assert activity_rule_engine.evaluate("Entering underground chamber to inspect piping.") == "confined space entry"
    assert activity_rule_engine.evaluate("Contractor performing torch cutting on pipe support.") == "hot work"
    assert activity_rule_engine.evaluate("Worker standing on elevated walkway near open edge.") == "work at height"
    assert activity_rule_engine.evaluate("Technician unbolting high pressure flange.") == "pressurized system maintenance"
    assert activity_rule_engine.evaluate("Electrician repairing 440V switchgear.") == "electrical work"
    assert activity_rule_engine.evaluate("Routine inspection of administrative office.") == "routine inspection"
    assert activity_rule_engine.evaluate("Normal sunny day with no activity.") is None


def test_gap6_isolated_hazard_rule_engine():
    """Gap #6: Direct unit test for HazardRuleEngine in isolation."""
    assert hazard_rule_engine.evaluate("High H2S concentration detected.") == "toxic gas / hazardous atmosphere"
    assert hazard_rule_engine.evaluate("Unprotected open hole on elevated platform.") == "fall from height"
    assert hazard_rule_engine.evaluate("Worker reached toward exposed live circuit terminals.") == "electrical energy / live circuit"
    assert hazard_rule_engine.evaluate("Acid began leaking from corroded transfer line.") == "chemical exposure"
    # Negative / office control
    assert hazard_rule_engine.evaluate("Administrative office chair had a loose armrest.") == "ergonomic / minor office hazard"
    assert hazard_rule_engine.evaluate("Routine paperwork review.") is None


def test_gap6_isolated_energy_rule_engine():
    """Gap #6: Direct unit test for EnergyRuleEngine in isolation."""
    assert "electrical" in energy_rule_engine.evaluate("The electrical supply was energized.").lower()
    assert "mechanical" in energy_rule_engine.evaluate("Rotating shaft held stored mechanical energy.").lower()
    assert "gravitational" in energy_rule_engine.evaluate("Suspended load above workers under gravity.").lower()
    assert "thermal" in energy_rule_engine.evaluate("Intense thermal energy during welding operation.").lower()
    assert "chemical" in energy_rule_engine.evaluate("Concentrated acid was released from line.").lower()
    assert "pressurized" in energy_rule_engine.evaluate("High pressure gas escaped.").lower()
    assert energy_rule_engine.evaluate("Administrative office routine work.") is None


def test_gap6_isolated_exposure_and_consequence_engine():
    """Gap #6: Direct unit test for ExposureAndConsequenceEngine in isolation."""
    # Exposure in isolation
    exp_unsafe = exposure_consequence_engine.evaluate_exposure("Worker entered the line of fire under crane.")
    assert exp_unsafe == "line of fire"

    exp_safe = exposure_consequence_engine.evaluate_exposure("Worker remained outside the line of fire.")
    assert exp_safe == "controlled" or exp_safe is None

    exp_toxic = exposure_consequence_engine.evaluate_exposure("Worker inhaled H2S in vessel.")
    assert "toxic" in exp_toxic.lower() or "inhalation" in exp_toxic.lower()

    # Consequence in isolation
    cons_drown = exposure_consequence_engine.evaluate_consequence("Worker swept into the water and drowned.")
    assert "drown" in cons_drown.lower()

    cons_struct = exposure_consequence_engine.evaluate_consequence("Unsupported structure could have collapsed.")
    assert "collapse" in cons_struct.lower() or "crush" in cons_struct.lower()

    cons_acid = exposure_consequence_engine.evaluate_consequence("Acid could have caused severe corrosive burns.")
    assert "corrosive" in cons_acid.lower() or "burn" in cons_acid.lower()


def test_gap6_isolated_barrier_rule_engine():
    """Gap #6: Direct unit test for BarrierRuleEngine in isolation."""
    # Failure detected on process line / zero energy
    res_fail = barrier_rule_engine.evaluate("Technician opened process line without zero energy verification.")
    assert res_fail["barrier"] is not None
    assert res_fail["barrier_failure"] is not None
    assert "zero-energy" in res_fail["barrier_failure"].lower() or "verification" in res_fail["barrier_failure"].lower()

    # Historical audit / resolved controls -> no failure
    res_audit = barrier_rule_engine.evaluate("Auditor confirmed that the new controls were being followed and pump remained isolated.")
    assert res_audit["barrier_failure"] is None

    # Completely safe narrative
    res_safe = barrier_rule_engine.evaluate("Workers applied lockout/tagout padlocks and verified zero voltage.")
    assert res_safe["barrier"] is not None
    assert res_safe["barrier_failure"] is None


def test_gap7_isolated_entity_resolver():
    """Gap #7: Direct unit test for EntityResolver in isolation."""
    # A. Canonicalization of LOTO, machine guard, and gas testing
    rule_res = {
        "activity": "machinery maintenance",
        "hazard": "rotating equipment",
        "barrier": "loto",
        "barrier_failure": "padlock not installed",
        "exposure": "line of fire",
        "energy_source": "mechanical",
        "potential_consequence": "amputation",
        "equipment": None,
        "all_barriers": ["energy isolation (LOTO)"],
        "all_failures": ["padlock not installed"]
    }
    trans_entities = [
        EntityEvidence(text="compressor C-101", label="EQUIPMENT", start=10, end=26, confidence=0.95, source="transformer"),
        # Canonical agreement on barrier
        EntityEvidence(text="lockout / tagout", label="BARRIER", start=30, end=46, confidence=0.92, source="transformer")
    ]

    res = entity_resolver.resolve(trans_entities, rule_res)

    # 1. Canonicalization check
    assert res.schema.barrier == "energy isolation (LOTO)"
    assert res.schema.activity == "machinery maintenance"

    # 2. Enrichment: transformer enriched missing equipment
    assert res.schema.equipment == "compressor C-101"

    # 3. Duplicate merge: rule barrier merged with transformer barrier into transformer+rule
    barrier_prov = [p for p in res.provenance if p.label == "BARRIER"]
    assert len(barrier_prov) >= 1
    assert any(p.source == "transformer+rule" for p in barrier_prov)

    # B. Test machine guard and gas test canonicalization
    rule_guard = {"barrier": "machine guard"}
    res_guard = entity_resolver.resolve([], rule_guard)
    assert res_guard.schema.barrier == "machine guarding"

    rule_gas = {"barrier": "gas test"}
    res_gas = entity_resolver.resolve([], rule_gas)
    assert res_gas.schema.barrier == "gas testing"


def test_gap8_multiple_simultaneous_barriers():
    """Gap #8: Text mentioning multiple active/required barriers captures all in all_barriers."""
    text = (
        "During confined space maintenance inside the vessel, a work permit was issued, "
        "atmospheric testing was conducted, and continuous gas monitoring was maintained."
    )
    res = barrier_rule_engine.evaluate(text)
    assert len(res["all_barriers"]) >= 2
    # Verify expected categories are present
    categories = [b.lower() for b in res["all_barriers"]]
    assert any("permit" in c for c in categories)
    assert any("atmospheric" in c or "gas" in c for c in categories)


def test_gap9_multiple_simultaneous_barrier_failures():
    """Gap #9: Text describing multiple distinct barrier failures captures all in all_failures."""
    text = (
        "During maintenance inside the storage vessel, entry was made without a work permit, "
        "atmospheric testing had not been performed, and no ventilation was provided."
    )
    res = barrier_rule_engine.evaluate(text)
    assert len(res["all_failures"]) >= 2
    failures = [f.lower() for f in res["all_failures"]]
    assert any("permit" in f for f in failures)
    assert any("atmospheric" in f or "gas" in f or "testing" in f for f in failures)
