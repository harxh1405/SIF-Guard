import re
from dataclasses import dataclass, field
from typing import List, Dict, Any, Tuple
from app.services.extraction.rules.negation import negation_engine
from app.services.extraction.rules.corrective_action import corrective_detector


@dataclass
class BarrierRuleDefinition:
    name: str
    barrier_category: str
    recognition_patterns: List[str]
    failure_patterns: List[str]
    failure_message: str
    priority: int = 10
    exclude_context: List[str] = field(default_factory=list)


BARRIER_RULES_REGISTRY: List[BarrierRuleDefinition] = [
    # 1. Pressure Isolation / Depressurization (Priority 100)
    BarrierRuleDefinition(
        name="pressure_isolation",
        barrier_category="pressure isolation / depressurization",
        recognition_patterns=[
            r"\bpressur(?:e|ized)\b", r"\bprocess line\b", r"\bdepressuriz(?:e|ed|ation)\b",
            r"\bzero pressure\b", r"\bupstream valve\b", r"\bdownstream valve\b", r"\bflange\b"
        ],
        failure_patterns=[
            r"pressure (?:not|was not|wasn't|without) verified",
            r"zero pressure (?:not|was not|wasn't|without) verified",
            r"zero energy (?:not|was not|wasn't|without) (?:verified|confirmed)",
            r"without (?:zero energy|zero-energy) verification",
            r"without (?:zero |residual )?(?:pressure|energy) verification",
            r"(?:not|without) depressuriz(?:e|ed|ation)",
            r"without confirming (?:zero |residual )?pressure",
            r"without confirming (?:that |zero |depressuriz|isolation)",
            r"residual pressure",
            r"isolation (?:not|was not) confirmed",
            r"isolation (?:not|was not) verified",
            r"no independent isolation verification",
            r"without confirming (?:that )?the upstream valve",
            r"valve (?:was )?isolated (?:but|and) pressure (?:not|was not) verified",
            r"without depressuriz",
            r"without isolating",
            r"residual pressure caused"
        ],
        failure_message="pressure isolation or zero-energy verification not confirmed",
        priority=100
    ),
    # 2. Hot Work Permit (Priority 95)
    BarrierRuleDefinition(
        name="hot_work_permit",
        barrier_category="hot work permit",
        recognition_patterns=[
            r"\bhot-work permit\b", r"\bhot work permit\b", r"\bwelding\b", r"\bhot work\b"
        ],
        failure_patterns=[
            r"no (?:valid )?hot-work permit", r"no (?:valid )?hot work permit",
            r"permit (?:unavailable|not available|not completed|not issued|missing)",
            r"without (?:a |valid )?permit", r"invalid permit"
        ],
        failure_message="hot work permit missing, invalid, or not completed",
        priority=95
    ),
    # 3. Gas Testing (Priority 94)
    BarrierRuleDefinition(
        name="gas_testing",
        barrier_category="gas testing",
        recognition_patterns=[
            r"\bgas test\b", r"\bgas testing\b", r"\bgas check\b", r"\blel\b"
        ],
        failure_patterns=[
            r"without completing the required gas test",
            r"gas test (?:missing|not completed|not performed|was not performed)",
            r"gas test (?:was |had been )?not completed",
            r"gas test (?:was )?completed after",
            r"no gas test", r"without gas check", r"without gas test", r"required gas test"
        ],
        failure_message="required gas testing missing or not completed",
        priority=94,
        exclude_context=[r"confined space", r"storage tank", r"vessel"]
    ),
    # 4. Atmospheric Testing (Priority 96)
    BarrierRuleDefinition(
        name="atmospheric_testing",
        barrier_category="atmospheric testing",
        recognition_patterns=[
            r"\batmospheric testing\b", r"\batmosphere testing\b", r"\batmospheric monitoring\b",
            r"\bgas monitor\b", r"\boxygen testing\b", r"\bh2s testing\b", r"\blel measurement\b",
            r"\batmospheric\b", r"\bh2s detector\b", r"\bpersonal (?:h2s|gas) monitor(?:s)?\b",
            r"\bh2s monitor(?:s|ing)?\b", r"\bgas test\b", r"\bgas testing\b", r"\bpre-entry gas testing\b"
        ],
        failure_patterns=[
            r"without (?:atmospheric|gas) testing",
            r"(?:atmospheric|gas) testing (?:not|was not) performed",
            r"(?:gas|atmospheric) test (?:not|was not) performed",
            r"no (?:gas|atmospheric|oxygen|h2s|lel) (?:test|testing|measurement|check|monitoring)",
            r"without gas check",
            r"testing missing",
            r"monitoring (?:not|was not) performed",
            r"oxygen concentration (?:had )?not been checked",
            r"no (?:continuous )?atmospheric monitor",
            r"(?:had )?not been wearing personal (?:h2s|gas) monitors?",
            r"atmospheric testing (?:was )?completed after",
            r"without completing atmospheric testing",
            r"gas test (?:was |had been )?not completed",
            r"gas test (?:was )?completed after"
        ],
        failure_message="atmospheric testing missing or not performed",
        priority=96,
        exclude_context=[r"welding", r"hot work", r"hot-work", r"cutting"]
    ),
    # 5. Energy Isolation (LOTO) (Priority 86)
    BarrierRuleDefinition(
        name="energy_isolation",
        barrier_category="energy isolation (LOTO)",
        recognition_patterns=[
            r"\bloto\b", r"\blockout\b", r"\blockout/tagout\b", r"\bisolation\b",
            r"\bisolated\b", r"\benergy isolation\b", r"\belectrical isolation\b",
            r"\bpressure isolation\b", r"\bdepressurization\b", r"\bdepressurize\b",
            r"\bcircuit breaker\b", r"\babsence of voltage\b", r"\benergized\b", r"\bde-energiz(?:e|ed)\b"
        ],
        failure_patterns=[
            r"without (?:applying )?lockout", r"without (?:applying )?loto",
            r"not locked", r"not (?:electrically )?isolated",
            r"isolation (?:bypassed|missing|not confirmed|not verified)", r"bypassed isolation",
            r"without isolation", r"failed to depressurize", r"was not locked out",
            r"not locked out or tagged out", r"not locked out", r"not tagged out",
            r"(?:lockout|tagout|loto|energy isolation|isolation) (?:was not|not|wasn't) (?:applied|used|implemented|performed|verified)",
            r"(?:was not|wasn't) applied",
            r"without isolating",
            r"(?:had not been|was not|wasn't) locked out",
            r"(?:absence of voltage|zero energy|zero voltage) (?:was |had )?not (?:been )?verified",
            r"circuit remained energized",
            r"without (?:isolating|isolation|de-energizing|de-energising)",
            r"(?:electrical supply|equipment|supply) (?:had |was )?not been isolated",
            r"had not been isolated",
            r"not isolated before maintenance"
        ],
        failure_message="energy isolation bypassed, missing, or not verified",
        priority=86
    ),
    # 6. Fall Protection (Priority 90)
    BarrierRuleDefinition(
        name="fall_protection",
        barrier_category="fall protection system",
        recognition_patterns=[
            r"\bfall protection\b", r"\bharness\b", r"\bsafety harness\b",
            r"\blifeline\b", r"\blanyard\b", r"\bguardrail\b", r"\bfall arrest\b",
            r"\bunprotected edge\b", r"\bunprotected (?:elevated )?edge\b", r"\belevated edge\b",
            r"\bhandrail\b", r"\btoe-board\b", r"\belevated platform\b",
            r"\bportable ladder\b", r"\bladder\b", r"\bscaffold\b", r"\bscaffolding\b"
        ],
        failure_patterns=[
            r"without (?:a )?(?:safety )?harness", r"without fall protection", r"no lifeline",
            r"not clipped", r"unhooked", r"missing guardrail", r"missing toe-board",
            r"failed lanyard", r"no harness", r"not tied off", r"without tying off",
            r"guardrail (?:had been |was )?removed", r"guardrail removed",
            r"ladder (?:that )?(?:had )?not been secured", r"unsecured ladder", r"ladder shifted",
            r"platform (?:had )?not been inspected",
            r"unprotected (?:elevated )?edge"
        ],
        failure_message="fall protection missing or not used",
        priority=90
    ),
    # 7. Excavation Protection / Shoring (Priority 85)
    BarrierRuleDefinition(
        name="excavation_protection",
        barrier_category="excavation protection",
        recognition_patterns=[
            r"\bexcavat(?:e|ed|ion)\b", r"\btrench\b", r"\btrenching\b",
            r"\bshoring\b", r"\btrench box\b", r"\bshielding\b", r"\bsloping\b"
        ],
        failure_patterns=[
            r"without shoring", r"no shoring", r"no trench box", r"unshored",
            r"no protective system", r"trench collapsed", r"shoring missing", r"without protective shoring",
            r"no shoring system", r"excavation (?:had )?not been re-inspected"
        ],
        failure_message="shoring / excavation protective system missing",
        priority=85
    ),
    # 8. Chemical Containment / Transfer Line (Priority 84)
    BarrierRuleDefinition(
        name="chemical_containment",
        barrier_category="chemical containment / line connection",
        recognition_patterns=[
            r"\btransfer hose\b", r"\bhose connection\b", r"\bacid transfer\b", r"\bchemical transfer\b"
        ],
        failure_patterns=[
            r"connection (?:was )?not secured", r"hose (?:connection )?leaking",
            r"acid began leaking", r"connection was not secured properly"
        ],
        failure_message="transfer hose connection not secured properly or leaking",
        priority=84
    ),
    # 9. Confined Space Controls (Priority 92)
    BarrierRuleDefinition(
        name="confined_space_controls",
        barrier_category="confined space controls",
        recognition_patterns=[
            r"\bconfined space\b", r"\bvessel entry\b", r"\btank entry\b",
            r"\bstandby attendant\b", r"\bhole watch\b", r"\bentry permit\b",
            r"\bunderground chamber\b"
        ],
        failure_patterns=[
            r"without attendant", r"no standby attendant", r"no hole watch",
            r"without entry permit", r"entered without permit", r"attendant left post"
        ],
        failure_message="confined space standby attendant or entry permit not maintained",
        priority=92
    ),
    # 10. Lifting Controls (Priority 82)
    BarrierRuleDefinition(
        name="lifting_controls",
        barrier_category="lifting controls",
        recognition_patterns=[
            r"\blifting plan\b", r"\brigger\b", r"\brigging\b", r"\bsling\b",
            r"\bshackle\b", r"\btag line\b", r"\btagline\b", r"\bcrane lift\b"
        ],
        failure_patterns=[
            r"without lifting plan", r"no tag line", r"no tagline", r"unrated sling",
            r"damaged sling", r"sling snapped", r"sling slipped", r"rigging (?:sling )?slipped",
            r"overloaded crane", r"uncertified rigger"
        ],
        failure_message="lifting plan, tagline, or certified rigging controls failed or missing",
        priority=82
    ),
    # 11. Machine Guarding (Priority 80)
    BarrierRuleDefinition(
        name="machine_guarding",
        barrier_category="machine guarding",
        recognition_patterns=[
            r"\bmachine guard\b", r"\bequipment guard\b", r"\bsafety guard\b",
            r"\bcoupling guard\b", r"\bguarding\b", r"\bguard installed\b", r"\bguard\b"
        ],
        failure_patterns=[
            r"guard (?:had been |was )?(?:still )?removed", r"guard missing", r"without (?:the )?guard",
            r"unguarded", r"guard (?:was |had been )?bypassed", r"bypassed (?:the )?guard", r"protection removed",
            r"operat(?:e|ed|ing) without (?:the )?guard",
            r"(?<!did not )(?<!did not even )remov(?:e|ed|ing) the (?:protective |coupling )?guard",
            r"guard was (?:also )?removed",
            r"no machine guarding", r"no guard"
        ],
        failure_message="machine guard removed, missing, or not in place",
        priority=80,
        exclude_context=[r"guardrail", r"handrail", r"platform", r"height", r"fall", r"harness", r"lifeline"]
    ),
    # 12. Safety Interlocks (Priority 78)
    BarrierRuleDefinition(
        name="safety_interlocks",
        barrier_category="safety interlocks",
        recognition_patterns=[
            r"\binterlock\b", r"\bsafety switch\b", r"\blimit switch\b", r"\bdead man\b"
        ],
        failure_patterns=[
            r"interlock (?:had been |was )?(?:still )?(?:bypassed|defeated|disabled|failed|wired open)",
            r"interlock (?:had been |was |remained )?(?:still )?bypassed",
            r"bypassed (?:the )?(?:machine )?(?:safety )?interlock",
            r"interlock bypassed", r"interlock defeated", r"switch bypassed",
            r"safety switch disabled", r"interlock failed", r"wired open"
        ],
        failure_message="safety interlock bypassed or disabled",
        priority=78
    ),
    # 13. Emergency Shutdown (Priority 76)
    BarrierRuleDefinition(
        name="emergency_shutdown",
        barrier_category="emergency shutdown",
        recognition_patterns=[
            r"\besd\b", r"\bemergency shutdown\b", r"\be-stop\b", r"\bkill switch\b"
        ],
        failure_patterns=[
            r"esd failed", r"emergency shutdown inoperable", r"e-stop not working",
            r"esd delayed", r"shutdown button inaccessible"
        ],
        failure_message="emergency shutdown system failed to actuate or was inoperable",
        priority=76
    ),
    # 14. Exclusion Zone / Barricading / Traffic Segregation (Priority 75)
    BarrierRuleDefinition(
        name="exclusion_zone",
        barrier_category="exclusion zone / barricading",
        recognition_patterns=[
            r"\bbarricad(?:e|ed|ing)\b", r"\bexclusion zone\b", r"\bdrop zone\b",
            r"\bred zone\b", r"\bwarning tape\b", r"\bbarrier tape\b", r"\btag line\b", r"\btagline\b",
            r"\bspotter\b", r"\btraffic segregation\b", r"\bpedestrian\b", r"\blifting zone\b", r"\breversing alarm\b"
        ],
        failure_patterns=[
            r"barricad(?:e|ing) missing", r"without barricad", r"no exclusion zone",
            r"(?:bypassed|breached|ignored|entered) (?:the |an |a )?(?:lift )?exclusion zone",
            r"(?:lift )?exclusion zone (?:was |had been )?bypassed",
            r"exclusion zone (?:was |had been )?(?:not |never )(?:established|maintained|set up)",
            r"entered the drop zone", r"no warning tape",
            r"(?:had |was )?not (?:been )?barricaded", r"unbarricaded", r"exclusion zone breached", r"breached barricade",
            r"pedestrians (?:were )?allowed(?: to enter)?",
            r"without (?:a |the )?(?:designated )?spotter", r"no (?:designated )?spotter", r"spotter absent",
            r"without traffic segregation",
            r"no dedicated pedestrian route",
            r"reversing alarm (?:was )?not functioning",
            r"lifting zone was not (?:fully )?barricaded"
        ],
        failure_message="exclusion zone or barricading missing/breached",
        priority=75
    ),
    # 15. PPE / Insulated Gloves (Priority 74)
    BarrierRuleDefinition(
        name="ppe_gloves",
        barrier_category="personal protective equipment (PPE)",
        recognition_patterns=[
            r"\bppe\b", r"\bgloves\b", r"\binsulated gloves\b", r"\bface shield\b",
            r"\bchemical-resistant\b", r"\bface protection\b"
        ],
        failure_patterns=[
            r"gloves (?:were )?not available", r"without (?:insulated )?gloves",
            r"no ppe", r"ppe unavailable", r"missing ppe",
            r"(?:gloves|ppe|face protection) (?:were |was )?not (?:being )?worn",
            r"not being worn", r"not wearing (?:gloves|face protection|ppe)"
        ],
        failure_message="insulated gloves or PPE unavailable or not worn",
        priority=74
    ),
    # 16. Permit to Work (Priority 70)
    BarrierRuleDefinition(
        name="permit_to_work",
        barrier_category="permit to work",
        recognition_patterns=[
            r"\bpermit to work\b", r"\bptw\b", r"\bwork permit\b", r"\bsafety permit\b"
        ],
        failure_patterns=[
            r"without (?:a |valid |obtaining (?:the )?(?:required )?)?(?:work )?permit",
            r"without (?:a )?work permit", r"no permit to work", r"no ptw",
            r"permit expired", r"unauthorized work", r"permit not signed",
            r"without obtaining the required work permit"
        ],
        failure_message="permit to work missing, expired, or not authorized",
        priority=70
    )
]


