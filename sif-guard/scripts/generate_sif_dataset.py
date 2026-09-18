import os
import random
import uuid
import pandas as pd
from sklearn.model_selection import train_test_split

# Random seed for reproducibility
random.seed(42)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
os.makedirs(DATA_DIR, exist_ok=True)

HIGH_RISK_PATTERNS = [
    {
        "activity": "pressurized system maintenance",
        "hazard": "pressure release / energy isolation",
        "hazardous_substance": "unknown",
        "exposure": "worker exposed to energized machinery / unverified LOTO",
        "energy_source": "electrical energy",
        "equipment": "centrifugal pump",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "unknown",
        "barrier": "energy isolation (LOTO)",
        "barrier_failure": "energy isolation bypassed, missing, or not verified",
        "potential_consequence": "severe / fatal electrical shock or caught-in injury",
        "sif_potential": 1,
        "sif_reason": "centrifugal pump maintenance started without LOTO or electrical isolation",
        "safe_barrier": "energy isolation (LOTO) & breaker locked out",
        "safe_barrier_failure": "none",
        "safe_exposure": "equipment isolated and LOTO verified before maintenance"
    },
    {
        "activity": "pressurized system maintenance",
        "hazard": "pressure release",
        "hazardous_substance": "hydrocarbons / flammable gas",
        "exposure": "worker exposed to hazardous pressure release",
        "energy_source": "pressurized fluid / gas energy",
        "equipment": "centrifugal pump",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "unknown",
        "barrier": "pressure isolation / depressurization",
        "barrier_failure": "pressure isolation or zero-energy verification not confirmed",
        "potential_consequence": "severe / fatal pressure release & impact injury",
        "sif_potential": 1,
        "sif_reason": "flange opened on pressurized line without zero-pressure verification",
        "safe_barrier": "pressure isolation & depressurization verified",
        "safe_barrier_failure": "none",
        "safe_exposure": "zero residual pressure confirmed before opening line"
    },
    {
        "activity": "confined space entry",
        "hazard": "toxic gas / hazardous atmosphere",
        "hazardous_substance": "hydrogen sulfide (h2s)",
        "exposure": "worker exposed to toxic gas / oxygen deficiency",
        "energy_source": "chemical / toxic gas energy",
        "equipment": "vessel / container / process line",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "confined space atmosphere",
        "barrier": "atmospheric testing",
        "barrier_failure": "atmospheric testing missing or not performed",
        "potential_consequence": "fatal asphyxiation / acute toxicity poisoning",
        "sif_potential": 1,
        "sif_reason": "untested confined space entry with acute H2S toxicity risk",
        "safe_barrier": "atmospheric testing completed & verified",
        "safe_barrier_failure": "none",
        "safe_exposure": "safe atmospheric conditions verified prior to entry"
    },
    {
        "activity": "work at height",
        "hazard": "fall from height",
        "hazardous_substance": "unknown",
        "exposure": "worker exposed to unprotected fall hazard",
        "energy_source": "potential kinetic / gravitational energy",
        "equipment": "scaffold / elevated platform / ladder",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "elevated work location",
        "barrier": "fall protection system",
        "barrier_failure": "fall protection missing or not used",
        "potential_consequence": "fatal fall from elevation",
        "sif_potential": 1,
        "sif_reason": "work at 8m height on elevated platform without harness 100% tie-off",
        "safe_barrier": "100% harness tie-off & lifeline system",
        "safe_barrier_failure": "none",
        "safe_exposure": "worker fully secured with dual-leg shock-absorbing lanyards"
    },
    {
        "activity": "machinery operation / grinding",
        "hazard": "rotating machinery / caught-in",
        "hazardous_substance": "unknown",
        "exposure": "worker exposed to unguarded rotating machinery",
        "energy_source": "electrical energy",
        "equipment": "grinding machinery",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "unknown",
        "barrier": "machine guarding",
        "barrier_failure": "machine guard removed, missing, or bypassed",
        "potential_consequence": "severe / fatal caught-in or struck-by injury",
        "sif_potential": 1,
        "sif_reason": "grinding machine operated with guard removed",
        "safe_barrier": "factory guard installed & inspect before use",
        "safe_barrier_failure": "none",
        "safe_exposure": "interlocked guard fully functional during grinding operation"
    },
    {
        "activity": "lifting operation",
        "hazard": "suspended load / struck-by",
        "hazardous_substance": "unknown",
        "exposure": "worker in line of fire under suspended load",
        "energy_source": "potential kinetic / gravitational energy",
        "equipment": "crane / lifting equipment",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "unknown",
        "barrier": "exclusion zone / barricading",
        "barrier_failure": "exclusion zone or barricading missing/breached",
        "potential_consequence": "fatal crush / severe blunt force trauma",
        "sif_potential": 1,
        "sif_reason": "workers standing under suspended crane load without barricaded drop zone",
        "safe_barrier": "barricaded exclusion zone & tag lines used",
        "safe_barrier_failure": "none",
        "safe_exposure": "workers stationed outside drop radius using tag lines"
    },
    {
        "activity": "hot work",
        "hazard": "fire / explosion / flammable atmosphere",
        "hazardous_substance": "hydrocarbons / flammable gas",
        "exposure": "worker exposed to flammable vapor ignition",
        "energy_source": "chemical / toxic gas energy",
        "equipment": "vessel / container / process line",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "unknown",
        "barrier": "gas testing",
        "barrier_failure": "required gas testing missing or not completed",
        "potential_consequence": "fatal burns / blast trauma",
        "sif_potential": 1,
        "sif_reason": "welding near hydrocarbon lines without required gas test or valid hot work permit",
        "safe_barrier": "continuous LEL monitoring & hot work permit",
        "safe_barrier_failure": "none",
        "safe_exposure": "continuous LEL reading 0.0% verified before torch ignition"
    },
    {
        "activity": "excavation work",
        "hazard": "excavation collapse / cave-in",
        "hazardous_substance": "unknown",
        "exposure": "worker exposed to excavation collapse",
        "energy_source": "potential kinetic / soil mass energy",
        "equipment": "excavation / trench",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "excavation wall instability",
        "barrier": "excavation protection",
        "barrier_failure": "shoring / excavation protective system missing",
        "potential_consequence": "fatal crush / burial",
        "sif_potential": 1,
        "sif_reason": "workers entered 2.5m deep un-shored unstable excavation",
        "safe_barrier": "hydraulic shoring boxes & trench shield",
        "safe_barrier_failure": "none",
        "safe_exposure": "trench box installed & soil benching verified"
    },
    {
        "activity": "vehicle / pedestrian interaction",
        "hazard": "vehicle-pedestrian interaction / struck-by",
        "hazardous_substance": "unknown",
        "exposure": "pedestrian exposed to moving vehicle",
        "energy_source": "vehicle kinetic energy",
        "equipment": "heavy transport truck",
        "human_factor": "inappropriate positioning / procedure non-compliance",
        "environmental_factor": "unknown",
        "barrier": "exclusion zone / barricading",
        "barrier_failure": "exclusion zone or barricading missing/breached",
        "potential_consequence": "fatal struck-by / crush injury",
        "sif_potential": 1,
        "sif_reason": "pedestrians allowed to enter un-barricaded vehicle operating zone",
        "safe_barrier": "physical pedestrian walkways & spotter",
        "safe_barrier_failure": "none",
        "safe_exposure": "designated pedestrian walkways separated by steel crash barriers"
    }
]

