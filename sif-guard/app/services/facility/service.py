import uuid
import datetime
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter, defaultdict
from sqlalchemy.orm import Session

from app.db.models.report import SafetyReport
from app.schemas.facility import (
    FacilityZone,
    ZoneIncident,
    RiskFactor,
    FacilityRiskSummary,
    DemoScenario,
    DemoSimulationRequest,
    DemoSimulationResponse,
)
from app.services.extraction.service import extraction_service
from app.services.sif.classifier import sif_classifier
from app.services.lsr.matcher import lsr_matcher

# 7 Standardized Facility Zones Definition
FACILITY_ZONES_CONFIG: List[Dict[str, Any]] = [
    {
        "id": "wellhead-area",
        "name": "Wellhead Area",
        "code": "Z-01",
        "description": "High-pressure Christmas tree, drilling manifold, and BOP wellbore interface.",
        "svg_center": {"x": 180, "y": 200},
        "keywords": [
            "wellhead", "well", "drilling", "xmas tree", "christmas tree", "bop",
            "blowout", "casing", "derrick", "drill floor", "rig", "drill pipe",
            "tubing", "spudding", "mud pump", "wellbore", "wireline", "annular",
            "kelly", "top drive", "standpipe", "choke manifold"
        ],
        "default_actions": [
            "Mandatory dual-barrier verification on high-pressure casing and master valves.",
            "Audit BOP accumulator closing unit pressure test and inspection records.",
            "Verify rig-floor fall protection anchors and iron roughneck safety interlocks."
        ]
    },
    {
        "id": "pump-station",
        "name": "Pump Station",
        "code": "Z-02",
        "description": "High-volume centrifugal crude booster, gas compressors, and injection units.",
        "svg_center": {"x": 390, "y": 180},
        "keywords": [
            "pump", "centrifugal pump", "compressor", "pump station", "vibration",
            "booster pump", "seal", "bearing", "suction", "discharge", "impeller",
            "coupling", "motor drive", "lube oil", "cavitation", "mechanical seal",
            "rotating equipment", "booster"
        ],
        "default_actions": [
            "Execute immediate vibration and thermographic analysis on pump bearing housings.",
            "Enforce strict Lockout/Tagout (LOTO) verification prior to coupling or motor access.",
            "Inspect mechanical seal flush lines and hydrocarbon barrier fluid pressures."
        ]
    },
    {
        "id": "tank-farm",
        "name": "Tank Farm",
        "code": "Z-03",
        "description": "Atmospheric hydrocarbon storage vessels, secondary containment bunds, and vapor recovery.",
        "svg_center": {"x": 690, "y": 200},
        "keywords": [
            "tank", "storage tank", "tank farm", "diesel tank", "containment",
            "atmospheric tank", "tk-", "vessel", "hydrocarbon storage", "sump",
            "bund", "floating roof", "ullage", "blanketing", "dike", "drain valve",
            "overfill", "crude storage", "fuel tank", "slop tank"
        ],
        "default_actions": [
            "Inspect floating roof rim wiper seals and hydrocarbon vapor monitoring systems.",
            "Audit secondary containment dike drain valves and level radar alarm setpoints.",
            "Enforce gas testing before entry into tank perimeter bund walls."
        ]
    },
    {
        "id": "pipeline-corridor",
        "name": "Pipeline Corridor",
        "code": "Z-04",
        "description": "Gathering trunk lines, pigging launcher/receiver stations, and distribution headers.",
        "svg_center": {"x": 510, "y": 380},
        "keywords": [
            "pipeline", "pipe", "flange", "leak in line", "manifold", "corridor",
            "flowline", "gathering line", "valve pit", "pig launcher", "pig receiver",
            "header", "cathodic", "corrosion coupon", "block valve", "spool",
            "piping", "flange gasket", "pipeline crossing"
        ],
        "default_actions": [
            "Deploy optical gas imaging (OGI) and ultrasonic survey along gathering line headers.",
            "Check flange insulation kits and cathodic protection potential levels.",
            "Verify pressure relief valves (PRV) and zero-energy line break permits."
        ]
    },
    {
        "id": "control-room",
        "name": "Control Room",
        "code": "Z-05",
        "description": "Central SCADA command center, SIS logic solvers, and emergency shutdown (ESD) consoles.",
        "svg_center": {"x": 190, "y": 510},
        "keywords": [
            "control room", "scada", "dcs", "hmi", "operator console", "panel",
            "alarm", "switchboard", "plc", "server", "telemetry", "esd", "ups",
            "annunciator", "emergency shutdown", "console", "sis", "instrument air"
        ],
        "default_actions": [
            "Review standing alarm flood rates and prioritize critical process safety alarms.",
            "Conduct routine validation of ESD push-buttons and redundant UPS power banks.",
            "Verify operator handover logs for all active safety barrier overrides."
        ]
    },
    {
        "id": "maintenance-area",
        "name": "Maintenance Area",
        "code": "Z-06",
        "description": "Mechanical overhaul workshop, fabrication yard, crane staging, and scaffolding storage.",
        "svg_center": {"x": 460, "y": 520},
        "keywords": [
            "maintenance", "workshop", "scaffolding", "welding", "hot work",
            "grinding", "crane", "rigging", "fabrication", "machining", "lathe",
            "overhead crane", "gantry crane", "slings", "shackle", "tool box",
            "rigging gear", "ladder", "scaffold", "staging area", "workshop bay"
        ],
        "default_actions": [
            "Audit overhead rigging hardware, webbing slings, and wire rope certification tags.",
            "Verify continuous combustible gas and oxygen monitoring for active hot work permits.",
            "Enforce full harness double-lanyard 100% tie-off rules on scaffolding towers."
        ]
    },
    {
        "id": "loading-area",
        "name": "Loading / Unloading Area",
        "code": "Z-07",
        "description": "Road tanker loading gantry, vapor recovery arms, and grounding safety interlocks.",
        "svg_center": {"x": 730, "y": 510},
        "keywords": [
            "loading", "unloading", "gantry", "tanker", "truck", "transfer",
            "bay", "filling", "rack", "offloading", "hoses", "grounding clamp",
            "overfill probe", "loading arm", "top loading", "bottom loading",
            "fuel truck", "road tanker", "bonding cable"
        ],
        "default_actions": [
            "Inspect grounding clamp interlocks and verify static dissipation continuity.",
            "Test optical high-high level overfill shutdown sensors on loading gantry arms.",
            "Ensure vapor recovery return line dry-break couplings are leak-tight."
        ]
    },
]