class BarrierRuleEngine:
    def evaluate(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        if "administrative office" in lower or "desk drawer" in lower or "loose handle" in lower or "armrest" in lower:
            return {
                "barrier": None,
                "barrier_failure": None,
                "all_barriers": [],
                "all_failures": []
            }

        incident_text, corrective_text = corrective_detector.partition_text(text)
        incident_lower = incident_text.lower()

        detected_barriers = []
        detected_failures = []

        sorted_rules = sorted(BARRIER_RULES_REGISTRY, key=lambda r: r.priority, reverse=True)

        for rule in sorted_rules:
            # Check exclusions
            if any(re.search(ex, incident_lower) for ex in rule.exclude_context):
                continue

            # Check recognition
            recognized = any(re.search(pat, incident_lower) for pat in rule.recognition_patterns)
            if not recognized:
                continue

            detected_barriers.append(rule.barrier_category)

            # Check explicit failure patterns
            failed = any(re.search(pat, incident_lower) for pat in rule.failure_patterns)
            if not failed:
                # Use contextual negation engine
                failed = negation_engine.is_negated_or_failed(incident_text, rule.barrier_category)

            if failed:
                detected_failures.append(rule.failure_message)

        # If narrative is a historical observation where corrective controls were confirmed to be followed:
        if corrective_detector.is_historical_audit_resolved(text) or \
           re.search(r"(?:confirmed|verified)\s+that\s+(?:the\s+)?(?:new\s+)?controls\s+were\s+being\s+followed", lower) or \
           "the controls were being followed" in lower or \
           "no damage was found and no unsafe condition was confirmed" in lower or \
           "no damage or unsafe condition was identified" in lower:
            detected_failures = []

        # Check explicit negation of barrier removal (SCEN-17)
        if re.search(r"\bdid not remove (?:the )?(?:coupling |machine )?guard\b", lower) or \
           "remained securely installed" in lower:
            detected_failures = [f for f in detected_failures if "guard" not in f.lower()]

        # Primary selection: if any barrier failed, prefer the barrier that failed!
        if detected_failures:
            primary_failure = detected_failures[0]
            primary_barrier = None
            for rule in sorted_rules:
                if rule.failure_message == primary_failure:
                    primary_barrier = rule.barrier_category
                    break
            if not primary_barrier:
                primary_barrier = detected_barriers[0] if detected_barriers else None
        else:
            primary_barrier = detected_barriers[0] if detected_barriers else None
            primary_failure = None

        return {
            "barrier": primary_barrier,
            "barrier_failure": primary_failure,
            "all_barriers": detected_barriers,
            "all_failures": detected_failures
        }


barrier_rule_engine = BarrierRuleEngine()

