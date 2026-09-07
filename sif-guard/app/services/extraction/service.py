import re
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Tuple
from app.schemas.analysis import ExtractionSchema


@dataclass
class BarrierRule:
    name: str
    barrier_category: str
    recognition_patterns: List[str]
    failure_patterns: List[str]
    failure_message: str
    priority: int = 10
    exclude_context: List[str] = field(default_factory=list)


class RuleBasedExtractor:
    """
    Domain-aware extractor for safety incident narratives.
    Identifies activity, hazard, exposure, energy source, equipment, human/environmental factors,
    barriers, barrier failures, and potential consequences using a deterministic barrier taxonomy.
    """

    def __init__(self):
        self.barrier_rules = self._init_barrier_rules()

    def _init_barrier_rules(self) -> List[BarrierRule]:
        return [
            # 1. Pressure Isolation / Depressurization (Priority 100)
            BarrierRule(
                name="pressure_isolation",
                barrier_category="pressure isolation / depressurization",
                recognition_patterns=[
                    r"\bpressur(?:e|ized)\b", r"\bprocess line\b", r"\bdepressuriz(?:e|ed|ation)\b",
                    r"\bzero pressure\b", r"\bupstream valve\b", r"\bdownstream valve\b", r"\bflange\b"
                ],
                failure_patterns=[
                    r"pressure (?:not|was not|wasn't|without) verified",
                    r"zero pressure (?:not|was not|wasn't|without) verified",
                    r"(?:not|without) depressuriz(?:e|ed|ation)",
                    r"residual pressure",
                    r"isolation (?:not|was not) confirmed",
                    r"isolation (?:not|was not) verified",
                    r"no independent isolation verification",
                    r"without confirming (?:that )?the upstream valve",
                    r"valve (?:was )?isolated (?:but|and) pressure (?:not|was not) verified",
                    r"without depressuriz"
                ],
                failure_message="pressure isolation or zero-energy verification not confirmed",
                priority=100
            ),
            # 2. Hot Work Permit (Priority 95)
            BarrierRule(
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
            BarrierRule(
                name="gas_testing",
                barrier_category="gas testing",
                recognition_patterns=[
                    r"\bgas test\b", r"\bgas testing\b", r"\bgas check\b", r"\blel\b"
                ],
                failure_patterns=[
                    r"without completing the required gas test",
                    r"gas test (?:missing|not completed|not performed|was not performed)",
                    r"no gas test", r"without gas check", r"without gas test", r"required gas test"
                ],
                failure_message="required gas testing missing or not completed",
                priority=94
            ),
            # 4. Atmospheric Testing (Priority 93)
            BarrierRule(
                name="atmospheric_testing",
                barrier_category="atmospheric testing",
                recognition_patterns=[
                    r"\batmospheric testing\b", r"\batmosphere testing\b", r"\batmospheric monitoring\b",
                    r"\bgas monitor\b", r"\boxygen testing\b", r"\bh2s testing\b", r"\blel measurement\b",
                    r"\batmospheric\b"
                ],
                failure_patterns=[
                    r"without (?:atmospheric|gas) testing",
                    r"(?:atmospheric|gas) testing (?:not|was not) performed",
                    r"(?:gas|atmospheric) test (?:not|was not) performed",
                    r"no (?:gas|atmospheric|oxygen|h2s|lel) (?:test|testing|measurement|check|monitoring)",
                    r"without gas check",
                    r"testing missing",
                    r"monitoring (?:not|was not) performed"
                ],
                failure_message="atmospheric testing missing or not performed",
                priority=93,
                exclude_context=[r"welding", r"hot work", r"hot-work"]
            ),
            # 5. Energy Isolation (LOTO) (Priority 85)
            BarrierRule(
                name="energy_isolation",
                barrier_category="energy isolation (LOTO)",
                recognition_patterns=[
                    r"\bloto\b", r"\blockout\b", r"\blockout/tagout\b", r"\bisolation\b",
                    r"\bisolated\b", r"\benergy isolation\b", r"\belectrical isolation\b"
                ],
                failure_patterns=[
                    r"without (?:applying )?lockout", r"without (?:applying )?loto",
                    r"not locked", r"not (?:electrically )?isolated",
                    r"isolation (?:bypassed|missing|not confirmed|not verified)", r"bypassed isolation",
                    r"without isolation"
                ],
                failure_message="energy isolation bypassed, missing, or not verified",
                priority=85,
                exclude_context=[r"zero pressure", r"process line", r"depressuriz"]
            ),
            # 6. Machine Guarding (Priority 80)
            BarrierRule(
                name="machine_guarding",
                barrier_category="machine guarding",
                recognition_patterns=[
                    r"\bmachine guard\b", r"\bequipment guard\b", r"\bsafety guard\b",
                    r"\bcoupling guard\b", r"\bguarding\b", r"\bguard installed\b", r"\bguard\b"
                ],
                failure_patterns=[
                    r"guard (?:had been )?removed", r"guard missing", r"without (?:the )?guard",
                    r"no guard", r"unguarded", r"guard bypassed", r"protection removed",
                    r"operat(?:e|ed|ing) without (?:the )?guard", r"removing the coupling guard"
                ],
                failure_message="machine guard removed, missing, or bypassed",
                priority=80
            ),
            # 7. Fall Protection (Priority 80)
            BarrierRule(
                name="fall_protection",
                barrier_category="fall protection system",
                recognition_patterns=[
                    r"\bfall protection\b", r"\bharness\b", r"\bsafety harness\b",
                    r"\blifeline\b", r"\blanyard\b", r"\bguardrail\b", r"\bfall arrest\b",
                    r"\bunprotected edge\b", r"\bhandrail\b", r"\btoe-board\b"
                ],
                failure_patterns=[
                    r"without fall protection", r"no (?:safety )?harness", r"harness (?:not|was not) provided",
                    r"harness (?:not|was not) used", r"lifeline (?:missing|not provided|was provided)",
                    r"no lifeline", r"unprotected edge", r"guardrail missing", r"missing top handrail",
                    r"not tied off", r"fall protection (?:not|was not) provided"
                ],
                failure_message="fall protection missing or not used",
                priority=80
            ),
            # 8. Exclusion Zone / Barricading (Priority 75)
            BarrierRule(
                name="exclusion_zone",
                barrier_category="exclusion zone / barricading",
                recognition_patterns=[
                    r"\bexclusion zone\b", r"\bbarricade\b", r"\bbarricaded\b", r"\bbarricading\b",
                    r"\brestricted area\b", r"\bvehicle operating zone\b", r"\bwork zone\b",
                    r"\bpedestrian zone\b", r"\bpedestrians\b", r"\bunderneath\b"
                ],
                failure_patterns=[
                    r"(?:had |was )?not (?:been )?barricaded", r"no barricade", r"barricading missing",
                    r"exclusion zone (?:not|was not) established", r"no exclusion zone",
                    r"exclusion zone breached", r"pedestrians (?:were )?allowed",
                    r"entered (?:the )?vehicle operating zone",
                    r"work area (?:was )?not (?:barricaded|segregated)",
                    r"without segregation", r"lifting area (?:had |was )?not (?:been )?barricaded",
                    r"underneath"
                ],
                failure_message="exclusion zone or barricading missing/breached",
                priority=75
            ),
            # 9. Excavation Protection (Priority 75)
            BarrierRule(
                name="excavation_protection",
                barrier_category="excavation protection",
                recognition_patterns=[
                    r"\bexcavation\b", r"\btrench\b", r"\btrenching\b", r"\bshoring\b", r"\bprotective system\b"
                ],
                failure_patterns=[
                    r"without shoring", r"no shoring", r"shoring missing", r"no protective system",
                    r"protective system missing", r"unsupported excavation", r"unstable excavation",
                    r"cave-in protection absent", r"without shoring or a suitable protective system"
                ],
                failure_message="shoring / excavation protective system missing",
                priority=75
            ),
            # 10. Safety Interlocks (Priority 70)
            BarrierRule(
                name="safety_interlocks",
                barrier_category="safety interlocks",
                recognition_patterns=[
                    r"\binterlock\b", r"\bsafety interlock\b", r"\bload cell interlock\b"
                ],
                failure_patterns=[
                    r"interlock bypassed", r"bypassed crane load cell", r"bypassed", r"disabled",
                    r"defeated", r"not functioning", r"removed"
                ],
                failure_message="safety interlock bypassed or disabled",
                priority=70
            ),
            # 11. Permit to Work (Priority 65)
            BarrierRule(
                name="permit_to_work",
                barrier_category="permit to work",
                recognition_patterns=[
                    r"\bpermit to work\b", r"\bwork permit\b", r"\bptw\b"
                ],
                failure_patterns=[
                    r"no permit", r"permit unavailable", r"permit not issued", r"permit expired",
                    r"permit missing", r"started without permit", r"without permit"
                ],
                failure_message="permit to work missing, expired, or not issued",
                priority=65
            ),
            # 12. Confined Space Controls (Priority 60)
            BarrierRule(
                name="confined_space_controls",
                barrier_category="confined space controls",
                recognition_patterns=[
                    r"\bconfined space\b", r"\btank entry\b", r"\bvessel entry\b", r"\bmanhole\b"
                ],
                failure_patterns=[
                    r"without (?:atmospheric testing|permit|gas check|standby)",
                    r"no (?:entry permit|gas check|standby attendant)"
                ],
                failure_message="confined space entry controls incomplete or missing",
                priority=60
            ),
            # 13. Emergency Shutdown (Priority 55)
            BarrierRule(
                name="emergency_shutdown",
                barrier_category="emergency shutdown",
                recognition_patterns=[
                    r"\bemergency shutdown\b", r"\besd\b", r"\bemergency stop\b"
                ],
                failure_patterns=[
                    r"unavailable", r"not functioning", r"disabled", r"bypassed", r"not accessible"
                ],
                failure_message="emergency shutdown mechanism unavailable or failed",
                priority=55
            ),
            # 14. Lifting Controls (Priority 50)
            BarrierRule(
                name="lifting_controls",
                barrier_category="lifting controls / rigging",
                recognition_patterns=[
                    r"\blifting plan\b", r"\brigger\b", r"\btag line\b", r"\bload cell\b",
                    r"\brigging\b", r"\bhoisting sling\b", r"\bswl\b"
                ],
                failure_patterns=[
                    r"sling snapped", r"exceeding rated swl", r"bypassed crane load cell",
                    r"lifting without plan"
                ],
                failure_message="lifting controls or rigging safety bypassed/failed",
                priority=50
            ),
        ]

    def _extract_barrier_and_failure(self, t_lower: str) -> Tuple[Optional[str], Optional[str]]:
        sorted_rules = sorted(self.barrier_rules, key=lambda r: r.priority, reverse=True)

        failed_matches: List[Tuple[BarrierRule, int]] = []
        recognition_matches: List[BarrierRule] = []

        for rule in sorted_rules:
            # Check exclusions
            if any(re.search(ex, t_lower) for ex in rule.exclude_context):
                continue

            rec_match = any(re.search(p, t_lower) for p in rule.recognition_patterns)
            fail_match_pattern = next((p for p in rule.failure_patterns if re.search(p, t_lower)), None)

            if fail_match_pattern and (rec_match or any(k in fail_match_pattern for k in ["without", "no ", "missing", "bypassed", "not ", "underneath"])):
                match_obj = re.search(fail_match_pattern, t_lower)
                start_pos = match_obj.start() if match_obj else 0
                failed_matches.append((rule, start_pos))
            elif rec_match:
                recognition_matches.append(rule)

        if failed_matches:
            best_rule, _ = failed_matches[0]
            return best_rule.barrier_category, best_rule.failure_message

        if recognition_matches:
            best_rule = recognition_matches[0]
            return best_rule.barrier_category, None

        return None, None

    def extract(self, text: str, report_metadata: Optional[Dict[str, Any]] = None) -> ExtractionSchema:
        if not text:
            return ExtractionSchema()

        t_lower = text.lower()

        # 1. Activity / Task
        activity = None
        if report_metadata and report_metadata.get("task_assigned"):
            activity = str(report_metadata["task_assigned"])
        elif "excavation" in t_lower or "trench" in t_lower:
            activity = "excavation work"
        elif "vehicle" in t_lower and ("pedestrian" in t_lower or "operating zone" in t_lower or "traffic" in t_lower):
            activity = "vehicle / pedestrian interaction"
        elif "grinding" in t_lower or "grinder" in t_lower:
            activity = "machinery operation / grinding"
        elif "pressur" in t_lower or "flange" in t_lower or "process line" in t_lower:
            activity = "pressurized system maintenance"
        elif "welding" in t_lower or "cutting" in t_lower or "hot work" in t_lower or "torch" in t_lower:
            activity = "hot work"
        elif "confined space" in t_lower or "vessel" in t_lower or "tank" in t_lower:
            activity = "confined space entry"
        elif "suspended load" in t_lower or "crane" in t_lower or "lifting" in t_lower or "rigging" in t_lower:
            activity = "lifting operation"
        elif "roof" in t_lower or "ladder" in t_lower or "scaffold" in t_lower or "feet" in t_lower or "height" in t_lower or "above ground" in t_lower or "elevated" in t_lower:
            activity = "work at height"
        elif "electrical" in t_lower or "wiring" in t_lower or "breaker" in t_lower or "440v" in t_lower:
            activity = "electrical work"

        # 2. Hazard
        hazard = None
        if "excavation" in t_lower or "trench" in t_lower:
            hazard = "excavation collapse / cave-in"
        elif "vehicle" in t_lower and ("pedestrian" in t_lower or "operating zone" in t_lower):
            hazard = "vehicle-pedestrian interaction / struck-by"
        elif "grinding" in t_lower or "machine guard" in t_lower or "coupling guard" in t_lower or "rotating" in t_lower or "pinch" in t_lower or "caught in" in t_lower:
            hazard = "rotating machinery / caught-in"
        elif "process line" in t_lower or "flange" in t_lower or "residual pressure" in t_lower or "depressuriz" in t_lower:
            hazard = "pressure release"
        elif "welding" in t_lower or "hot work" in t_lower or "hot-work" in t_lower:
            hazard = "fire / explosion / flammable atmosphere"
        elif "h2s" in t_lower or "toxic" in t_lower or "poisonous" in t_lower or "gas" in t_lower:
            hazard = "toxic gas / hazardous atmosphere"
        elif "suspended load" in t_lower or "overhead load" in t_lower or "falling object" in t_lower or "crane" in t_lower:
            hazard = "suspended load / struck-by"
        elif "fall" in t_lower or "elevation" in t_lower or "height" in t_lower or "above ground" in t_lower:
            hazard = "fall from height"
        elif "pressur" in t_lower or "explosion" in t_lower or "flammab" in t_lower:
            hazard = "fire / explosion / pressure release"
        elif "chair" in t_lower or "desk" in t_lower or "office" in t_lower:
            hazard = "ergonomic / minor office hazard"

        # 3. Hazardous Substance
        hazsub = None
        if report_metadata and report_metadata.get("hazardous_substance"):
            hazsub = str(report_metadata["hazardous_substance"])
        elif "h2s" in t_lower or "hydrogen sulfide" in t_lower:
            hazsub = "Hydrogen Sulfide (H2S)"
        elif "hydrocarbon" in t_lower:
            hazsub = "hydrocarbons / flammable gas"
        elif "chemical" in t_lower or "acid" in t_lower or "solvent" in t_lower:
            hazsub = "hazardous chemical"

        # 4. Exposure
        exposure = None
        if "excavation" in t_lower or "trench" in t_lower:
            exposure = "worker exposed to excavation collapse"
        elif "vehicle" in t_lower and ("pedestrian" in t_lower or "operating zone" in t_lower):
            exposure = "pedestrian exposed to moving vehicle"
        elif "underneath" in t_lower or "line of fire" in t_lower or "suspended load" in t_lower:
            exposure = "worker in line of fire under suspended load"
        elif "without fall protection" in t_lower or "unprotected edge" in t_lower or "above ground" in t_lower or "height" in t_lower:
            exposure = "worker exposed to unprotected fall hazard"
        elif "without atmospheric testing" in t_lower or "entered vessel" in t_lower or "entered a storage tank" in t_lower or "toxic gas" in t_lower:
            exposure = "worker exposed to toxic gas / oxygen deficiency"
        elif "grinding" in t_lower or "machine guard" in t_lower or "coupling guard" in t_lower:
            exposure = "worker exposed to unguarded rotating machinery"
        elif "pressurized" in t_lower or "flange" in t_lower or "residual pressure" in t_lower:
            exposure = "worker exposed to hazardous pressure release"
        elif "office" in t_lower or "chair" in t_lower:
            exposure = "minimal hazard exposure"

        # 5. Energy Source
        energy_source = None
        if "excavation" in t_lower or "trench" in t_lower:
            energy_source = "potential kinetic / soil mass energy"
        elif "vehicle" in t_lower:
            energy_source = "vehicle kinetic energy"
        elif "pressur" in t_lower or "hydraulic" in t_lower or "pneumatic" in t_lower or "flange" in t_lower or "process line" in t_lower:
            energy_source = "pressurized fluid / gas energy"
        elif "h2s" in t_lower or "gas" in t_lower:
            energy_source = "chemical / toxic gas energy"
        elif "gravity" in t_lower or "fall" in t_lower or "suspended" in t_lower or "height" in t_lower or "above ground" in t_lower:
            energy_source = "potential kinetic / gravitational energy"
        elif "electrical" in t_lower or "voltage" in t_lower or "440v" in t_lower:
            energy_source = "electrical energy"

        # 6. Equipment
        equipment = None
        if "grinding" in t_lower or "grinder" in t_lower:
            equipment = "grinding machinery"
        elif "centrifugal pump" in t_lower or "pump" in t_lower:
            equipment = "centrifugal pump"
        elif "excavation" in t_lower or "trench" in t_lower:
            equipment = "excavation / trench"
        elif "crane" in t_lower or "hoist" in t_lower or "rigging" in t_lower:
            equipment = "crane / lifting equipment"
        elif "vessel" in t_lower or "tank" in t_lower or "storage tank" in t_lower or "pipe" in t_lower or "flange" in t_lower or "process line" in t_lower:
            equipment = "vessel / container / process line"
        elif "scaffold" in t_lower or "ladder" in t_lower or "platform" in t_lower:
            equipment = "scaffold / elevated platform / ladder"
        elif "electrical panel" in t_lower or "breaker" in t_lower:
            equipment = "electrical panel"
        elif "chair" in t_lower:
            equipment = "office furniture"

        # 7. Human & Environmental Factors
        human_factor = None
        if report_metadata and report_metadata.get("human_factor"):
            human_factor = str(report_metadata["human_factor"])
        elif any(k in t_lower for k in ["procedure", "bypassed", "ignored", "distraction", "without", "removed", "no "]):
            human_factor = "inappropriate positioning / procedure non-compliance"

        env_factor = None
        if report_metadata and report_metadata.get("environmental_factor"):
            env_factor = str(report_metadata["environmental_factor"])
        elif "excavation" in t_lower or "trench" in t_lower:
            env_factor = "excavation wall instability"
        elif "confined" in t_lower or "poor ventilation" in t_lower or "storage tank" in t_lower:
            env_factor = "confined space atmosphere"
        elif "elevated" in t_lower or "above ground" in t_lower or "height" in t_lower:
            env_factor = "elevated work location"
        elif "wet" in t_lower or "slippery" in t_lower or "wind" in t_lower:
            env_factor = "adverse environmental condition"

        # 8. Barrier & Barrier Failure using taxonomy engine
        barrier, barrier_failure = self._extract_barrier_and_failure(t_lower)

        # 9. Potential Consequence
        potential_consequence = None
        if "excavation" in t_lower or "trench" in t_lower:
            potential_consequence = "fatal crush / burial"
        elif "vehicle" in t_lower and ("pedestrian" in t_lower or "operating zone" in t_lower):
            potential_consequence = "fatal struck-by / crush injury"
        elif "grinding" in t_lower or "machine guard" in t_lower or "coupling guard" in t_lower:
            potential_consequence = "severe / fatal caught-in or struck-by injury"
        elif "process line" in t_lower or "residual pressure" in t_lower or "pressur" in t_lower:
            potential_consequence = "severe / fatal pressure release & impact injury"
        elif "h2s" in t_lower or "toxic" in t_lower or "asphyxiation" in t_lower:
            potential_consequence = "fatal asphyxiation / acute toxicity poisoning"
        elif "suspended load" in t_lower or "crushed" in t_lower:
            potential_consequence = "fatal crush / severe blunt force trauma"
        elif "height" in t_lower or "fall" in t_lower or "above ground" in t_lower:
            potential_consequence = "fatal fall from elevation"
        elif "explosion" in t_lower or "fire" in t_lower or "arc flash" in t_lower:
            potential_consequence = "fatal burns / blast trauma"
        elif "chair" in t_lower:
            potential_consequence = "minor pain / superficial strain"

        return ExtractionSchema(
            activity=activity,
            hazard=hazard,
            hazardous_substance=hazsub,
            exposure=exposure,
            energy_source=energy_source,
            equipment=equipment,
            human_factor=human_factor,
            environmental_factor=env_factor,
            barrier=barrier,
            barrier_failure=barrier_failure,
            potential_consequence=potential_consequence
        )


class ExtractionService:

    def __init__(self, extractor=None):
        self.extractor = extractor or RuleBasedExtractor()

    def extract(self, text: str, report_metadata: Optional[Dict[str, Any]] = None) -> ExtractionSchema:
        return self.extractor.extract(text, report_metadata)


extraction_service = ExtractionService()
