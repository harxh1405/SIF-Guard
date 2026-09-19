import pytest
from app.services.extraction.service import extraction_service


def test_gap1_hazardous_substance_nlp_extraction():
    """Gap #1: Real NLP extraction tests for hazardous substances."""
    # A. H2S
    t_a = "H2S was detected near the vessel entry."
    ext_a = extraction_service.extract(t_a)
    assert ext_a.hazardous_substance is not None
    assert any(k in ext_a.hazardous_substance.lower() for k in ["h2s", "hydrogen sulfide"])

    # B. Hydrochloric acid
    t_b = "Workers handled hydrochloric acid during the transfer operation."
    ext_b = extraction_service.extract(t_b)
    assert ext_b.hazardous_substance is not None
    assert "acid" in ext_b.hazardous_substance.lower()

    # C. Benzene
    t_c = "Benzene vapour was detected in the process area."
    ext_c = extraction_service.extract(t_c)
    assert ext_c.hazardous_substance is not None
    assert "benzene" in ext_c.hazardous_substance.lower()

    # D. Nitrogen
    t_d = "Nitrogen was released into the enclosed area."
    ext_d = extraction_service.extract(t_d)
    assert ext_d.hazardous_substance is not None
    assert "nitrogen" in ext_d.hazardous_substance.lower()

    # E. Crude oil
    t_e = "Crude oil leaked from the pipeline."
    ext_e = extraction_service.extract(t_e)
    assert ext_e.hazardous_substance is not None
    assert "crude oil" in ext_e.hazardous_substance.lower()

    # F. Negative control: Generic words must not fabricate substances
    t_f = "The technician inspected the pump."
    ext_f = extraction_service.extract(t_f)
    assert ext_f.hazardous_substance is None


def test_gap2_equipment_nlp_extraction():
    """Gap #2: Equipment extraction from raw narrative text."""
    # A. Centrifugal pump
    ext_a = extraction_service.extract("The technician inspected a centrifugal pump.")
    assert ext_a.equipment is not None
    assert "pump" in ext_a.equipment.lower()

    # B. Crane
    ext_b = extraction_service.extract("The crane lifted the process valve.")
    assert ext_b.equipment is not None
    assert "crane" in ext_b.equipment.lower()

    # C. Storage tank / vessel
    ext_c = extraction_service.extract("Workers entered the storage tank.")
    assert ext_c.equipment is not None
    assert any(k in ext_c.equipment.lower() for k in ["tank", "vessel"])

    # D. Forklift
    ext_d = extraction_service.extract("The forklift reversed through the loading area.")
    assert ext_d.equipment is not None
    assert "forklift" in ext_d.equipment.lower()

    # E. Electrical panel
    ext_e = extraction_service.extract("The electrician opened the electrical distribution panel.")
    assert ext_e.equipment is not None
    assert "panel" in ext_e.equipment.lower()

    # F. Compressor
    ext_f = extraction_service.extract("The technician inspected compressor C-301.")
    assert ext_f.equipment is not None
    assert "compressor" in ext_f.equipment.lower()


def test_gap11_compressor_false_positive_discrimination():
    """Gap #11: Compressor alone must not produce fire/explosion hazard."""
    # CASE A: Routine maintenance on compressor -> no fire/explosion
    text_a = "The technician performed routine maintenance on compressor C-301."
    ext_a = extraction_service.extract(text_a)
    assert ext_a.activity == "machinery maintenance"
    assert ext_a.equipment == "compressor"
    # Must NOT automatically produce fire / explosion
    if ext_a.hazard:
        assert "fire" not in ext_a.hazard.lower()
        assert "explosion" not in ext_a.hazard.lower()
        assert "flammable" not in ext_a.hazard.lower()

    # CASE B: Compressor with actual textual evidence of flammable vapour
    text_b = "The technician performed maintenance on compressor C-301 while flammable vapour was present around the work area."
    ext_b = extraction_service.extract(text_b)
    assert ext_b.equipment == "compressor"
    assert ext_b.hazard is not None
    assert any(k in ext_b.hazard.lower() for k in ["flammable", "fire", "explosion", "atmosphere"])


def test_gap3_human_factor_positive_extraction():
    """Gap #3: Positive extraction of human factors from narrative evidence."""
    # A. Procedure bypass
    ext_a = extraction_service.extract("The operator bypassed the required safety procedure.")
    assert ext_a.human_factor is not None
    assert "bypass" in ext_a.human_factor.lower() or "non-compliance" in ext_a.human_factor.lower()

    # B. Failure to verify
    ext_b = extraction_service.extract("The technician failed to verify zero energy before opening the line.")
    assert ext_b.human_factor is not None
    assert "verify" in ext_b.human_factor.lower()

    # C. Unauthorized entry
    ext_c = extraction_service.extract("The worker entered the restricted area without authorization.")
    assert ext_c.human_factor is not None
    assert "unauthorized" in ext_c.human_factor.lower()

    # D. Distraction
    ext_d = extraction_service.extract("The operator was distracted by a phone call while reversing.")
    assert ext_d.human_factor is not None
    assert "distract" in ext_d.human_factor.lower()

    # E. Procedure non-compliance
    ext_e = extraction_service.extract("The employee ignored the required permit process.")
    assert ext_e.human_factor is not None
    assert "non-compliance" in ext_e.human_factor.lower()

    # Negative control: No unsafe human action identified
    ext_neg = extraction_service.extract("No unsafe human action was identified.")
    assert ext_neg.human_factor is None


