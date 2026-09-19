export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  timeAgo: string;
  type: 'REPORT_ANALYZED' | 'BARRIER_DETECTED' | 'PATTERN_UPDATED' | 'SEMANTIC_MATCH' | 'PIPELINE_EVENT';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  reportId?: string;
  metadata?: Record<string, any>;
}

export function generateActivityFeedFromReports(
  reports: Array<{
    id: string;
    source_record_id?: string;
    sif_potential?: string | null;
    barrier_failure?: string | null;
    created_at?: string;
    sif_score?: number | null;
  }> = []
): ActivityFeedItem[] {
  const feed: ActivityFeedItem[] = [];

  reports.slice(0, 8).forEach((rep, idx) => {
    const reportCode = rep.source_record_id || rep.id.substring(0, 7);
    const dateStr = rep.created_at ? new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `0${9 - idx}:42`;

    if (rep.sif_potential === 'SIF_POTENTIAL' || (rep.sif_score && rep.sif_score > 0.7)) {
      feed.push({
        id: `act-sif-${rep.id}`,
        timestamp: dateStr,
        timeAgo: `${(idx + 1) * 3}m ago`,
        type: 'REPORT_ANALYZED',
        title: 'New report analyzed',
        description: `${reportCode} was classified as SIF Potential.`,
        severity: 'critical',
        reportId: rep.id,
      });
    }

    if (rep.barrier_failure) {
      feed.push({
        id: `act-bar-${rep.id}`,
        timestamp: dateStr,
        timeAgo: `${(idx + 1) * 4}m ago`,
        type: 'BARRIER_DETECTED',
        title: 'Barrier signal detected',
        description: `${rep.barrier_failure} failure observed in ${reportCode}.`,
        severity: 'warning',
        reportId: rep.id,
      });
    }
  });

  // Default baseline operational feed items if reports are sparse
  if (feed.length < 4) {
    feed.push(
      {
        id: 'act-base-1',
        timestamp: '09:42',
        timeAgo: '2m ago',
        type: 'REPORT_ANALYZED',
        title: 'Report BFT-010 analyzed',
        description: 'BFT-010 was classified as SIF Potential by Hybrid Ensemble v1.1.0.',
        severity: 'critical',
        reportId: 'BFT-010',
      },
      {
        id: 'act-base-2',
        timestamp: '09:39',
        timeAgo: '5m ago',
        type: 'BARRIER_DETECTED',
        title: 'Barrier signal detected',
        description: 'Pressure isolation failure observed across maintenance tasks.',
        severity: 'warning',
        reportId: 'BFT-002',
      },
      {
        id: 'act-base-3',
        timestamp: '09:36',
        timeAgo: '8m ago',
        type: 'PATTERN_UPDATED',
        title: 'Emerging Pattern updated',
        description: 'Pressure Isolation Failure pattern updated with 17 related records.',
        severity: 'info',
      },
      {
        id: 'act-base-4',
        timestamp: '09:31',
        timeAgo: '13m ago',
        type: 'SEMANTIC_MATCH',
        title: 'Semantic match found',
        description: 'BFT-010 matched historical report BFT-002 at 78% vector similarity.',
        severity: 'info',
        reportId: 'BFT-010',
      }
    );
  }

  return feed.sort((a, b) => b.id.localeCompare(a.id));
}