DEMO_SCENARIO_CATALOG: List[DemoScenario] = [
    DemoScenario(
        id="demo-tank-farm-pressure",
        title="Tank Farm: High Pressure Flare Gas Ingress & Seal Leak",
        zone_id="tank-farm",
        zone_name="Tank Farm",
        severity="CRITICAL",
        description="Atmospheric crude storage tank TK-104 experienced rapid pressure buildup due to closed vent valve, with hydrocarbon vapor escaping near the rim seal.",
        simulated_text="During crude transfer into storage tank TK-104 in the tank farm, operator noticed abnormal pressure surging on the vapor recovery line. The primary rim seal showed heavy hydrocarbon vapor leakage. Atmospheric testing detected combustible gases above 45% LEL in the bund basin with no emergency vent active."
    ),
    DemoScenario(
        id="demo-wellhead-bop-anomaly",
        title="Wellhead: BOP Annular Packoff Pressure Surge",
        zone_id="wellhead-area",
        zone_name="Wellhead Area",
        severity="CRITICAL",
        description="During drill pipe tripping at Wellpad 3, wellhead Christmas tree annular pressure surged past safety limits with incomplete barrier verification.",
        simulated_text="During tripping operations at the wellhead drill floor, crew observed sudden mud return surge and pressure spike on the blowout preventer (BOP) manifold. The annular preventer was closed without verified pressure isolation. Personnel were working directly in the line of fire of the high pressure standpipe."
    ),
    DemoScenario(
        id="demo-pump-vibration-thermal",
        title="Pump Station: Booster Bearing Vibration & Thermal Spike",
        zone_id="pump-station",
        zone_name="Pump Station",
        severity="HIGH",
        description="Main centrifugal crude export booster pump P-201 exhibited severe bearing vibration (14.2 mm/s) with missing coupling guard.",
        simulated_text="Crude booster pump P-201 in the pump station experienced severe high-frequency vibration and bearing temperature spike above 95°C. The technician found the mechanical coupling guard loose and partially detached while the pump was operating under full discharge pressure."
    ),
    DemoScenario(
        id="demo-pipeline-flange-leak",
        title="Pipeline Corridor: Gathering Flange Hydrocarbon Seepage",
        zone_id="pipeline-corridor",
        zone_name="Pipeline Corridor",
        severity="HIGH",
        description="Gathering pipeline header flange PL-08 developed pressurized pinhole hydrocarbon spray across the access right-of-way.",
        simulated_text="Field operator detected wet hydrocarbon mist spraying from a 10-inch ANSI 600 gathering pipeline flange joint along the main pipeline corridor. The bolts had not been torqued following recent gasket replacement and barrier isolation had not been re-tested."
    ),
    DemoScenario(
        id="demo-maintenance-crane-drop",
        title="Maintenance: Uncertified Rigging Sling Near-Drop Hazard",
        zone_id="maintenance-area",
        zone_name="Maintenance Area",
        severity="CRITICAL",
        description="Heavy 3.5-ton compressor cylinder head was lifted using frayed web sling without tag line or exclusion zone barricades.",
        simulated_text="In the mechanical maintenance workshop, an overhead crane was hoisting a 3.5-ton compressor head using an uninspected frayed synthetic sling. The load swung erratically over two mechanics who were working without an exclusion barricade or hard hats in the line of fire."
    ),
    DemoScenario(
        id="demo-loading-grounding-failure",
        title="Loading Gantry: Tanker Static Grounding Clamp Bypass",
        zone_id="loading-area",
        zone_name="Loading / Unloading Area",
        severity="HIGH",
        description="Road tanker bottom-loading proceeded with bypassed static ground monitoring probe, creating major spark risk.",
        simulated_text="At loading gantry Bay 2, high-rate gasoline transfer into a road tanker was initiated while the ground clamp wire was severed. The operator bypassed the interlock switch manually, creating an imminent electrostatic ignition hazard during fuel offloading."
    ),
    DemoScenario(
        id="demo-control-room-esd-alarm",
        title="Control Room: ESD Loop Supervisory Logic Fault",
        zone_id="control-room",
        zone_name="Control Room",
        severity="MODERATE",
        description="SCADA workstation displayed intermittent communication loss with remote emergency shutdown (ESD) marshalling rack.",
        simulated_text="SCADA operators in the central control room reported repeated intermittent signal drops on the safety instrumented system (SIS) network loop connecting to the field emergency shutdown valves. Primary alarm buzzer was muted during shift change."
    ),
]


