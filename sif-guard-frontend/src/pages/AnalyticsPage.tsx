import React, { useState, useEffect } from 'react';
import {
  getSiteAnalytics,
  getActivityAnalytics,
  getHazardAnalytics,
  getBarrierAnalytics,
  getLSRAnalytics,
  getTrendAnalytics,
} from '../api/analytics';
import type {
  SiteRanking,
  ActivityRanking,
  HazardRanking,
  BarrierRanking,
  LSRRanking,
  TrendData,
} from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Building2, Activity, AlertTriangle, ShieldAlert, BookOpen, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sites' | 'activities' | 'hazards' | 'barriers' | 'lsr' | 'trends'>('sites');
  
  const [siteData, setSiteData] = useState<SiteRanking[]>([]);
  const [activityData, setActivityData] = useState<ActivityRanking[]>([]);
  const [hazardData, setHazardData] = useState<HazardRanking[]>([]);
  const [barrierData, setBarrierData] = useState<BarrierRanking[]>([]);
  const [lsrData, setLsrData] = useState<LSRRanking[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      getSiteAnalytics(10),
      getActivityAnalytics(10),
      getHazardAnalytics(10),
      getBarrierAnalytics(10),
      getLSRAnalytics(10),
      getTrendAnalytics('month'),
    ])
      .then(([sites, activities, hazards, barriers, lsr, trends]) => {
        setSiteData(sites);
        setActivityData(activities);
        setHazardData(hazards);
        setBarrierData(barriers);
        setLsrData(lsr);
        setTrendData(trends);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load hotspot analytics');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>
          Hotspot Intelligence & Trend Analytics
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Identify organizational SIF precursor hotspots by site, activity, hazard, barrier failure, and temporal trend
        </p>
      </div>

      {/* Analytics Dimension Sub-Tabs */}
      <div className="glass-card" style={{ padding: '8px', marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'sites', label: 'Sites & Locations', icon: Building2 },
          { id: 'activities', label: 'Activities & Tasks', icon: Activity },
          { id: 'hazards', label: 'Recurring Hazards', icon: AlertTriangle },
          { id: 'barriers', label: 'Barrier Failures', icon: ShieldAlert },
          { id: 'lsr', label: 'Life-Saving Rules', icon: BookOpen },
          { id: 'trends', label: 'Temporal Trends', icon: TrendingUp },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <div>
          {/* Sites Tab */}
          {activeTab === 'sites' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                Highest SIF Precursor Density by Site / Facility
              </h3>
              <div style={{ height: '380px', width: '100%', marginBottom: '24px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={siteData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="site" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="sif_count" name="SIF Precursor Count" fill="var(--accent-sif-red)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_reports" name="Total Reports" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Site / Facility</th>
                    <th>Total Reports</th>
                    <th>SIF Precursor Count</th>
                    <th>SIF Density (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {siteData.map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{s.site}</td>
                      <td>{s.total_reports}</td>
                      <td style={{ color: 'var(--accent-sif-red)', fontWeight: 700 }}>{s.sif_count}</td>
                      <td><strong>{(s.sif_density * 100).toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                Highest Risk Operational Activities
              </h3>
              <div style={{ height: '380px', width: '100%', marginBottom: '24px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="activity" type="category" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Bar dataKey="sif_count" name="SIF Precursor Count" fill="var(--accent-sif-red)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Activity / Task</th>
                    <th>Total Reports</th>
                    <th>SIF Precursor Count</th>
                    <th>SIF Density (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {activityData.map((a, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{a.activity}</td>
                      <td>{a.total_reports}</td>
                      <td style={{ color: 'var(--accent-sif-red)', fontWeight: 700 }}>{a.sif_count}</td>
                      <td><strong>{(a.sif_density * 100).toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hazards Tab */}
          {activeTab === 'hazards' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                Recurring Precursor Hazards
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hazard Identification</th>
                    <th>Total Reports</th>
                    <th>SIF Precursor Count</th>
                    <th>SIF Precursor Density</th>
                  </tr>
                </thead>
                <tbody>
                  {hazardData.map((h, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{h.hazard}</td>
                      <td>{h.total_reports}</td>
                      <td style={{ color: 'var(--accent-sif-red)', fontWeight: 700 }}>{h.sif_count}</td>
                      <td><strong>{(h.sif_density * 100).toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Barrier Failures Tab */}
          {activeTab === 'barriers' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                Failed, Missing, or Bypassed Safety Barriers
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Safety Barrier Failure Defect</th>
                    <th>Total Reports</th>
                    <th>SIF Precursor Count</th>
                    <th>SIF Precursor Density</th>
                  </tr>
                </thead>
                <tbody>
                  {barrierData.map((b, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-sif-red)' }}>{b.barrier_failure}</td>
                      <td>{b.total_reports}</td>
                      <td style={{ color: 'var(--accent-sif-red)', fontWeight: 700 }}>{b.sif_count}</td>
                      <td><strong>{(b.sif_density * 100).toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Life-Saving Rules Tab */}
          {activeTab === 'lsr' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                IOGP Life-Saving Rules Implication Distribution
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Life-Saving Rule Name</th>
                    <th>Incident Match Count</th>
                    <th>Percentage Share (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {lsrData.map((lsr, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{lsr.rule_name}</td>
                      <td style={{ fontWeight: 700 }}>{lsr.count}</td>
                      <td><strong>{lsr.percentage.toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                Temporal SIF Precursor Trends Over Time
              </h3>
              <div style={{ height: '380px', width: '100%', marginBottom: '24px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="period" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="sif_precursors" name="SIF Precursors" stroke="var(--accent-sif-red)" strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="total_reports" name="Total Reports" stroke="var(--accent-cyan)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time Period</th>
                    <th>Total Reports</th>
                    <th>SIF Precursor Count</th>
                    <th>Precursor Density</th>
                    <th>Change (% Growth)</th>
                    <th>Trend Indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((t, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{t.period}</td>
                      <td>{t.total_reports}</td>
                      <td style={{ color: 'var(--accent-sif-red)', fontWeight: 700 }}>{t.sif_precursors}</td>
                      <td>{(t.sif_density * 100).toFixed(1)}%</td>
                      <td style={{ color: t.percentage_change > 0 ? 'var(--accent-sif-red)' : 'var(--accent-nonsif-green)', fontWeight: 600 }}>
                        {t.percentage_change > 0 ? `+${t.percentage_change}%` : `${t.percentage_change}%`}
                      </td>
                      <td>
                        <span className={t.trend === 'INCREASE' ? 'badge badge-sif' : 'badge badge-nonsif'}>
                          {t.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
