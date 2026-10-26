import React from 'react';
import { Users, AlertTriangle, Droplets, ShieldCheck, Award } from 'lucide-react';

import type { HealthStats as HealthStatsType } from '../types';

interface HealthStatsProps {
  stats: HealthStatsType | null;
  loading: boolean;
  onFilterRisk?: (risk: string) => void;
  activeRiskFilter?: string;
}

export const HealthStats: React.FC<HealthStatsProps> = ({
  stats,
  loading,
  onFilterRisk,
  activeRiskFilter,
}) => {
  if (loading && !stats) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card glass-panel skeleton-card" style={{ minHeight: '105px' }}>
            <div className="shimmer-placeholder" />
          </div>
        ))}
      </div>
    );
  }

  const s = stats || {
    total_patients: 0,
    avg_glucose: 0,
    avg_haemoglobin: 0,
    avg_cholesterol: 0,
    high_risk_count: 0,
    moderate_risk_count: 0,
    optimal_count: 0,
    avg_health_score: 0,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="stats-grid">
      {/* Total Patients & Cohort Score */}
      <div
        className="stat-card glass-panel interactive-stat"
        onClick={() => onFilterRisk && onFilterRisk('All')}
        title="Click to view all patients"
      >
        <div className="stat-icon-wrap cyan">
          <Users size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Patient Registry</span>
          <div className="stat-value-row">
            <span className="stat-value">{s.total_patients}</span>
            <span className="stat-sub">Enrolled</span>
          </div>
          <div className="stat-cohort-score">
            <Award size={12} color="#06b6d4" />
            <span>Avg Health Index: <strong style={{ color: getScoreColor(s.avg_health_score) }}>{s.avg_health_score || '--'}</strong>/100</span>
          </div>
        </div>
      </div>

      {/* High / Critical Risk Alerts */}
      <div
        className={`stat-card glass-panel interactive-stat ${activeRiskFilter === 'High' ? 'stat-card-active' : ''}`}
        onClick={() => onFilterRisk && onFilterRisk('High')}
        title="Click to filter by High Risk"
      >
        <div className="stat-icon-wrap rose">
          <AlertTriangle size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Critical / High Risk</span>
          <div className="stat-value-row">
            <span className="stat-value" style={{ color: s.high_risk_count > 0 ? '#fb7185' : 'inherit' }}>
              {s.high_risk_count}
            </span>
            <span className="stat-sub">Immediate Followup</span>
          </div>
          <div className="stat-bar-preview">
            <div
              className="stat-bar-fill fill-rose"
              style={{ width: `${s.total_patients ? (s.high_risk_count / s.total_patients) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Moderate Risk Alert */}
      <div
        className={`stat-card glass-panel interactive-stat ${activeRiskFilter === 'Moderate' ? 'stat-card-active' : ''}`}
        onClick={() => onFilterRisk && onFilterRisk('Moderate')}
        title="Click to filter by Moderate Risk"
      >
        <div className="stat-icon-wrap amber">
          <Droplets size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Moderate / Borderline</span>
          <div className="stat-value-row">
            <span className="stat-value" style={{ color: s.moderate_risk_count > 0 ? '#fbbf24' : 'inherit' }}>
              {s.moderate_risk_count}
            </span>
            <span className="stat-sub">Lifestyle Review</span>
          </div>
          <div className="stat-bar-preview">
            <div
              className="stat-bar-fill fill-amber"
              style={{ width: `${s.total_patients ? (s.moderate_risk_count / s.total_patients) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Favorable / Optimal Cohort */}
      <div
        className={`stat-card glass-panel interactive-stat ${activeRiskFilter === 'Optimal' ? 'stat-card-active' : ''}`}
        onClick={() => onFilterRisk && onFilterRisk('Optimal')}
        title="Click to filter by Optimal Status"
      >
        <div className="stat-icon-wrap emerald">
          <ShieldCheck size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Optimal Biomarkers</span>
          <div className="stat-value-row">
            <span className="stat-value" style={{ color: '#34d399' }}>
              {s.optimal_count}
            </span>
            <span className="stat-sub">Stable Profiles</span>
          </div>
          <div className="stat-bar-preview">
            <div
              className="stat-bar-fill fill-emerald"
              style={{ width: `${s.total_patients ? (s.optimal_count / s.total_patients) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
