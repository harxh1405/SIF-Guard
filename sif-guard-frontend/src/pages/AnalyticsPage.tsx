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
import { motion } from 'motion/react';
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

  const tooltipStyle = {
    background: '#17110D',
    border: '1px solid #33251C',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
    color: '#F5EEE8',
    fontSize: '0.85rem',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2 className="section-title">
          Hotspot Intelligence & Trend Analytics
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Identify organizational SIF precursor hotspots by site, activity, hazard, barrier failure, and temporal trend
        </p>
      </div>

      {/* Analytics Dimension Sub-Tabs */}
      <div
        className="card"
        style={{
          padding: '8px',
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'var(--surface)',
        }}
      >
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
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Sites Tab */}
          {activeTab === 'sites' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
                Highest SIF Precursor Density by Site / Facility
              </h3>
              <div className="chart-container-wrapper" style={{ height: '400px', width: '100%', marginBottom: '24px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                  <BarChart data={siteData} margin={{ top: 20, right: 30, left: 10, bottom: 65 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis
                      dataKey="site"
                      stroke="var(--text-muted)"
                      tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={65}
                    />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="sif_count" name="SIF Precursors" fill="#E85D5D" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_reports" name="Total Reports" fill="#FF6A00" radius={[4, 4, 0, 0]} />
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
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{s.total_reports}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{s.sif_count}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}><strong>{(s.sif_density * 100).toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
                Highest Risk Operational Activities
              </h3>
              <div className="chart-container-wrapper" style={{ height: '420px', width: '100%', marginBottom: '24px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                  <BarChart data={activityData} layout="vertical" margin={{ top: 10, right: 30, left: 140, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }} />
                    <YAxis dataKey="activity" type="category" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }} width={140} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="sif_count" name="SIF Precursor Count" fill="#FF6A00" radius={[0, 4, 4, 0]} />
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
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{a.total_reports}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{a.sif_count}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}><strong>{(a.sif_density * 100).toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hazards Tab */}
          {activeTab === 'hazards' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
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
                      <td style={{ fontWeight: 600, color: 'var(--primary-bright)' }}>{h.hazard}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{h.total_reports}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{h.sif_count}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}><strong>{(h.sif_density * 100).toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Barrier Failures Tab */}
          {activeTab === 'barriers' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
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
                      <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{b.barrier_failure}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{b.total_reports}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{b.sif_count}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}><strong>{(b.sif_density * 100).toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Life-Saving Rules Tab */}
          {activeTab === 'lsr' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
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
                      <td style={{ fontWeight: 600, color: 'var(--primary-bright)' }}>{lsr.rule_name}</td>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{lsr.count}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}><strong>{lsr.percentage.toFixed(1)}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
                Temporal SIF Precursor Trends Over Time
              </h3>
              <div className="chart-container-wrapper" style={{ height: '380px', width: '100%', marginBottom: '24px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                  <LineChart data={trendData} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="sif_precursors" name="SIF Precursors" stroke="#E85D5D" strokeWidth={3} dot={{ r: 5, fill: '#E85D5D' }} />
                    <Line type="monotone" dataKey="total_reports" name="Total Reports" stroke="#FF6A00" strokeWidth={2} dot={{ r: 4, fill: '#FF6A00' }} />
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
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{t.total_reports}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{t.sif_precursors}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{(t.sif_density * 100).toFixed(1)}%</td>
                      <td style={{ color: t.percentage_change > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
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
        </motion.div>
      )}
    </motion.div>
  );
};
