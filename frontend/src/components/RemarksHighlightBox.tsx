import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  Eye,
  AlertTriangle,
  HeartPulse,
  Droplets,
  Activity,
  CheckSquare,
  Award,
} from 'lucide-react';
import type { Patient } from '../types';

interface RemarksHighlightBoxProps {
  patient: Patient;
  onDismiss: () => void;
  onViewDetails?: (patient: Patient) => void;
}

export const RemarksHighlightBox: React.FC<RemarksHighlightBoxProps> = ({
  patient,
  onDismiss,
  onViewDetails,
}) => {
  const [copied, setCopied] = useState(false);

  const analysis = patient.analysis;
  const riskLevel = patient.risk_level || analysis?.risk_level || 'Moderate';
  const healthScore = patient.health_score || analysis?.health_score || 70;
  const modelName = 'AI Powered';

  const handleCopyReport = () => {
    let report = `MedPulse AI Health Risk Assessment for ${patient.full_name}\n`;
    report += `DOB: ${patient.date_of_birth} | Glucose: ${patient.glucose} mg/dL | Hb: ${patient.haemoglobin} g/dL | Chol: ${patient.cholesterol} mg/dL\n`;
    report += `Overall Risk Level: ${riskLevel} (Health Score: ${healthScore}/100)\n`;
    report += `Summary: ${patient.remarks || analysis?.summary}\n\n`;

    if (analysis) {
      report += `Diabetes Risk: [${analysis.diabetes_risk.level}] ${analysis.diabetes_risk.assessment}\n`;
      report += `Cardiovascular Risk: [${analysis.cardiovascular_risk.level}] ${analysis.cardiovascular_risk.assessment}\n`;
      report += `Anemia Risk: [${analysis.anemia_risk.level}] ${analysis.anemia_risk.assessment}\n\n`;
      report += `Clinical Recommendations:\n`;
      analysis.recommendations.forEach((r, idx) => {
        report += `${idx + 1}. ${r}\n`;
      });
      report += `Urgency: ${analysis.urgency}\n`;
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskBadge = (lvl: string) => {
    switch (lvl) {
      case 'Critical':
      case 'High':
        return (
          <span className="badge badge-high pulse-glow-badge">
            <ShieldAlert size={12} /> {lvl} Risk Flagged
          </span>
        );
      case 'Moderate':
        return (
          <span className="badge badge-borderline">
            <AlertTriangle size={12} /> Moderate Risk
          </span>
        );
      default:
        return (
          <span className="badge badge-normal">
            <ShieldCheck size={12} /> Favorable / Optimal
          </span>
        );
    }
  };

  return (
    <div className="remarks-highlight-card glass-panel" id="ai-remarks-highlight-box">
      {/* Top Header */}
      <div className="remarks-header">
        <div className="remarks-title-area">
          <div className="sparkle-circle animate-pulse">
            <Sparkles className="sparkle-icon" size={22} />
          </div>
          <div>
            <div className="remarks-badge-row">
              <span className="badge badge-ai pulse-glow-badge">
                <Sparkles size={11} /> {modelName}
              </span>
              <span className="badge badge-cyan">New Patient Saved</span>
              {getRiskBadge(riskLevel)}
              <span className="badge badge-score">
                <Award size={11} /> Health Score: {healthScore}/100
              </span>
            </div>
            <h3 className="remarks-heading">
              Structured Health Risk Prognosis for {patient.full_name}
            </h3>
          </div>
        </div>

        <div className="remarks-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopyReport}
            title="Copy structured clinical report"
            id="btn-copy-remarks"
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Report' : 'Copy Report'}</span>
          </button>
          {onViewDetails && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onViewDetails(patient)}
              title="Inspect complete record and meters"
              id="btn-view-submitted-patient"
            >
              <Eye size={14} />
              <span>Diagnostic Center</span>
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onDismiss}
            aria-label="Dismiss highlight box"
            id="btn-dismiss-remarks"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="remarks-summary-callout">
        <p className="remarks-summary-text">
          {analysis?.summary || patient.remarks}
        </p>
      </div>

      {/* Structured Multi-Risk Cards Grid */}
      {analysis && (
        <div className="remarks-risk-grid">
          {/* Metabolic / Diabetes Risk */}
          <div className="risk-metric-box">
            <div className="risk-box-top">
              <div className="risk-box-icon amber">
                <Droplets size={16} />
              </div>
              <div>
                <span className="risk-box-label">Metabolic &amp; Glycemic Risk</span>
                <span className={`risk-level-tag tag-${analysis.diabetes_risk.level.toLowerCase()}`}>
                  {analysis.diabetes_risk.level}
                </span>
              </div>
            </div>
            <p className="risk-box-desc">{analysis.diabetes_risk.assessment}</p>
          </div>

          {/* Cardiovascular Risk */}
          <div className="risk-metric-box">
            <div className="risk-box-top">
              <div className="risk-box-icon rose">
                <HeartPulse size={16} />
              </div>
              <div>
                <span className="risk-box-label">Cardiovascular Risk</span>
                <span className={`risk-level-tag tag-${analysis.cardiovascular_risk.level.toLowerCase()}`}>
                  {analysis.cardiovascular_risk.level}
                </span>
              </div>
            </div>
            <p className="risk-box-desc">{analysis.cardiovascular_risk.assessment}</p>
          </div>

          {/* Hematologic / Anemia Risk */}
          <div className="risk-metric-box">
            <div className="risk-box-top">
              <div className="risk-box-icon cyan">
                <Activity size={16} />
              </div>
              <div>
                <span className="risk-box-label">Hematologic Status</span>
                <span className={`risk-level-tag tag-${analysis.anemia_risk.level.toLowerCase()}`}>
                  {analysis.anemia_risk.level}
                </span>
              </div>
            </div>
            <p className="risk-box-desc">{analysis.anemia_risk.assessment}</p>
          </div>
        </div>
      )}

      {/* Actionable Clinical Recommendations */}
      {analysis?.recommendations && analysis.recommendations.length > 0 && (
        <div className="remarks-recs-container">
          <div className="recs-header">
            <CheckSquare size={15} color="#06b6d4" />
            <span className="recs-title">Actionable Clinical Care Plan:</span>
            {analysis.urgency && (
              <span className="recs-urgency-badge">
                Protocol: {analysis.urgency}
              </span>
            )}
          </div>
          <div className="recs-list">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="rec-item">
                <div className="rec-bullet" />
                <span className="rec-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
