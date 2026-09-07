import re
from typing import Dict, Any, Optional
from app.schemas.analysis import ExtractionSchema


class RuleBasedExtractor:
    """
    Domain-aware extractor for safety incident narratives.
    Identifies activity, hazard, exposure, energy source, equipment, human/environmental factors,
    barriers, barrier failures, and potential consequences.
    """

    def extract(self, text: str, report_metadata: Optional[Dict[str, Any]] = None) -> ExtractionSchema:
        if not text:
            return ExtractionSchema()

        t_lower = text.lower()

        # 1. Activity / Task
        activity = None
        if report_metadata and report_metadata.get("task_assigned"):
            activity = str(report_metadata["task_assigned"])
        elif "confined space" in t_lower or "vessel" in t_lower or "tank" in t_lower:
            activity = "confined space entry"
        elif "suspended load" in t_lower or "crane" in t_lower or "lifting" in t_lower or "rigging" in t_lower:
            activity = "lifting operation"
        elif "roof" in t_lower or "ladder" in t_lower or "scaffold" in t_lower or "feet" in t_lower or "height" in t_lower:
            activity = "work at height"
        elif "welding" in t_lower or "cutting" in t_lower or "grinding" in t_lower or "torch" in t_lower:
            activity = "hot work"
        elif "electrical" in t_lower or "wiring" in t_lower or "breaker" in t_lower:
            activity = "electrical work"

        # 2. Hazard
        hazard = None
        if "h2s" in t_lower or "toxic" in t_lower or "poisonous" in t_lower or "gas" in t_lower:
            hazard = "toxic gas / hazardous atmosphere"
        elif "suspended load" in t_lower or "overhead load" in t_lower or "falling object" in t_lower:
            hazard = "suspended load / struck-by"
        elif "fall" in t_lower or "elevation" in t_lower or "height" in t_lower:
            hazard = "fall from height"
        elif "pressur" in t_lower or "explosion" in t_lower or "flammab" in t_lower:
            hazard = "fire / explosion / pressure release"
        elif "pinch" in t_lower or "caught in" in t_lower or "rotating" in t_lower:
            hazard = "rotating equipment / pinch point"
        elif "chair" in t_lower or "desk" in t_lower or "office" in t_lower:
            hazard = "ergonomic / minor office hazard"

        # 3. Hazardous Substance
        hazsub = None
        if report_metadata and report_metadata.get("hazardous_substance"):
            hazsub = str(report_metadata["hazardous_substance"])
        elif "h2s" in t_lower:
            hazsub = "Hydrogen Sulfide (H2S)"
        elif "chemical" in t_lower or "acid" in t_lower or "solvent" in t_lower:
            hazsub = "hazardous chemical"

        # 4. Exposure
        exposure = None
        if "without atmospheric testing" in t_lower or "entered vessel" in t_lower or "toxic gas" in t_lower:
            exposure = "worker exposed to toxic gas / oxygen deficiency"
        elif "underneath" in t_lower or "line of fire" in t_lower or "suspended load" in t_lower:
            exposure = "worker in line of fire under suspended load"
        elif "without fall protection" in t_lower or "unprotected edge" in t_lower:
            exposure = "worker exposed to unprotected fall hazard"
        elif "office" in t_lower or "chair" in t_lower:
            exposure = "minimal hazard exposure"

        # 5. Energy Source
        energy_source = None
        if "h2s" in t_lower or "gas" in t_lower:
            energy_source = "chemical / toxic gas energy"
        elif "gravity" in t_lower or "fall" in t_lower or "suspended" in t_lower or "height" in t_lower:
            energy_source = "potential kinetic / gravitational energy"
        elif "electrical" in t_lower or "voltage" in t_lower:
            energy_source = "electrical energy"
        elif "hydraulic" in t_lower or "pneumatic" in t_lower or "pressure" in t_lower:
            energy_source = "pressurized fluid / gas energy"

        # 6. Equipment
        equipment = None
        if "crane" in t_lower or "hoist" in t_lower or "rigging" in t_lower:
            equipment = "crane / lifting equipment"
        elif "vessel" in t_lower or "tank" in t_lower or "pipe" in t_lower:
            equipment = "vessel / container"
        elif "scaffold" in t_lower or "ladder" in t_lower:
            equipment = "scaffold / ladder"
        elif "press" in t_lower or "drill" in t_lower or "saw" in t_lower:
            equipment = "power press / drill machinery"
        elif "chair" in t_lower:
            equipment = "office furniture"

        # 7. Human & Environmental Factors
        human_factor = None
        if report_metadata and report_metadata.get("human_factor"):
            human_factor = str(report_metadata["human_factor"])
        elif "procedure" in t_lower or "bypassed" in t_lower or "ignored" in t_lower or "distraction" in t_lower or "backwards" in t_lower:
            human_factor = "inappropriate positioning / procedure non-compliance"

        env_factor = None
        if report_metadata and report_metadata.get("environmental_factor"):
            env_factor = str(report_metadata["environmental_factor"])
        elif "confined" in t_lower or "poor ventilation" in t_lower:
            env_factor = "confined space atmosphere"
        elif "wet" in t_lower or "slippery" in t_lower or "wind" in t_lower:
            env_factor = "adverse environmental condition"

        # 8. Barrier & Barrier Failure
        barrier = None
        barrier_failure = None

        if "atmospheric testing" in t_lower or "gas testing" in t_lower or "gas monitor" in t_lower:
            barrier = "atmospheric testing"
            if "without" in t_lower or "not performed" in t_lower or "failed" in t_lower or "missing" in t_lower:
                barrier_failure = "atmospheric testing missing or not performed"
        elif "fall protection" in t_lower or "harness" in t_lower or "guardrail" in t_lower or "lanyard" in t_lower:
            barrier = "fall protection system"
            if "without" in t_lower or "missing" in t_lower or "not tied off" in t_lower or "unprotected" in t_lower:
                barrier_failure = "fall protection missing or not used"
        elif "loto" in t_lower or "lockout" in t_lower or "isolation" in t_lower:
            barrier = "energy isolation (LOTO)"
            if "without" in t_lower or "not locked" in t_lower or "bypassed" in t_lower:
                barrier_failure = "energy isolation bypassed or missing"
        elif "exclusion zone" in t_lower or "barricade" in t_lower or "underneath" in t_lower:
            barrier = "exclusion zone / barricading"
            if "underneath" in t_lower or "bypassed" in t_lower or "entered" in t_lower:
                barrier_failure = "exclusion zone breached or missing"

        # 9. Potential Consequence
        potential_consequence = None
        if "h2s" in t_lower or "toxic" in t_lower:
            potential_consequence = "fatal asphyxiation / acute toxicity poisoning"
        elif "suspended load" in t_lower or "crushed" in t_lower:
            potential_consequence = "fatal crush / severe blunt force trauma"
        elif "height" in t_lower or "fall" in t_lower:
            potential_consequence = "fatal fall from elevation"
        elif "explosion" in t_lower or "fire" in t_lower:
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