class FacilityService:
    def __init__(self):
        self._demo_incidents: List[ZoneIncident] = []
        self._zone_lookup = {z["id"]: z for z in FACILITY_ZONES_CONFIG}

    def infer_zone_id(
        self,
        report_text: str,
        activity: Optional[str] = None,
        hazard: Optional[str] = None,
        equipment: Optional[str] = None,
        barrier_failure: Optional[str] = None,
        raw_location: Optional[str] = None,
        raw_data: Optional[Dict[str, Any]] = None,
        deterministic_seed: Optional[str] = None
    ) -> str:
        """
        Infers the facility zone for a given safety observation report.
        Deterministic & Explainable: Structured location/zone fields take precedence,
        followed by weighted keyword matching across narrative and extracted dimensions.
        """
        # 1. Check structured raw data or location
        if raw_data and isinstance(raw_data, dict):
            structured_zone = raw_data.get("zone_id") or raw_data.get("facility_zone")
            if structured_zone and structured_zone in self._zone_lookup:
                return structured_zone

        if raw_location:
            loc_lower = raw_location.lower()
            for z in FACILITY_ZONES_CONFIG:
                if z["id"] in loc_lower or z["name"].lower() in loc_lower:
                    return z["id"]

        # 2. Build aggregated search context with weights
        text_corpus = f"{report_text or ''} {activity or ''} {activity or ''} {hazard or ''} {equipment or ''} {equipment or ''} {barrier_failure or ''}".lower()

        scores: Dict[str, int] = defaultdict(int)
        for zone in FACILITY_ZONES_CONFIG:
            zone_id = zone["id"]
            for kw in zone["keywords"]:
                if kw in text_corpus:
                    # Give higher weight to longer exact phrases
                    weight = 3 if " " in kw else 1
                    scores[zone_id] += weight

        if scores:
            best_zone, best_score = max(scores.items(), key=lambda item: item[1])
            if best_score > 0:
                return best_zone

        # 3. Deterministic hash fallback
        if deterministic_seed:
            hash_val = sum(ord(c) for c in deterministic_seed)
            return FACILITY_ZONES_CONFIG[hash_val % len(FACILITY_ZONES_CONFIG)]["id"]

        return "wellhead-area"

    def calculate_zone_risk(
        self,
        zone_id: str,
        incidents: List[ZoneIncident]
    ) -> Tuple[int, str, str, int, List[RiskFactor], List[str]]:
        """
        Deterministic, explainable risk aggregation model.
        Returns: (risk_score, risk_level, trend, trend_delta, risk_factors, recommended_actions)
        """
        zone_cfg = self._zone_lookup.get(zone_id, FACILITY_ZONES_CONFIG[0])
        
        if not incidents:
            # Baseline quiet operational status
            return (
                18,
                "LOW",
                "STABLE",
                0,
                [
                    RiskFactor(
                        title="Baseline Facility Status",
                        impact="Nominal",
                        description="No active critical precursors recorded in current operational window.",
                        category="baseline"
                    )
                ],
                zone_cfg["default_actions"]
            )

        total_count = len(incidents)
        sif_count = sum(1 for i in incidents if i.sif_potential == "SIF_POTENTIAL" or i.severity == "CRITICAL")
        uncertain_count = sum(1 for i in incidents if i.sif_potential == "UNCERTAIN" or i.severity == "HIGH")
        barrier_failures = sum(1 for i in incidents if i.barrier_failure)
        high_conf_count = sum(1 for i in incidents if (i.sif_score or 0) >= 0.80 or (i.sif_confidence or 0) >= 0.80)

        # Raw Score Calculation
        raw_score = (
            sif_count * 28 +
            uncertain_count * 12 +
            barrier_failures * 14 +
            high_conf_count * 10 +
            min(20, total_count * 3)
        )

        # Normalization to 0-100 scale
        if total_count == 1:
            scaled = min(98, max(20, raw_score))
        else:
            scaled = min(98, max(15, int(raw_score * 1.15 / (total_count ** 0.35))))

        # Determine Risk Level
        if scaled >= 81:
            risk_level = "CRITICAL"
        elif scaled >= 61:
            risk_level = "HIGH"
        elif scaled >= 31:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        # Calculate Trend
        half = max(1, total_count // 2)
        recent_subset = incidents[:half]
        older_subset = incidents[half:]

        recent_sif = sum(1 for i in recent_subset if i.severity in ["CRITICAL", "HIGH"])
        older_sif = sum(1 for i in older_subset if i.severity in ["CRITICAL", "HIGH"])

        trend_delta = (recent_sif - older_sif) * 12
        if trend_delta > 0:
            trend = "INCREASE"
        elif trend_delta < 0:
            trend = "DECREASE"
        else:
            trend = "STABLE"

        # Dynamic Risk Factors Explainability
        factors: List[RiskFactor] = []
        if sif_count > 0:
            factors.append(
                RiskFactor(
                    title=f"{sif_count} High-Potential SIF Precursors",
                    impact=f"+{sif_count * 28} pts",
                    description=f"{sif_count} reports flagged with verified fatality / severe harm potential.",
                    category="sif_precursor"
                )
            )

        if barrier_failures > 0:
            factors.append(
                RiskFactor(
                    title=f"{barrier_failures} Active Barrier Breaches",
                    impact=f"+{barrier_failures * 14} pts",
                    description="Safety barriers, LOTO, gas testing, or machine guarding failed or bypassed.",
                    category="barrier_breach"
                )
            )

        if high_conf_count > 0:
            factors.append(
                RiskFactor(
                    title=f"{high_conf_count} High-Confidence Energy Exposures",
                    impact=f"+{high_conf_count * 10} pts",
                    description="AI NLP model identified extreme energy line-of-fire or pressure isolation failures.",
                    category="energy_exposure"
                )
            )

        if trend == "INCREASE":
            factors.append(
                RiskFactor(
                    title="Precursor Velocity Acceleration",
                    impact=f"+{trend_delta} pts",
                    description="Significant increase in near-miss frequency detected in recent shift telemetry.",
                    category="velocity"
                )
            )

        if not factors:
            factors.append(
                RiskFactor(
                    title="Routine Operational Exposure",
                    impact="+12 pts",
                    description="Minor observations and non-SIF maintenance activities recorded.",
                    category="baseline"
                )
            )

        # Dynamic Recommended Safety Actions
        actions: List[str] = list(zone_cfg["default_actions"])
        
        # Add specific action based on barrier failures
        all_barriers = [i.barrier_failure for i in incidents if i.barrier_failure]
        if all_barriers:
            top_barrier = Counter(all_barriers).most_common(1)[0][0]
            actions.insert(0, f"Prioritize immediate site audit on: {top_barrier.capitalize()}.")

        return (scaled, risk_level, trend, trend_delta, factors, actions[:4])

    def get_facility_overview(self, db: Session) -> FacilityRiskSummary:
        """
        Builds complete digital twin facility risk model combining persistent safety reports
        with any active demo simulated events.
        """
        # Fetch reports from DB
        db_reports = db.query(SafetyReport).all()
        
        zone_incidents_map: Dict[str, List[ZoneIncident]] = defaultdict(list)
        all_timeline: List[ZoneIncident] = []

        # 1. Process DB reports into ZoneIncidents
        for r in db_reports:
            zone_id = self.infer_zone_id(
                report_text=r.report_text,
                activity=r.activity,
                hazard=r.hazard,
                equipment=r.equipment,
                barrier_failure=r.barrier_failure,
                raw_location=r.location or r.site,
                raw_data=r.raw_data,
                deterministic_seed=r.id
            )
            zone_name = self._zone_lookup.get(zone_id, {}).get("name", "Facility Area")

            # Determine severity string
            if r.sif_potential == "SIF_POTENTIAL":
                severity = "CRITICAL"
            elif r.sif_potential == "UNCERTAIN":
                severity = "HIGH"
            elif r.barrier_failure:
                severity = "MODERATE"
            else:
                severity = "LOW"

            date_str = r.event_date.strftime("%Y-%m-%d %H:%M") if r.event_date else (
                r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M")
            )
            time_display = r.created_at.strftime("%H:%M") if r.created_at else "12:00"

            incident_obj = ZoneIncident(
                id=r.id,
                source_record_id=r.source_record_id or r.id,
                report_text=r.report_text,
                report_summary=r.report_summary or (r.report_text[:120] + "..." if len(r.report_text) > 120 else r.report_text),
                event_date=date_str,
                formatted_time=time_display,
                severity=severity,
                sif_potential=r.sif_potential,
                sif_score=r.sif_score,
                sif_confidence=r.sif_confidence,
                activity=r.activity,
                hazard=r.hazard,
                barrier_failure=r.barrier_failure,
                life_saving_rules=r.life_saving_rules,
                zone_id=zone_id,
                zone_name=zone_name,
                is_demo=False
            )
            zone_incidents_map[zone_id].append(incident_obj)
            all_timeline.append(incident_obj)

        # 2. Add in-memory active demo incidents (placed first for recency)
        for demo_inc in self._demo_incidents:
            zone_incidents_map[demo_inc.zone_id].insert(0, demo_inc)
            all_timeline.insert(0, demo_inc)

        # 3. Build FacilityZone models for all 7 zones
        zones: List[FacilityZone] = []
        high_risk_zones_count = 0
        total_active_incidents = 0
        total_critical_incidents = 0
        zone_scores: List[int] = []

        for zone_cfg in FACILITY_ZONES_CONFIG:
            z_id = zone_cfg["id"]
            z_incidents = zone_incidents_map.get(z_id, [])
            
            # Dominant dimensions
            activities = [i.activity for i in z_incidents if i.activity]
            hazards = [i.hazard for i in z_incidents if i.hazard]
            barriers = [i.barrier_failure for i in z_incidents if i.barrier_failure]
            
            dominant_act = Counter(activities).most_common(1)[0][0] if activities else None
            dominant_haz = Counter(hazards).most_common(1)[0][0] if hazards else None
            dominant_barr = Counter(barriers).most_common(1)[0][0] if barriers else None

            # LSR dominant
            lsr_names = []
            for inc in z_incidents:
                if inc.life_saving_rules and isinstance(inc.life_saving_rules, list):
                    for rule in inc.life_saving_rules:
                        r_name = rule.get("rule_name") if isinstance(rule, dict) else str(rule)
                        if r_name:
                            lsr_names.append(r_name)
            dominant_lsr = Counter(lsr_names).most_common(1)[0][0] if lsr_names else None

            # Calculate risk
            score, level, trend, trend_delta, factors, actions = self.calculate_zone_risk(z_id, z_incidents)
            
            crit_count = sum(1 for i in z_incidents if i.severity == "CRITICAL" or i.sif_potential == "SIF_POTENTIAL")
            active_count = len(z_incidents)

            if level in ["CRITICAL", "HIGH"]:
                high_risk_zones_count += 1

            total_active_incidents += active_count
            total_critical_incidents += crit_count
            zone_scores.append(score)

            has_recent_incident = any(i.is_demo for i in z_incidents) or (active_count > 0)

            zone_model = FacilityZone(
                id=z_id,
                name=zone_cfg["name"],
                code=zone_cfg["code"],
                description=zone_cfg["description"],
                risk_score=score,
                risk_level=level,
                total_incidents=len(z_incidents),
                active_incidents=active_count,
                critical_incidents=crit_count,
                recent_incident_state=has_recent_incident,
                risk_trend=trend,
                risk_trend_delta=trend_delta,
                risk_factors=factors,
                dominant_hazard=dominant_haz,
                dominant_activity=dominant_act,
                dominant_barrier_failure=dominant_barr,
                dominant_lsr=dominant_lsr,
                recommended_actions=actions,
                incidents=z_incidents,
                svg_center=zone_cfg["svg_center"]
            )
            zones.append(zone_model)

        # Sort zones by risk score descending
        zones.sort(key=lambda z: z.risk_score, reverse=True)

        # Calculate Overall Facility Risk Score
        if zone_scores:
            # Weighted mix: 50% max zone risk + 50% average zone risk
            max_score = max(zone_scores)
            avg_score = sum(zone_scores) / len(zone_scores)
            overall_score = int(round(max_score * 0.55 + avg_score * 0.45))
        else:
            overall_score = 15

        if overall_score >= 81:
            overall_level = "CRITICAL"
        elif overall_score >= 61:
            overall_level = "HIGH"
        elif overall_score >= 31:
            overall_level = "MODERATE"
        else:
            overall_level = "LOW"

        return FacilityRiskSummary(
            overall_risk_score=overall_score,
            risk_level=overall_level,
            total_incidents=len(all_timeline),
            active_incidents=total_active_incidents,
            critical_incidents=total_critical_incidents,
            high_risk_zones_count=high_risk_zones_count,
            zones=zones,
            recent_timeline=all_timeline[:30],
            last_updated=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        )

    def get_zone_details(self, db: Session, zone_id: str) -> Optional[FacilityZone]:
        summary = self.get_facility_overview(db)
        for z in summary.zones:
            if z.id == zone_id:
                return z
        return None

    def get_demo_scenarios(self) -> List[DemoScenario]:
        return DEMO_SCENARIO_CATALOG

    def simulate_demo_incident(
        self,
        db: Session,
        request: DemoSimulationRequest
    ) -> DemoSimulationResponse:
        """
        Executes end-to-end demo flow:
        1. Select/Construct incident text.
        2. Run NLP 10-dimension extraction.
        3. Run explainable SIF classifier & weak supervision.
        4. Run IOGP Life-Saving Rules alignment.
        5. Map to facility zone.
        6. Recalculate full facility digital twin risk.
        7. Return structured response with updated state.
        """
        scenario: Optional[DemoScenario] = None
        if request.scenario_id:
            for s in DEMO_SCENARIO_CATALOG:
                if s.id == request.scenario_id:
                    scenario = s
                    break

        if scenario:
            text = scenario.simulated_text
            target_zone = scenario.zone_id
            title = scenario.title
            default_sev = scenario.severity
        else:
            text = request.custom_text or "Pressure surge and flammable vapor leak observed during maintenance operations."
            target_zone = request.zone_id or self.infer_zone_id(text)
            title = request.custom_title or "Simulated Field Safety Precursor"
            default_sev = request.severity or "CRITICAL"

        # 1. Run live NLP extraction
        extraction = extraction_service.extract(text)

        # 2. Run live SIF classification
        sif_res = sif_classifier.predict(text, extraction)

        # 3. Run live LSR matcher
        lsr_matches = lsr_matcher.map_report(text)
        lsr_payload = [m.model_dump() for m in lsr_matches]

        # 4. Determine final zone
        final_zone_id = target_zone if target_zone in self._zone_lookup else self.infer_zone_id(
            report_text=text,
            activity=extraction.activity,
            hazard=extraction.hazard,
            equipment=extraction.equipment,
            barrier_failure=extraction.barrier_failure
        )
        zone_name = self._zone_lookup.get(final_zone_id, {}).get("name", "Facility Zone")

        # 5. Create new ZoneIncident
        now = datetime.datetime.now(datetime.timezone.utc)
        inc_id = f"demo_{uuid.uuid4().hex[:8]}"

        sev = "CRITICAL" if sif_res.classification == "SIF_POTENTIAL" else (
            "HIGH" if sif_res.classification == "UNCERTAIN" else default_sev
        )

        new_incident = ZoneIncident(
            id=inc_id,
            source_record_id=f"SIM-{now.strftime('%H%M%S')}",
            report_text=text,
            report_summary=title,
            event_date=now.strftime("%Y-%m-%d %H:%M:%S"),
            formatted_time=now.strftime("%H:%M:%S"),
            severity=sev,
            sif_potential=sif_res.classification,
            sif_score=sif_res.score,
            sif_confidence=sif_res.confidence,
            activity=extraction.activity or "Simulated Operational Task",
            hazard=extraction.hazard or "Hazardous Energy Accumulation",
            barrier_failure=extraction.barrier_failure or "Primary Containment Defect",
            life_saving_rules=lsr_payload,
            zone_id=final_zone_id,
            zone_name=zone_name,
            is_demo=True
        )

        # Prepend to demo incidents list (in-memory)
        self._demo_incidents.insert(0, new_incident)

        # Cap demo incidents to recent 15 to avoid infinite growth
        if len(self._demo_incidents) > 15:
            self._demo_incidents = self._demo_incidents[:15]

        # 6. Recalculate facility summary
        updated_summary = self.get_facility_overview(db)

        return DemoSimulationResponse(
            success=True,
            message=f"Simulated incident successfully classified and mapped to {zone_name}.",
            incident=new_incident,
            affected_zone_id=final_zone_id,
            affected_zone_name=zone_name,
            updated_facility_summary=updated_summary
        )

    def reset_demo_incidents(self, db: Session) -> FacilityRiskSummary:
        """
        Clears all in-memory demo incidents and returns restored facility summary.
        """
        self._demo_incidents.clear()
        return self.get_facility_overview(db)


facility_service = FacilityService()
