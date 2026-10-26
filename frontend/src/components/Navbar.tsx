import React from 'react';
import { Activity, Plus, RefreshCw, Users, Cpu } from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  patientCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onRefresh,
  isRefreshing,
  patientCount,
}) => {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-brand">
          <div className="logo-badge">
            <Activity className="logo-icon" size={22} />
          </div>
          <div className="brand-text-col">
            <div className="brand-title-wrap">
              <span className="brand-title">MedPulse</span>
              <span className="brand-accent">AI</span>
              <span className="badge badge-ai pulse-glow-badge nav-model-badge">
                <Cpu size={11} /> AI Powered
              </span>
            </div>
            <p className="brand-subtitle">Clinical Biomarker Analytics &amp; Risk Prediction</p>
          </div>
        </div>

        <div className="navbar-actions">
          <span className="badge badge-cyan nav-counter-badge">
            <Users size={12} />
            <span>{patientCount} {patientCount === 1 ? 'Patient' : 'Patients'}</span>
          </span>

          <button
            id="btn-refresh-data"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sync patient directory"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            id="btn-add-patient-header"
            className="btn btn-primary btn-sm btn-glow"
            onClick={onOpenAddModal}
          >
            <Plus size={15} />
            <span>Register Patient</span>
          </button>
        </div>
      </div>
    </header>
  );
};
