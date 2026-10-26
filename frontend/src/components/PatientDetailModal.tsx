import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Mail,
  Droplets,
  Activity,
  HeartPulse,
  Copy,
  Check,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Printer,
  CheckSquare,
  Award,
  Layers,
} from 'lucide-react';

import type { Patient } from '../types';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onReanalyze: (patientId: number) => void;
  isReanalyzing: boolean;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  onEdit,
  onDelete,
  onReanalyze,
  isReanalyzing,
}) => {
  const [activeTab, setActiveTab] = useState<'biomarkers' | 'prognosis' | 'plan'>('prognosis');
  const [copied, setCopied] = useState(false);

  const analysis = patient.analysis;
  const riskLevel = patient.risk_level || analysis?.risk_level || 'Moderate';
  const healthScore = patient.health_score || analysis?.health_score || 72;
  const modelName = 'AI Powered';

  const handleCopyReport = () => {
    let report = `MedPulse AI Clinical Diagnostic Report\n`;
    report += `====================================\n`;
    report += `Patient: ${patient.full_name} (ID: #${patient.id})\n`;
    report += `DOB: ${patient.date_of_birth} | Age: ${patient.age || 'N/A'} | Email: ${patient.email}\n`;
    report += `Health Index: ${healthScore}/100 | Risk Level: ${riskLevel}\n\n`;
    report += `Laboratory Measurements:\n`;
    report += `- Fasting Glucose: ${patient.glucose} mg/dL (Ref: 70-99 mg/dL)\n`;
    report += `- Haemoglobin: ${patient.haemoglobin} g/dL (Ref: 12.0-17.5 g/dL)\n`;
    report += `- Total Cholesterol: ${patient.cholesterol} mg/dL (Ref: <200 mg/dL)\n\n`;
    report += `AI Risk Prognosis (${modelName}):\n`;
    report += `${analysis?.summary || patient.remarks}\n\n`;

    if (analysis) {
      report += `Metabolic/Diabetes Risk: [${analysis.diabetes_risk.level}] ${analysis.diabetes_risk.assessment}\n`;
      report += `Cardiovascular Risk: [${analysis.cardiovascular_risk.level}] ${analysis.cardiovascular_risk.assessment}\n`;
      report += `Hematologic Risk: [${analysis.anemia_risk.level}] ${analysis.anemia_risk.assessment}\n\n`;
      report += `Clinical Care Plan (Protocol: ${analysis.urgency}):\n`;
      analysis.recommendations.forEach((r, idx) => {
        report += `${idx + 1}. ${r}\n`;
      });
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isHighRisk = riskLevel === 'High' || riskLevel === 'Critical';

  return (
    <div className="modal-overlay" onClick={onClose} id="patient-detail-modal-overlay">
      <div
        className="modal-content detail-modal-content"
        onClick={(e) => e.stopPropagation()}
        id="patient-detail-modal"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="detail-header-info">
            <div className="patient-avatar lg">
              {patient.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="detail-title-row">
                <h2 className="modal-title">{patient.full_name}</h2>
                <span className="detail-id-badge">ID #{patient.id}</span>
                <span className={`risk-score-pill ${isHighRisk ? 'pill-high' : riskLevel === 'Moderate' ? 'pill-moderate' : 'pill-optimal'}`}>
                  {riskLevel} Risk
                </span>
                <span className="badge badge-score">
                  <Award size={11} /> Score: {healthScore}/100
                </span>
              </div>
              <div className="detail-meta-row">
                <span className="meta-item">
                  <Mail size={13} /> {patient.email}
                </span>
                <span className="meta-item">
                  <Calendar size={13} /> DOB: {patient.date_of_birth} {patient.age ? `(${patient.age} yrs)` : ''}
                </span>
                {patient.created_at && (
                  <span className="meta-item">
                    <Clock size={13} /> Enrolled: {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
            aria-label="Close modal"
            id="btn-close-detail-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="detail-modal-tabs">
          <button
            className={`detail-tab-btn ${activeTab === 'prognosis' ? 'active' : ''}`}
            onClick={() => setActiveTab('prognosis')}
          >
            <Sparkles size={14} /> AI Risk Prognosis
          </button>
          <button
            className={`detail-tab-btn ${activeTab === 'biomarkers' ? 'active' : ''}`}
            onClick={() => setActiveTab('biomarkers')}
          >
            <Layers size={14} /> Biomarker Diagnostics
          </button>
          <button
            className={`detail-tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            <CheckSquare size={14} /> Clinical Care Plan
          </button>
        </div>

        <div className="modal-body-padded">
          {/* TAB 1: AI Risk Prognosis */}
          {activeTab === 'prognosis' && (
            <div className="detail-tab-content">
              {/* Risk Level Banner */}
              <div className={`risk-status-banner ${isHighRisk ? 'banner-high' : riskLevel === 'Moderate' ? 'banner-moderate' : 'banner-normal'}`}>
                {isHighRisk ? (
                  <>
                    <ShieldAlert size={22} />
                    <div>
                      <strong>Elevated Clinical Risk Profile ({riskLevel})</strong>
                      <p>Laboratory biomarkers show significant deviations from desirable metabolic or cardiovascular baselines.</p>
                    </div>
                  </>
                ) : riskLevel === 'Moderate' ? (
                  <>
                    <AlertTriangle size={22} />
                    <div>
                      <strong>Moderate / Borderline Risk Profile</strong>
                      <p>Early-stage biomarker shifts detected. Lifestyle modifications and preventive monitoring advised.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={22} />
                    <div>
                      <strong>Favorable Biomarker Parameters</strong>
                      <p>Blood metrics align with expected clinical health targets. Routine preventive care recommended.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Executive Summary */}
              <div className="detail-executive-summary">
                <div className="summary-title-row">
                  <span className="summary-title-label">Clinical Synthesis ({modelName}):</span>
                </div>
                <p className="summary-body-text">
                  {analysis?.summary || patient.remarks}
                </p>
              </div>

              {/* Structured Multi-Risk Cards */}
              {analysis && (
                <div className="modal-risks-grid">
                  <div className="modal-risk-card">
                    <div className="modal-risk-top">
                      <div className="stat-icon-wrap amber">
                        <Droplets size={16} />
                      </div>
                      <div>
                        <span className="risk-title">Metabolic / Diabetes Risk</span>
                        <span className={`risk-level-tag tag-${analysis.diabetes_risk.level.toLowerCase()}`}>
                          {analysis.diabetes_risk.level}
                        </span>
                      </div>
                    </div>
                    <p className="modal-risk-text">{analysis.diabetes_risk.assessment}</p>
                  </div>

                  <div className="modal-risk-card">
                    <div className="modal-risk-top">
                      <div className="stat-icon-wrap rose">
                        <HeartPulse size={16} />
                      </div>
                      <div>
                        <span className="risk-title">Cardiovascular Risk</span>
                        <span className={`risk-level-tag tag-${analysis.cardiovascular_risk.level.toLowerCase()}`}>
                          {analysis.cardiovascular_risk.level}
                        </span>
                      </div>
                    </div>
                    <p className="modal-risk-text">{analysis.cardiovascular_risk.assessment}</p>
                  </div>

                  <div className="modal-risk-card">
                    <div className="modal-risk-top">
                      <div className="stat-icon-wrap cyan">
                        <Activity size={16} />
                      </div>
                      <div>
                        <span className="risk-title">Hematologic Status</span>
                        <span className={`risk-level-tag tag-${analysis.anemia_risk.level.toLowerCase()}`}>
                          {analysis.anemia_risk.level}
                        </span>
                      </div>
                    </div>
                    <p className="modal-risk-text">{analysis.anemia_risk.assessment}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Biomarker Diagnostics */}
          {activeTab === 'biomarkers' && (
            <div className="detail-tab-content">
              <div className="biomarkers-cards-grid">
                {/* Glucose Card */}
                <div className="biomarker-card">
                  <div className="biomarker-card-top">
                    <div className="stat-icon-wrap amber">
                      <Droplets size={16} />
                    </div>
                    <span className="biomarker-name">Fasting Glucose</span>
                  </div>
                  <div className="biomarker-value-row">
                    <span className="biomarker-num">{patient.glucose}</span>
                    <span className="biomarker-unit">mg/dL</span>
                  </div>
                  <div className="biomarker-progress-bar">
                    <div
                      className={`biomarker-progress-fill ${
                        patient.glucose >= 126 ? 'fill-rose' : patient.glucose >= 100 ? 'fill-amber' : 'fill-emerald'
                      }`}
                      style={{ width: `${Math.min(100, (patient.glucose / 220) * 100)}%` }}
                    />
                  </div>
                  <span className="biomarker-ref-note">
                    Normal: 70 - 99 mg/dL &bull; Diabetes &ge; 126
                  </span>
                </div>

                {/* Haemoglobin Card */}
                <div className="biomarker-card">
                  <div className="biomarker-card-top">
                    <div className="stat-icon-wrap cyan">
                      <Activity size={16} />
                    </div>
                    <span className="biomarker-name">Haemoglobin</span>
                  </div>
                  <div className="biomarker-value-row">
                    <span className="biomarker-num">{patient.haemoglobin}</span>
                    <span className="biomarker-unit">g/dL</span>
                  </div>
                  <div className="biomarker-progress-bar">
                    <div
                      className={`biomarker-progress-fill ${
                        patient.haemoglobin < 12.0 ? 'fill-rose' : patient.haemoglobin > 17.5 ? 'fill-amber' : 'fill-emerald'
                      }`}
                      style={{ width: `${Math.min(100, (patient.haemoglobin / 20) * 100)}%` }}
                    />
                  </div>
                  <span className="biomarker-ref-note">
                    Normal: 12.0 - 17.5 g/dL &bull; Low &lt; 12
                  </span>
                </div>

                {/* Cholesterol Card */}
                <div className="biomarker-card">
                  <div className="biomarker-card-top">
                    <div className="stat-icon-wrap emerald">
                      <HeartPulse size={16} />
                    </div>
                    <span className="biomarker-name">Total Cholesterol</span>
                  </div>
                  <div className="biomarker-value-row">
                    <span className="biomarker-num">{patient.cholesterol}</span>
                    <span className="biomarker-unit">mg/dL</span>
                  </div>
                  <div className="biomarker-progress-bar">
                    <div
                      className={`biomarker-progress-fill ${
                        patient.cholesterol >= 240 ? 'fill-rose' : patient.cholesterol >= 200 ? 'fill-amber' : 'fill-emerald'
                      }`}
                      style={{ width: `${Math.min(100, (patient.cholesterol / 300) * 100)}%` }}
                    />
                  </div>
                  <span className="biomarker-ref-note">
                    Desirable: &lt; 200 mg/dL &bull; High &ge; 240
                  </span>
                </div>
              </div>

              {/* Reference Intervals Table */}
              <div className="ref-intervals-table-box">
                <span className="ref-table-title">Clinical Diagnostic Baselines &amp; Cutoffs</span>
                <table className="mini-ref-table">
                  <thead>
                    <tr>
                      <th>Biomarker</th>
                      <th>Optimal Target</th>
                      <th>Borderline Zone</th>
                      <th>Critical / High Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Fasting Blood Glucose</td>
                      <td>70 - 99 mg/dL</td>
                      <td>100 - 125 mg/dL (Prediabetes)</td>
                      <td>&ge; 126 mg/dL (Type 2 Diabetes)</td>
                    </tr>
                    <tr>
                      <td>Haemoglobin (Hb)</td>
                      <td>12.0 - 17.5 g/dL</td>
                      <td>&gt; 17.5 g/dL (Polycythemia)</td>
                      <td>&lt; 12.0 g/dL (Anemia)</td>
                    </tr>
                    <tr>
                      <td>Total Cholesterol</td>
                      <td>&lt; 200 mg/dL</td>
                      <td>200 - 239 mg/dL (Borderline)</td>
                      <td>&ge; 240 mg/dL (Hypercholesterolemia)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Clinical Care Plan */}
          {activeTab === 'plan' && (
            <div className="detail-tab-content">
              {analysis?.urgency && (
                <div className="urgency-banner">
                  <Clock size={16} color="#06b6d4" />
                  <span>Clinical Followup Protocol: <strong>{analysis.urgency}</strong></span>
                </div>
              )}

              <div className="care-plan-list">
                {analysis?.recommendations && analysis.recommendations.length > 0 ? (
                  analysis.recommendations.map((rec, i) => (
                    <div key={i} className="care-plan-item">
                      <div className="care-plan-number">{i + 1}</div>
                      <div className="care-plan-content">
                        <span className="care-plan-text">{rec}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No explicit care recommendations recorded.</p>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="modal-footer-actions" style={{ marginTop: 24 }}>
            <button
              className="btn btn-danger-ghost btn-sm"
              onClick={() => {
                onClose();
                onDelete(patient);
              }}
              id="btn-delete-from-detail"
            >
              <Trash2 size={14} /> Delete Record
            </button>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handlePrint}
                title="Print clinical report"
              >
                <Printer size={14} /> Print
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyReport}
                id="btn-copy-modal-remarks"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onReanalyze(patient.id)}
                disabled={isReanalyzing}
                id="btn-reanalyze-modal"
              >
                <Sparkles size={14} className={isReanalyzing ? 'animate-spin' : ''} />
                <span>{isReanalyzing ? 'Evaluating...' : 'Re-analyze (AI Powered)'}</span>
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onEdit(patient);
                }}
                id="btn-edit-from-detail"
              >
                <Edit2 size={14} /> Edit Record
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
