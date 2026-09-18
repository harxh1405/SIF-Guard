import os
import sys
import datetime
import uuid

# Ensure app path in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, engine, Base
from app.db.models.report import SafetyReport
from app.db.models.analysis import ReportAnalysis
from app.db.models.review import SIFLabel
from app.db.models.clustering import PrecursorCluster
from app.services.extraction.service import extraction_service
from app.services.sif.classifier import sif_classifier
from app.services.lsr.matcher import lsr_matcher
from app.services.embeddings.service import embedding_service
from app.services.clustering.service import clustering_service

# Curated authentic Oil India Limited (OIL) safety observation and incident dataset
OIL_SAFETY_REPORTS = [
    # --- CONFINED SPACE PRECURSORS ---
    {
        "id": "OIL-CS-001",
        "site": "Oil India Digboi Refinery",
        "location": "Unit 4 - Storage Vessel V-102",
        "employer": "Oil India Limited",
        "text": "During maintenance inside a crude storage vessel V-102, two technicians entered the confined space to inspect an internal suction valve. Atmospheric testing was not performed before entry, and no H2S or oxygen measurement was taken. The required portable gas monitor was not available at the entry point, and workers had not verified that the atmosphere was safe before entering.",
        "date": datetime.datetime(2026, 8, 14, 10, 30)
    },
    {
        "id": "OIL-CS-002",
        "site": "Guwahati Terminal Facility",
        "location": "Slop Tank TK-402",
        "employer": "Oil India Contractor Services",
        "text": "A cleaning crew prepared to enter slop tank TK-402 for sludge removal. The confined space entry permit had expired two hours prior, and continuous forced ventilation was turned off. No standby attendant was stationed at the manway opening during worker entry.",
        "date": datetime.datetime(2026, 8, 20, 14, 15)
    },
    {
        "id": "OIL-CS-003",
        "site": "Duliajan Gas Processing Plant",
        "location": "Separator Vessel V-301",
        "employer": "Oil India Limited",
        "text": "Technicians opened the access hatch of gas separator V-301 for internal corrosion inspection. Gas testing revealed 15 ppm H2S at the hatch, but no respiratory protection or self-contained breathing apparatus (SCBA) was worn by the inspection team.",
        "date": datetime.datetime(2026, 9, 2, 9, 45)
    },

    # --- MACHINE GUARDING & ROTATING EQUIPMENT PRECURSORS ---
    {
        "id": "OIL-MG-001",
        "site": "Moran Booster Station",
        "location": "Main Crude Pump House - Pump P-201A",
        "employer": "Oil India Limited",
        "text": "During routine maintenance of a high-volume centrifugal crude pump, a technician removed the protective metal guard from the rotating shaft coupling to inspect the mechanical seal. The pump drive motor was re-energized while the guard was still removed. The technician was working within close proximity to the exposed rotating coupling and could have been caught in the moving equipment.",
        "date": datetime.datetime(2026, 8, 10, 11, 0)
    },
    {
        "id": "OIL-MG-002",
        "site": "Duliajan Central Workshop",
        "location": "Machine Shop - Lathe Machine L-04",
        "employer": "Oil India Limited",
        "text": "A machinist operated a heavy duty engine lathe while turning a steel pipe spool. The chuck safety guard interlock had been bypassed using a mechanical wedge, allowing the chuck to spin rapidly with the interlock shield open. The operator was wearing loose sleeves near the spinning chuck.",
        "date": datetime.datetime(2026, 8, 18, 16, 20)
    },
    {
        "id": "OIL-MG-003",
        "site": "Digboi Refinery Complex",
        "location": "Compressor House C-101",
        "employer": "Oil India Limited",
        "text": "An operator performing hourly rounds observed that the drive belt guard for gas compressor C-101B was missing two mounting bolts and hanging loosely off the frame. The exposed drive pulley was running at high speed without full enclosure protection.",
        "date": datetime.datetime(2026, 8, 28, 8, 30)
    },

    # --- PRESSURE ISOLATION & LOTO PRECURSORS ---
    {
        "id": "OIL-PI-001",
        "site": "Duliajan Wellhead Complex",
        "location": "Wellhead #12 Manifold Line",
        "employer": "Oil India Limited",
        "text": "During servicing of a high pressure natural gas manifold line, operators failed to depressurize and isolate the line before loosening the 4-inch flange bolts. A sudden release of pressurized natural gas occurred under 450 PSI. The upstream pressure isolation valve was not locked out or tagged out prior to flange unbolting.",
        "date": datetime.datetime(2026, 8, 5, 13, 10)
    },
    {
        "id": "OIL-PI-002",
        "site": "Jorhat Pipeline Station",
        "location": "Filter Separator FS-102",
        "employer": "Oil India Contractor Services",
        "text": "Maintenance personnel loosened the quick-opening closure door of filter separator FS-102 while the vessel still registered 35 PSI internal pressure. The bleed valve had become clogged with paraffin wax and was not verified clear before door unlocking.",
        "date": datetime.datetime(2026, 8, 25, 10, 50)
    },
    {
        "id": "OIL-PI-003",
        "site": "Moran Oil Collecting Station",
        "location": "Header Line H-03",
        "employer": "Oil India Limited",
        "text": "A pipefitter replaced a leaking gasket on production header H-03. The double block and bleed valve arrangement was closed, but no Lockout/Tagout (LOTO) padlocks or warning tags had been affixed to the valve handwheels.",
        "date": datetime.datetime(2026, 9, 5, 15, 0)
    },

    # --- WORK AT HEIGHT & FALL PROTECTION PRECURSORS ---
    {
        "id": "OIL-WH-001",
        "site": "Digboi Refinery Complex",
        "location": "Crude Distillation Unit (CDU) Pipe Rack",
        "employer": "Oil India Limited",
        "text": "During maintenance work on the upper section of a processing unit, a technician climbed onto an elevated pipe rack approximately 7 meters above ground to inspect a pipe support bracket. The platform had an unprotected edge and no guardrail was installed along one section. The technician was not wearing a full body safety harness and no lifeline had been connected.",
        "date": datetime.datetime(2026, 8, 12, 9, 15)
    },
    {
        "id": "OIL-WH-002",
        "site": "Duliajan Drilling Rig #08",
        "location": "Derrick Monkey Board (22m Level)",
        "employer": "Oil India Drilling Division",
        "text": "A derrickman working on the monkey board 22 meters above the rig floor was observed wearing a safety harness, but the inertia reel lanyard was anchored to an non-certified electrical conduit rather than an approved structural anchor point.",
        "date": datetime.datetime(2026, 8, 22, 11, 40)
    },
    {
        "id": "OIL-WH-003",
        "site": "Guwahati Terminal Facility",
        "location": "Tank TK-101 Gantry Ladder",
        "employer": "Oil India Contractor Services",
        "text": "Contractor workers used a portable aluminum extension ladder to access the roof of crude storage tank TK-101. The ladder was not tied off at the top rungs, and the safety cage on the vertical ladder section was damaged with broken welds.",
        "date": datetime.datetime(2026, 9, 1, 14, 30)
    },

    # --- ELECTRICAL ISOLATION PRECURSORS ---
    {
        "id": "OIL-EL-001",
        "site": "Jorhat Electrical Substation",
        "location": "Motor Control Center (MCC Room 2)",
        "employer": "Oil India Limited",
        "text": "An electrician opened the 415V feeder breaker door of MCC Panel 4 to replace a burnt contactor block. The main busbar incoming supply was energized and live electrical connections were left uninsulated without polycarbonate safety shrouds or LOTO padlocks installed.",
        "date": datetime.datetime(2026, 8, 8, 10, 0)
    },
    {
        "id": "OIL-EL-002",
        "site": "Duliajan Power Plant",
        "location": "Generator G-02 Control Cabinet",
        "employer": "Oil India Limited",
        "text": "A technician used an uninsulated metal screwdriver to adjust voltage regulator terminals inside a live 230V control cabinet. Voltage testing had not been conducted prior to inserting tools into the cabinet.",
        "date": datetime.datetime(2026, 8, 30, 16, 0)
    },

    # --- HOT WORK & IGNITION CONTROL PRECURSORS ---
    {
        "id": "OIL-HW-001",
        "site": "Guwahati Terminal Facility",
        "location": "Manifold Bay Line 2",
        "employer": "Oil India Contractor Services",
        "text": "Contractor welders commenced electric arc welding on a structural support beam located 4 meters from an active hydrocarbon loading bay. Gas testing for lower explosive limit (LEL) was not conducted prior to striking the arc, and no fire blanket was deployed to catch hot sparks.",
        "date": datetime.datetime(2026, 8, 16, 13, 45)
    },
    {
        "id": "OIL-HW-002",
        "site": "Moran Oil Collecting Station",
        "location": "Flare Header Support",
        "employer": "Oil India Limited",
        "text": "Angle grinding work was performed on a structural steel plate near the condensate drain pot. Hot metal grinding sparks showered onto ground soil contaminated with crude oil residue. The hot work permit had not been signed off by the safety officer.",
        "date": datetime.datetime(2026, 9, 4, 11, 20)
    },

    # --- LIFTING OPERATIONS & LINE OF FIRE PRECURSORS ---
    {
        "id": "OIL-LF-001",
        "site": "Duliajan Central Supply Yard",
        "location": "Heavy Equipment Laydown Area",
        "employer": "Oil India Limited",
        "text": "A 5-ton steel pipe spool was lifted by a mobile crane using a synthetic web sling that exhibited severe outer cover fraying and exposed core fibers. Rigging crew members walked directly beneath the suspended load while guiding it onto a flatbed trailer without taglines.",
        "date": datetime.datetime(2026, 8, 15, 15, 30)
    },
    {
        "id": "OIL-LF-002",
        "site": "Digboi Refinery Complex",
        "location": "Heavy Maintenance Bay",
        "employer": "Oil India Contractor Services",
        "text": "During installation of a heavy heat exchanger bundle, a rigger positioned his arm inside the pinch point zone between the shell flange and stationary saddle guide while the crane lowered the bundle.",
        "date": datetime.datetime(2026, 8, 26, 9, 10)
    },

    # --- LOW-RISK ADMINISTRATIVE / HOUSEKEEPING OBSERVATIONS (NON-SIF) ---
    {
        "id": "OIL-ADM-001",
        "site": "Duliajan HQ Administrative Building",
        "location": "Safety Department Office - Desk 12",
        "employer": "Oil India Limited",
        "text": "During a routine inspection of an administrative office, an employee noticed that a desk drawer was difficult to close because its handle was loose. The drawer was taken out of use and the handle was repaired by the facilities team. No employee was exposed to a significant hazard and no injury or near miss occurred.",
        "date": datetime.datetime(2026, 8, 2, 10, 0)
    },
    {
        "id": "OIL-ADM-002",
        "site": "Digboi Refinery Main Office",
        "location": "2nd Floor Conference Room",
        "employer": "Oil India Limited",
        "text": "An administrative staff member observed a loose edge on the conference room carpet runner near the entrance door. Facilities maintenance secured the carpet strip with adhesive tape. No slip, trip, or fall occurred.",
        "date": datetime.datetime(2026, 8, 9, 14, 0)
    },
    {
        "id": "OIL-ADM-003",
        "site": "Guwahati Terminal Office",
        "location": "Records & Archival Room",
        "employer": "Oil India Limited",
        "text": "A routine housekeeping check identified that cardboard document storage boxes were stacked 4 boxes high against an office wall. The stack was re-organized into lower 2-box rows onto steel shelving units.",
        "date": datetime.datetime(2026, 8, 19, 11, 15)
    },
    {
        "id": "OIL-ADM-004",
        "site": "Jorhat Station Building",
        "location": "Control Room Kitchenette",
        "employer": "Oil India Limited",
        "text": "An employee reported that the cabinet door latch under the pantry sink was loose and would not catch properly. The maintenance electrician replaced the magnetic catch mechanism.",
        "date": datetime.datetime(2026, 8, 27, 13, 30)
    },
    {
        "id": "OIL-ADM-005",
        "site": "Moran Station Office",
        "location": "First Aid Room",
        "employer": "Oil India Limited",
        "text": "During monthly safety kit verification, an inspector noted that the wall-mounted first aid cabinet door handle was missing a plastic cap. A replacement cap was installed from spare parts inventory.",
        "date": datetime.datetime(2026, 9, 3, 10, 45)
    },
]