LOW_RISK_PATTERNS = [
    {
        "activity": "office housekeeping",
        "hazard": "ergonomic / minor office hazard",
        "hazardous_substance": "unknown",
        "exposure": "minimal hazard exposure",
        "energy_source": "unknown",
        "equipment": "office furniture",
        "human_factor": "unknown",
        "environmental_factor": "unknown",
        "barrier": "routine housekeeping",
        "barrier_failure": "none",
        "potential_consequence": "minor pain / superficial strain",
        "sif_potential": 0,
        "sif_reason": "minor ergonomics report regarding desk chair height adjustment",
    },
    {
        "activity": "routine tool inspection",
        "hazard": "minor tool wear",
        "hazardous_substance": "unknown",
        "exposure": "minimal hazard exposure",
        "energy_source": "electrical energy",
        "equipment": "hand tools",
        "human_factor": "proactive reporting",
        "environmental_factor": "unknown",
        "barrier": "pre-use inspection",
        "barrier_failure": "none",
        "potential_consequence": "minor scratch / no injury",
        "sif_potential": 0,
        "sif_reason": "frayed extension cord identified during morning check and tagged out immediately",
    },
    {
        "activity": "pressurized system maintenance",
        "hazard": "pressure release",
        "hazardous_substance": "hydrocarbons / flammable gas",
        "exposure": "safe atmospheric conditions verified prior to entry",
        "energy_source": "pressurized fluid / gas energy",
        "equipment": "centrifugal pump",
        "human_factor": "procedure compliance",
        "environmental_factor": "unknown",
        "barrier": "pressure isolation / depressurization",
        "barrier_failure": "none",
        "potential_consequence": "no consequence / controlled operation",
        "sif_potential": 0,
        "sif_reason": "LOTO applied, double block & bleed verified zero pressure before maintenance",
    },
    {
        "activity": "work at height",
        "hazard": "fall from height",
        "hazardous_substance": "unknown",
        "exposure": "worker fully secured with dual-leg shock-absorbing lanyards",
        "energy_source": "potential kinetic / gravitational energy",
        "equipment": "scaffold / elevated platform / ladder",
        "human_factor": "procedure compliance",
        "environmental_factor": "elevated work location",
        "barrier": "fall protection system",
        "barrier_failure": "none",
        "potential_consequence": "no consequence / controlled operation",
        "sif_potential": 0,
        "sif_reason": "scaffold erection audit confirmed top rail, mid rail, toe boards, and green tag in place",
    },
    {
        "activity": "confined space entry",
        "hazard": "toxic gas / hazardous atmosphere",
        "hazardous_substance": "hydrogen sulfide (h2s)",
        "exposure": "safe atmospheric conditions verified prior to entry",
        "energy_source": "chemical / toxic gas energy",
        "equipment": "vessel / container / process line",
        "human_factor": "procedure compliance",
        "environmental_factor": "confined space atmosphere",
        "barrier": "atmospheric testing",
        "barrier_failure": "none",
        "potential_consequence": "no consequence / controlled operation",
        "sif_potential": 0,
        "sif_reason": "confined space gas test completed 20.9% O2, 0ppm H2S, 0% LEL with standby attendant present",
    },
    {
        "activity": "lifting operation",
        "hazard": "suspended load / struck-by",
        "hazardous_substance": "unknown",
        "exposure": "workers stationed outside drop radius using tag lines",
        "energy_source": "potential kinetic / gravitational energy",
        "equipment": "crane / lifting equipment",
        "human_factor": "procedure compliance",
        "environmental_factor": "unknown",
        "barrier": "exclusion zone / barricading",
        "barrier_failure": "none",
        "potential_consequence": "no consequence / controlled operation",
        "sif_potential": 0,
        "sif_reason": "crane lift executed with barricaded drop zone and certified rigger using tag lines",
    }
]


