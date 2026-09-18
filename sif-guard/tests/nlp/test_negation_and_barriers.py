import pytest
from app.services.extraction.service import extraction_service
from app.services.extraction.rules.negation import negation_engine
from app.services.extraction.rules.barrier_rules import barrier_rule_engine
from app.services.extraction.rules.corrective_action import corrective_action_filter


def test_negation_statements():
    """Verify 5 negation statements correctly distinguish active barrier presence from barrier failure."""
    # 1. "gas testing was performed" -> Not a failure
    t1 = "Atmospheric gas testing was performed prior to personnel entering the facility area."
    assert not negation_engine.is_barrier_failed("gas testing", t1)
    e1 = extraction_service.extract(t1)
    assert e1.barrier_failure is None or "gas" not in e1.barrier_failure.lower()

    # 2. "gas testing was not performed" -> IS a barrier failure
    t2 = "Gas testing was not performed before starting the cutting work."
    assert negation_engine.is_barrier_failed("gas testing", t2)
    b2 = barrier_rule_engine.evaluate(t2)
    assert b2["barrier_failure"] is not None
    assert "gas" in b2["barrier_failure"].lower()

    # 3. "lockout/tagout was applied before entry" -> Not a failure
    t3 = "Lockout/tagout was applied and zero energy verified before technician entered the panel."
    assert not negation_engine.is_barrier_failed("lockout/tagout", t3)
    e3 = extraction_service.extract(t3)
    assert e3.barrier_failure is None or "lockout" not in e3.barrier_failure.lower()

    # 4. "lockout/tagout was not applied before maintenance" -> IS a failure
    t4 = "Lockout/tagout was not applied before maintenance on the hydraulic unit."
    assert negation_engine.is_barrier_failed("lockout/tagout", t4)
    b4 = barrier_rule_engine.evaluate(t4)
    assert b4["barrier_failure"] is not None
    assert "isolation" in b4["barrier_failure"].lower() or "lockout" in b4["barrier_failure"].lower()

    # 5. "machine guard was securely installed on the grinder" -> Not a failure
    t5 = "The safety machine guard was securely installed and inspected on the bench grinder."
    assert not negation_engine.is_barrier_failed("machine guard", t5)
    e5 = extraction_service.extract(t5)
    assert e5.barrier_failure is None or "guard" not in e5.barrier_failure.lower()


def test_eight_barrier_failure_statements():
    """Verify 8 barrier failure statements across canonical barrier taxonomies."""
    cases = [
        ("Process pipe flange opened without confirming zero pressure or depressurization.", "pressure isolation"),
        ("Worker commenced hot work cutting without valid hot work permit.", "hot work permit"),
        ("Worker exposed on elevated scaffolding without fall protection harness.", "fall protection"),
        ("Technician operating lathe with rotating coupling guard removed.", "machine guard"),
        ("Operator entered storage tank without atmospheric testing.", "atmospheric testing"),
        ("Entered 3-meter deep trench without shoring or trench box.", "excavation"),
        ("Riggers bypassed exclusion zone and stood under suspended load.", "exclusion zone"),
        ("Forklift reversed through pedestrian walkway with no spotter.", "exclusion zone"),
    ]

    for narrative, expected_keyword in cases:
        b_res = barrier_rule_engine.evaluate(narrative)
        assert b_res["barrier_failure"] is not None, f"Expected failure in: {narrative}"
        combined_text = " ".join(b_res.get("all_barriers", []) + [b_res["barrier"] or ""] + b_res.get("all_failures", []) + [b_res["barrier_failure"] or ""]).lower()
        assert expected_keyword.lower() in combined_text, f"Expected keyword '{expected_keyword}' in barrier/failure for: {narrative}"


def test_corrective_action_filtering():
    """Ensure post-incident corrective actions are filtered from pre-incident barrier evaluations."""
    raw_text = (
        "During pipe alignment, a pinch injury occurred because the guard was bypassed. "
        "Following the incident, the safety team installed a machine guard and retrained the crew."
    )
    filtered = corrective_action_filter.filter_narrative(raw_text)
    # The post-incident action clause should be filtered out
    assert "retrained the crew" not in filtered
    assert "installed a machine guard" not in filtered
    # The incident failure itself remains detected
    b_res = barrier_rule_engine.evaluate(filtered)
    assert b_res["barrier_failure"] is not None