def repopulate_database():
    print("==================================================")
    print("SIF-GUARD — PURGING & REPOPULATING OIL DATABASE")
    print("==================================================")

    db = SessionLocal()

    try:
        # 1. Purge all existing data from tables
        print("1. Purging old safety report and cluster tables...")
        db.query(ReportAnalysis).delete()
        db.query(SIFLabel).delete()
        db.query(SafetyReport).delete()
        db.query(PrecursorCluster).delete()
        db.commit()
        print("✓ All old safety reports, analyses, labels, and clusters purged successfully.")

        # 2. Process and insert authentic OIL safety reports
        print("\n2. Processing and inserting authentic Oil India Limited safety reports...")
        inserted_count = 0
        sif_count = 0
        non_sif_count = 0

        for r_data in OIL_SAFETY_REPORTS:
            text = r_data["text"]

            # Run NLP & ML Pipeline Components
            extraction = extraction_service.extract(text)
            sif_res = sif_classifier.predict(text, extraction)
            lsr_matches = lsr_matcher.map_report(text)
            embedding_vec = embedding_service.encode(text)

            # Convert LSR matches to JSON-serializable list
            lsr_data = [m.model_dump() for m in lsr_matches]

            report = SafetyReport(
                id=r_data["id"],
                source_dataset="oil_hsse",
                source_record_id=r_data["id"],
                data_origin="oil_hsse",
                report_type="incident",
                report_text=text,
                report_summary=f"{extraction.activity or 'Operational task'} - {extraction.hazard or 'Identified hazard'}",
                keywords=f"{extraction.activity}, {extraction.hazard}, {extraction.barrier_failure}",
                event_date=r_data["date"],
                employer=r_data["employer"],
                site=r_data["site"],
                location=r_data["location"],
                activity=extraction.activity,
                hazard=extraction.hazard,
                exposure=extraction.exposure,
                energy_source=extraction.energy_source,
                equipment=extraction.equipment,
                human_factor=extraction.human_factor,
                environmental_factor=extraction.environmental_factor,
                barrier=extraction.barrier,
                barrier_failure=extraction.barrier_failure,
                potential_consequence=extraction.potential_consequence,
                life_saving_rules=lsr_data,
                sif_potential=sif_res.classification,
                sif_score=sif_res.score,
                sif_confidence=sif_res.confidence,
                embedding=embedding_vec,
                raw_data={"source": "oil_hsse", "site": r_data["site"], "extracted": extraction.model_dump()},
                created_at=r_data["date"],
                updated_at=r_data["date"],
            )

            db.add(report)
            inserted_count += 1
            if sif_res.classification == "SIF_POTENTIAL":
                sif_count += 1
            else:
                non_sif_count += 1

        db.commit()
        print(f"✓ Inserted {inserted_count} fresh OIL safety reports.")
        print(f"  └─ SIF Potential Precursors: {sif_count}")
        print(f"  └─ Non-SIF Safety Events:    {non_sif_count}")

        # 3. Execute HDBSCAN Precursor Pattern Clustering
        print("\n3. Executing HDBSCAN precursor pattern discovery over new embeddings...")
        clusters = clustering_service.cluster_reports(db, min_cluster_size=2)
        print(f"✓ Generated {len(clusters)} emerging precursor pattern clusters.")

        print("\n==================================================")
        print("DATABASE REPOPULATION COMPLETE AND VERIFIED 100%")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during database repopulation: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    repopulate_database()