def generate_dataset(total_records: int = 5000):
    records = []
    
    # 1. Generate ~500 counterfactual pairs
    num_pairs = 500
    for i in range(num_pairs):
        pat = random.choice(HIGH_RISK_PATTERNS)
        pair_id = f"pair_{i+1:04d}"
        
        # High Risk SIF record
        sif_rec = {
            "report_id": f"REP-SIF-{uuid.uuid4().hex[:8]}",
            "pair_id": pair_id,
            "report_type": random.choice(["near_miss", "incident", "unsafe_act"]),
            "report_text": f"During {pat['activity']} on {pat['equipment']}, {pat['sif_reason']}.",
            "activity": pat["activity"],
            "hazard": pat["hazard"],
            "hazardous_substance": pat["hazardous_substance"],
            "exposure": pat["exposure"],
            "energy_source": pat["energy_source"],
            "equipment": pat["equipment"],
            "human_factor": pat["human_factor"],
            "environmental_factor": pat["environmental_factor"],
            "barrier": pat["barrier"],
            "barrier_failure": pat["barrier_failure"],
            "potential_consequence": pat["potential_consequence"],
            "sif_potential": 1,
            "sif_reason": pat["sif_reason"]
        }
        records.append(sif_rec)
        
        # Safe Counterfactual record
        safe_rec = {
            "report_id": f"REP-SAFE-{uuid.uuid4().hex[:8]}",
            "pair_id": pair_id,
            "report_type": random.choice(["safety_observation", "near_miss"]),
            "report_text": f"During {pat['activity']} on {pat['equipment']}, {pat['safe_barrier']} was in place. {pat['safe_exposure']}.",
            "activity": pat["activity"],
            "hazard": pat["hazard"],
            "hazardous_substance": pat["hazardous_substance"],
            "exposure": pat["safe_exposure"],
            "energy_source": pat["energy_source"],
            "equipment": pat["equipment"],
            "human_factor": "procedure compliance",
            "environmental_factor": pat["environmental_factor"],
            "barrier": pat["safe_barrier"],
            "barrier_failure": pat["safe_barrier_failure"],
            "potential_consequence": "no consequence / controlled operation",
            "sif_potential": 0,
            "sif_reason": f"Safe operation: {pat['safe_barrier']}"
        }
        records.append(safe_rec)

    # 2. Generate remaining records
    remaining = total_records - len(records)
    for _ in range(remaining):
        is_sif = random.random() < 0.35
        if is_sif:
            pat = random.choice(HIGH_RISK_PATTERNS)
            rec = {
                "report_id": f"REP-{uuid.uuid4().hex[:8]}",
                "pair_id": "none",
                "report_type": random.choice(["near_miss", "incident", "unsafe_act", "hazard_observation"]),
                "report_text": f"Safety report detailing {pat['activity']} with {pat['hazard']} where {pat['barrier_failure']}.",
                "activity": pat["activity"],
                "hazard": pat["hazard"],
                "hazardous_substance": pat["hazardous_substance"],
                "exposure": pat["exposure"],
                "energy_source": pat["energy_source"],
                "equipment": pat["equipment"],
                "human_factor": pat["human_factor"],
                "environmental_factor": pat["environmental_factor"],
                "barrier": pat["barrier"],
                "barrier_failure": pat["barrier_failure"],
                "potential_consequence": pat["potential_consequence"],
                "sif_potential": 1,
                "sif_reason": pat["sif_reason"]
            }
        else:
            pat = random.choice(LOW_RISK_PATTERNS)
            rec = {
                "report_id": f"REP-{uuid.uuid4().hex[:8]}",
                "pair_id": "none",
                "report_type": random.choice(["safety_observation", "near_miss", "hazard_observation"]),
                "report_text": f"Observation on {pat['activity']}: {pat['sif_reason']}.",
                "activity": pat["activity"],
                "hazard": pat["hazard"],
                "hazardous_substance": pat["hazardous_substance"],
                "exposure": pat["exposure"],
                "energy_source": pat["energy_source"],
                "equipment": pat["equipment"],
                "human_factor": pat["human_factor"],
                "environmental_factor": pat["environmental_factor"],
                "barrier": pat["barrier"],
                "barrier_failure": pat["barrier_failure"],
                "potential_consequence": pat["potential_consequence"],
                "sif_potential": 0,
                "sif_reason": pat["sif_reason"]
            }
        records.append(rec)

    df = pd.DataFrame(records)
    
    # Save full dataset
    full_path = os.path.join(DATA_DIR, "sif_guard_xgboost_dataset.csv")
    df.to_csv(full_path, index=False)
    print(f"Generated full dataset: {full_path} ({len(df)} rows)")

    # Stratified Train/Val/Test Split (Train 70%, Val 15%, Test 15%)
    df_pairs = df[df["pair_id"] != "none"]
    df_non_pairs = df[df["pair_id"] == "none"]

    pair_ids_list = list(df_pairs["pair_id"].unique())
    train_pairs_ids, test_val_pairs_ids = train_test_split(
        pair_ids_list, test_size=0.30, random_state=42
    )
    val_pairs_ids, test_pairs_ids = train_test_split(
        test_val_pairs_ids, test_size=0.50, random_state=42
    )

    df_pairs_train = df_pairs[df_pairs["pair_id"].isin(train_pairs_ids)]
    df_pairs_val = df_pairs[df_pairs["pair_id"].isin(val_pairs_ids)]
    df_pairs_test = df_pairs[df_pairs["pair_id"].isin(test_pairs_ids)]

    df_np_train, df_np_test_val = train_test_split(
        df_non_pairs, test_size=0.30, random_state=42, stratify=df_non_pairs["sif_potential"]
    )
    df_np_val, df_np_test = train_test_split(
        df_np_test_val, test_size=0.50, random_state=42, stratify=df_np_test_val["sif_potential"]
    )

    df_train = pd.concat([df_pairs_train, df_np_train]).sample(frac=1, random_state=42).reset_index(drop=True)
    df_val = pd.concat([df_pairs_val, df_np_val]).sample(frac=1, random_state=42).reset_index(drop=True)
    df_test = pd.concat([df_pairs_test, df_np_test]).sample(frac=1, random_state=42).reset_index(drop=True)

    train_path = os.path.join(DATA_DIR, "sif_guard_train.csv")
    val_path = os.path.join(DATA_DIR, "sif_guard_validation.csv")
    test_path = os.path.join(DATA_DIR, "sif_guard_test.csv")

    df_train.to_csv(train_path, index=False)
    df_val.to_csv(val_path, index=False)
    df_test.to_csv(test_path, index=False)

    print(f"Saved Train Split      : {train_path} ({len(df_train)} rows)")
    print(f"Saved Validation Split : {val_path} ({len(df_val)} rows)")
    print(f"Saved Test Split       : {test_path} ({len(df_test)} rows)")


if __name__ == "__main__":
    generate_dataset(5000)
