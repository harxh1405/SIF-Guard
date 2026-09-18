from typing import List, Dict, Any
from collections import Counter, defaultdict
from sqlalchemy.orm import Session
from app.db.models.report import SafetyReport
from app.db.models.clustering import PrecursorCluster
from app.schemas.analytics import (
    SiteRanking, ActivityRanking, HazardRanking, BarrierRanking, LSRRanking, DashboardSummary
)
from app.services.trends.service import trend_service


class AnalyticsService:

    def _get_reports_query(self, db: Session, include_synthetic: bool = False):
        query = db.query(SafetyReport)
        if not include_synthetic:
            query = query.filter(SafetyReport.data_origin != "synthetic")
        return query.all()

    def compute_site_rankings(self, reports: List[Any], limit: int = 10) -> List[SiteRanking]:
        site_totals = defaultdict(int)
        site_sif = defaultdict(int)

        for r in reports:
            s_name = r.site or r.employer or "Unknown Location"
            site_totals[s_name] += 1
            if r.sif_potential == "SIF_POTENTIAL":
                site_sif[s_name] += 1

        rankings = []
        for s_name, tot in site_totals.items():
            s_count = site_sif[s_name]
            density = round(s_count / tot if tot > 0 else 0.0, 4)
            rankings.append(SiteRanking(site=s_name, total_reports=tot, sif_count=s_count, sif_density=density))

        rankings.sort(key=lambda x: (x.sif_density, x.sif_count), reverse=True)
        return rankings[:limit]

    def get_site_rankings(self, db: Session, limit: int = 10, include_synthetic: bool = False) -> List[SiteRanking]:
        reports = self._get_reports_query(db, include_synthetic)
        return self.compute_site_rankings(reports, limit)

    def compute_activity_rankings(self, reports: List[Any], limit: int = 10) -> List[ActivityRanking]:
        act_totals = defaultdict(int)
        act_sif = defaultdict(int)

        for r in reports:
            act = r.activity or "Unspecified Activity"
            act_totals[act] += 1
            if r.sif_potential == "SIF_POTENTIAL":
                act_sif[act] += 1

        rankings = []
        for act, tot in act_totals.items():
            s_count = act_sif[act]
            density = round(s_count / tot if tot > 0 else 0.0, 4)
            rankings.append(ActivityRanking(activity=act, total_reports=tot, sif_count=s_count, sif_density=density))

        rankings.sort(key=lambda x: (x.sif_density, x.sif_count), reverse=True)
        return rankings[:limit]

    def get_activity_rankings(self, db: Session, limit: int = 10, include_synthetic: bool = False) -> List[ActivityRanking]:
        reports = self._get_reports_query(db, include_synthetic)
        return self.compute_activity_rankings(reports, limit)

    def compute_hazard_rankings(self, reports: List[Any], limit: int = 10) -> List[HazardRanking]:
        haz_totals = defaultdict(int)
        haz_sif = defaultdict(int)

        for r in reports:
            haz = r.hazard or "Unspecified Hazard"
            haz_totals[haz] += 1
            if r.sif_potential == "SIF_POTENTIAL":
                haz_sif[haz] += 1

        rankings = []
        for haz, tot in haz_totals.items():
            s_count = haz_sif[haz]
            density = round(s_count / tot if tot > 0 else 0.0, 4)
            rankings.append(HazardRanking(hazard=haz, total_reports=tot, sif_count=s_count, sif_density=density))

        rankings.sort(key=lambda x: (x.sif_density, x.sif_count), reverse=True)
        return rankings[:limit]

    def get_hazard_rankings(self, db: Session, limit: int = 10, include_synthetic: bool = False) -> List[HazardRanking]:
        reports = self._get_reports_query(db, include_synthetic)
        return self.compute_hazard_rankings(reports, limit)

    def compute_barrier_rankings(self, reports: List[Any], limit: int = 10) -> List[BarrierRanking]:
        barr_totals = defaultdict(int)
        barr_sif = defaultdict(int)

        for r in reports:
            b_fail = r.barrier_failure or "Unspecified Barrier Defect"
            barr_totals[b_fail] += 1
            if r.sif_potential == "SIF_POTENTIAL":
                barr_sif[b_fail] += 1

        rankings = []
        for b_fail, tot in barr_totals.items():
            s_count = barr_sif[b_fail]
            density = round(s_count / tot if tot > 0 else 0.0, 4)
            rankings.append(BarrierRanking(barrier_failure=b_fail, total_reports=tot, sif_count=s_count, sif_density=density))

        rankings.sort(key=lambda x: (x.sif_density, x.sif_count), reverse=True)
        return rankings[:limit]

    def get_barrier_rankings(self, db: Session, limit: int = 10, include_synthetic: bool = False) -> List[BarrierRanking]:
        reports = self._get_reports_query(db, include_synthetic)
        return self.compute_barrier_rankings(reports, limit)

    def compute_lsr_rankings(self, reports: List[Any], limit: int = 10) -> List[LSRRanking]:
        lsr_counts = Counter()
        total_lsr_instances = 0

        for r in reports:
            if r.life_saving_rules and isinstance(r.life_saving_rules, list):
                for item in r.life_saving_rules:
                    rule_name = item.get("rule_name") if isinstance(item, dict) else str(item)
                    if rule_name:
                        lsr_counts[rule_name] += 1
                        total_lsr_instances += 1

        rankings = []
        for rule_name, count in lsr_counts.most_common(limit):
            pct = round((count / total_lsr_instances) * 100.0 if total_lsr_instances > 0 else 0.0, 2)
            rankings.append(LSRRanking(rule_name=rule_name, count=count, percentage=pct))

        return rankings

    def get_lsr_rankings(self, db: Session, limit: int = 10, include_synthetic: bool = False) -> List[LSRRanking]:
        reports = self._get_reports_query(db, include_synthetic)
        return self.compute_lsr_rankings(reports, limit)

    def get_dashboard_summary(self, db: Session, include_synthetic: bool = False) -> DashboardSummary:
        reports = self._get_reports_query(db, include_synthetic)
        total_reports = len(reports)
        sif_count = sum(1 for r in reports if r.sif_potential == "SIF_POTENTIAL")
        sif_density = round(sif_count / total_reports if total_reports > 0 else 0.0, 4)

        sites_count = len(set(r.site or r.employer for r in reports if r.site or r.employer))
        activities_count = len(set(r.activity for r in reports if r.activity))

        top_lsr = self.compute_lsr_rankings(reports, limit=5)
        top_hazards = self.compute_hazard_rankings(reports, limit=5)
        top_barriers = self.compute_barrier_rankings(reports, limit=5)

        clusters = db.query(PrecursorCluster).order_by(PrecursorCluster.sif_density.desc()).limit(5).all()
        emerging_patterns = [{
            "id": c.id,
            "name": c.name,
            "report_count": c.report_count,
            "sif_precursor_count": c.sif_precursor_count,
            "sif_density": c.sif_density,
            "dominant_activity": c.dominant_activity,
            "dominant_hazard": c.dominant_hazard,
            "dominant_barrier_failure": c.dominant_barrier_failure
        } for c in clusters]

        return DashboardSummary(
            total_reports=total_reports,
            sif_precursor_count=sif_count,
            sif_precursor_density=sif_density,
            sites=sites_count,
            activities=activities_count,
            top_lsr=top_lsr,
            top_hazards=top_hazards,
            top_barrier_failures=top_barriers,
            emerging_patterns=emerging_patterns
        )


analytics_service = AnalyticsService()
