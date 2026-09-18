from __future__ import annotations
from typing import List, Dict, Any, Optional
from app.schemas.analysis import ExtractionSchema
from app.services.extraction.provenance import EntityEvidence
from app.services.extraction.resolver.taxonomy import canonicalize_barrier, canonicalize_activity


class TupleExtractionResult:
    def __init__(
        self,
        schema: ExtractionSchema,
        provenance: List[EntityEvidence],
        all_barriers: List[str],
        all_failures: List[str]
    ):
        self.schema = schema
        self.provenance = provenance
        self.all_barriers = all_barriers
        self.all_failures = all_failures


class EntityResolver:
    """
    Resolves, canonicalizes, and deduplicates entities extracted by Transformer NER
    and Domain Safety Rules, building the standard ExtractionSchema.
    """

    def resolve(
        self,
        transformer_entities: List[EntityEvidence],
        rule_results: Dict[str, Any]
    ) -> TupleExtractionResult:
        # 1. Base from deterministic rules
        activity = rule_results.get("activity")
        hazard = rule_results.get("hazard")
        barrier = rule_results.get("barrier")
        barrier_failure = rule_results.get("barrier_failure")
        exposure = rule_results.get("exposure")
        energy_source = rule_results.get("energy_source")
        consequence = rule_results.get("potential_consequence")
        equipment = rule_results.get("equipment")

        provenance_list: List[EntityEvidence] = []

        # Record rule evidence
        if barrier:
            provenance_list.append(EntityEvidence(
                text=barrier,
                label="BARRIER",
                start=0,
                end=len(barrier),
                confidence=1.0,
                source="rule"
            ))
        if barrier_failure:
            provenance_list.append(EntityEvidence(
                text=barrier_failure,
                label="BARRIER_FAILURE",
                start=0,
                end=len(barrier_failure),
                confidence=1.0,
                source="rule"
            ))

        # 2. Integrate Transformer Evidence
        for te in transformer_entities:
            # If transformer detected an entity that agrees with or enriches rule extraction
            if te.label == "ACTIVITY" and not activity:
                activity = te.text
            elif te.label in ("EQUIPMENT", "ORG") and not equipment:
                equipment = te.text
            elif te.label == "HAZARD" and not hazard:
                hazard = te.text

            # Mark dual provenance if both identified the same dimension
            if te.label == "BARRIER" and barrier and te.text.lower() in barrier.lower():
                te.source = "transformer+rule"
            elif te.label == "BARRIER_FAILURE" and barrier_failure and te.text.lower() in barrier_failure.lower():
                te.source = "transformer+rule"

            provenance_list.append(te)

        # 3. Canonicalize
        canonical_activity = canonicalize_activity(activity)
        canonical_barrier = canonicalize_barrier(barrier)

        schema = ExtractionSchema(
            activity=canonical_activity,
            hazard=hazard,
            hazardous_substance=rule_results.get("hazardous_substance"),
            exposure=exposure,
            energy_source=energy_source,
            equipment=equipment,
            human_factor=rule_results.get("human_factor"),
            environmental_factor=rule_results.get("environmental_factor"),
            barrier=canonical_barrier,
            barrier_failure=barrier_failure,
            potential_consequence=consequence
        )

        return TupleExtractionResult(
            schema=schema,
            provenance=provenance_list,
            all_barriers=rule_results.get("all_barriers", [canonical_barrier] if canonical_barrier else []),
            all_failures=rule_results.get("all_failures", [barrier_failure] if barrier_failure else [])
        )


entity_resolver = EntityResolver()