def test_gap4_environmental_factor_extraction():
    """Gap #4: Environmental factor extraction from textual evidence."""
    # A. Wind
    ext_a = extraction_service.extract("Strong wind caused the suspended load to swing.")
    assert ext_a.environmental_factor is not None
    assert "wind" in ext_a.environmental_factor.lower()

    # B. Rain / Water ingress
    ext_b = extraction_service.extract("Heavy rain caused water to accumulate in the excavation.")
    assert ext_b.environmental_factor is not None
    assert "rain" in ext_b.environmental_factor.lower() or "water" in ext_b.environmental_factor.lower()

    # C. Poor ventilation
    ext_c = extraction_service.extract("The confined space had poor ventilation.")
    assert ext_c.environmental_factor is not None
    assert "ventilation" in ext_c.environmental_factor.lower()

    # D. Wet / Slippery surface
    ext_d = extraction_service.extract("Water on the floor created a slippery surface.")
    assert ext_d.environmental_factor is not None
    assert any(k in ext_d.environmental_factor.lower() for k in ["slippery", "wet"])

    # E. Negative control: Normal dry conditions
    ext_e = extraction_service.extract("The inspection was performed during normal dry conditions.")
    assert ext_e.environmental_factor is None


def test_gap10_inside_vs_outside_line_of_fire():
    """Gap #10: Direct lexical contrast between inside and outside line of fire."""
    text_safe = "All workers remained outside the line of fire during the lifting operation."
    text_unsafe = "Workers entered the line of fire during the lifting operation."

    ext_safe = extraction_service.extract(text_safe)
    ext_unsafe = extraction_service.extract(text_unsafe)

    # Safe narrative MUST NOT return active line of fire exposure
    assert ext_safe.exposure == "controlled" or ext_safe.exposure is None
    assert ext_safe.exposure != "line of fire"

    # Unsafe narrative must capture line of fire
    assert ext_unsafe.exposure == "line of fire"

    # Additional negative variations
    ext_not = extraction_service.extract("The workers were not in the line of fire.")
    assert ext_not.exposure != "line of fire"

    ext_clear = extraction_service.extract("The workers were kept clear of the suspended load.")
    assert ext_clear.exposure == "controlled" or ext_clear.exposure is None


def test_gap12_energy_source_coverage():
    """Gap #12: Semantic coverage for specific missing energy source categories."""
    # Electrical
    ext_elec = extraction_service.extract("The electrical supply remained energized.")
    assert ext_elec.energy_source is not None
    assert "electrical" in ext_elec.energy_source.lower()

    # Mechanical
    ext_mech = extraction_service.extract("The rotating shaft contained stored mechanical energy.")
    assert ext_mech.energy_source is not None
    assert "mechanical" in ext_mech.energy_source.lower()

    # Gravitational
    ext_grav = extraction_service.extract("The suspended valve could fall under gravity.")
    assert ext_grav.energy_source is not None
    assert "gravitational" in ext_grav.energy_source.lower()

    # Thermal
    ext_therm = extraction_service.extract("The welding operation generated significant thermal energy.")
    assert ext_therm.energy_source is not None
    assert "thermal" in ext_therm.energy_source.lower()

    # Chemical
    ext_chem = extraction_service.extract("Concentrated acid was released from the transfer hose.")
    assert ext_chem.energy_source is not None
    assert "chemical" in ext_chem.energy_source.lower()

    # Generic hazardous energy
    ext_gen = extraction_service.extract("The team isolated all hazardous energy sources and verified zero energy.")
    assert ext_gen.energy_source is not None
    assert "hazardous energy" in ext_gen.energy_source.lower() or "unspecified" in ext_gen.energy_source.lower()


def test_gap13_exposure_gaps():
    """Gap #13: Missing exposure categories."""
    # A. Inhalation / toxic atmosphere
    ext_inhale = extraction_service.extract("The technician inhaled H2S while working inside the vessel.")
    assert ext_inhale.exposure is not None
    assert any(k in ext_inhale.exposure.lower() for k in ["inhalation", "toxic atmosphere", "toxic gas"])

    # B. Radiant heat / thermal exposure
    ext_heat = extraction_service.extract("The worker was exposed to intense radiant heat from the hot-work operation.")
    assert ext_heat.exposure is not None
    assert any(k in ext_heat.exposure.lower() for k in ["radiant heat", "thermal"])


def test_gap14_potential_consequence_gaps():
    """Gap #14: Missing potential consequence categories."""
    # A. Drowning
    ext_drown = extraction_service.extract("The worker could have been swept into the water and drowned.")
    assert ext_drown.potential_consequence is not None
    assert "drown" in ext_drown.potential_consequence.lower()

    # B. Structural collapse
    ext_struct = extraction_service.extract("The unsupported structure could have collapsed onto the workers.")
    assert ext_struct.potential_consequence is not None
    assert "collapse" in ext_struct.potential_consequence.lower() or "crush" in ext_struct.potential_consequence.lower()

    # C. Corrosive chemical burns
    ext_acid = extraction_service.extract("Acid could have splashed onto the operator's face and caused severe corrosive burns.")
    assert ext_acid.potential_consequence is not None
    assert "corrosive" in ext_acid.potential_consequence.lower() or "burn" in ext_acid.potential_consequence.lower()
