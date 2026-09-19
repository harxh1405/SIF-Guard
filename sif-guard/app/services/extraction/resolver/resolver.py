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

        # 2. Integrate Transformer Evidence with Documented Priority Strategy:
        # - Barriers & Barrier Failures: Domain Rules take priority due to context & negation integrity.
        # - If Rule barrier is absent, Transformer BARRIER is used.
        # - If both agree on canonical barrier, merge into a single provenance item with source="transformer+rule".
        # - Equipment, Activity, Hazard: Rules provide base; Transformer enriches when missing.
        rule_barrier_canonical = canonicalize_barrier(barrier) if barrier else None

        for te in transformer_entities:
            # If transformer detected an entity that enriches rule extraction
            if te.label == "ACTIVITY" and not activity:
                activity = te.text
            elif te.label in ("EQUIPMENT", "ORG") and not equipment:
                equipment = te.text
            elif te.label == "HAZARD" and not hazard:
                hazard = te.text
            elif te.label == "BARRIER" and not barrier:
                barrier = te.text

            # Check canonical agreement on barrier
            if te.label == "BARRIER" and rule_barrier_canonical:
                trans_barrier_canonical = canonicalize_barrier(te.text)
                if trans_barrier_canonical == rule_barrier_canonical:
                    # Merge provenance: mark the existing rule evidence as transformer+rule
                    for pe in provenance_list:
                        if pe.label == "BARRIER":
                            pe.source = "transformer+rule"
                    continue  # Deduplicated / merged

            # Check canonical agreement on barrier_failure
            if te.label == "BARRIER_FAILURE" and barrier_failure:
                if te.text.lower() in barrier_failure.lower() or barrier_failure.lower() in te.text.lower():
                    for pe in provenance_list:
                        if pe.label == "BARRIER_FAILURE":
                            pe.source = "transformer+rule"
                    continue

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

        all_barrs = rule_results.get("all_barriers", [])
        if canonical_barrier and canonical_barrier not in all_barrs:
            all_barrs = [canonical_barrier] + all_barrs

        return TupleExtractionResult(
            schema=schema,
            provenance=provenance_list,
            all_barriers=all_barrs if all_barrs else ([canonical_barrier] if canonical_barrier else []),
            all_failures=rule_results.get("all_failures", [barrier_failure] if barrier_failure else [])
        )


entity_resolver = EntityResolver()
