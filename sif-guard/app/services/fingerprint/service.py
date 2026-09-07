from typing import List
from app.schemas.analysis import ExtractionSchema, LSRMatchSchema, FingerprintSchema


class FingerprintService:

    def generate_fingerprint(
        self,
        extraction: ExtractionSchema,
        lsr_matches: List[LSRMatchSchema]
    ) -> FingerprintSchema:
        
        lsr_names = [m.rule_name for m in lsr_matches]

        return FingerprintSchema(
            activity=extraction.activity,
            hazard=extraction.hazard,
            hazardous_substance=extraction.hazardous_substance,
            exposure=extraction.exposure,
            energy_source=extraction.energy_source,
            barrier=extraction.barrier,
            barrier_failure=extraction.barrier_failure,
            human_factor=extraction.human_factor,
            environmental_factor=extraction.environmental_factor,
            potential_consequence=extraction.potential_consequence,
            life_saving_rules=lsr_names
        )


fingerprint_service = FingerprintService()
