from typing import List, Dict, Any
from collections import defaultdict
from sqlalchemy.orm import Session
from app.db.models.report import SafetyReport
from app.schemas.analytics import TrendData


class TrendService:

    def calculate_trends(self, db: Session, grouping: str = "month") -> List[TrendData]:
        reports = db.query(SafetyReport).all()
        if not reports:
            return []

        # Group reports by period string (YYYY-MM or YYYY-Qx)
        period_data = defaultdict(lambda: {"total": 0, "sif": 0})

        for r in reports:
            dt = r.event_date or r.created_at
            if grouping == "quarter":
                quarter = (dt.month - 1) // 3 + 1
                period_str = f"{dt.year}-Q{quarter}"
            else:
                period_str = dt.strftime("%Y-%m")
            
            period_data[period_str]["total"] += 1
            if r.sif_potential == "SIF_POTENTIAL":
                period_data[period_str]["sif"] += 1

        sorted_periods = sorted(period_data.keys())
        trend_results = []
        prev_sif_count = None

        for period in sorted_periods:
            total = period_data[period]["total"]
            sif_count = period_data[period]["sif"]
            density = round(sif_count / total if total > 0 else 0.0, 4)

            pct_change = 0.0
            trend_dir = "STABLE"
            if prev_sif_count is not None:
                if prev_sif_count > 0:
                    pct_change = round(((sif_count - prev_sif_count) / prev_sif_count) * 100.0, 2)
                elif sif_count > 0:
                    pct_change = 100.0
                
                if pct_change > 5.0:
                    trend_dir = "INCREASE"
                elif pct_change < -5.0:
                    trend_dir = "DECREASE"

            prev_sif_count = sif_count
            trend_results.append(TrendData(
                period=period,
                total_reports=total,
                sif_precursors=sif_count,
                sif_density=density,
                percentage_change=pct_change,
                trend=trend_dir
            ))

        return trend_results


trend_service = TrendService()
