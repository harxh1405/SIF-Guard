from typing import List, Dict, Any


def evaluate_entity_spans(
    predictions: List[Dict[str, Any]],
    ground_truth: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes Entity-level Precision, Recall, and F1 across predicted vs ground truth spans.
    Computes per-class F1 for key safety categories.
    """
    classes = [
        "ACTIVITY", "HAZARD", "BARRIER", "BARRIER_FAILURE",
        "EXPOSURE", "ENERGY_SOURCE", "EQUIPMENT", "POTENTIAL_CONSEQUENCE"
    ]
    class_stats = {c: {"tp": 0, "fp": 0, "fn": 0} for c in classes}
    total_tp = 0
    total_fp = 0
    total_fn = 0

    # Build lookup for ground truth: (start, end, label)
    gt_set = set()
    for item in ground_truth:
        lbl = item.get("label")
        gt_set.add((item.get("start"), item.get("end"), lbl))
        if lbl in class_stats:
            class_stats[lbl]["fn"] += 1
        total_fn += 1

    pred_set = set()
    for item in predictions:
        lbl = item.get("label")
        key = (item.get("start"), item.get("end"), lbl)
        pred_set.add(key)
        if key in gt_set:
            total_tp += 1
            total_fn -= 1
            if lbl in class_stats:
                class_stats[lbl]["tp"] += 1
                class_stats[lbl]["fn"] -= 1
        else:
            total_fp += 1
            if lbl in class_stats:
                class_stats[lbl]["fp"] += 1

    precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    per_class_f1 = {}
    for c, s in class_stats.items():
        p = s["tp"] / (s["tp"] + s["fp"]) if (s["tp"] + s["fp"]) > 0 else 0.0
        r = s["tp"] / (s["tp"] + s["fn"]) if (s["tp"] + s["fn"]) > 0 else 0.0
        c_f1 = 2 * (p * r) / (p + r) if (p + r) > 0 else 0.0
        per_class_f1[c] = {
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1": round(c_f1, 4),
            "support": s["tp"] + s["fn"]
        }

    return {
        "overall_precision": round(precision, 4),
        "overall_recall": round(recall, 4),
        "overall_f1": round(f1, 4),
        "per_class_metrics": per_class_f1
    }
