import React, { useState, useMemo } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Eye,
  AlertCircle,
  UserX,
  Download,
  Filter,
  ArrowUpDown,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { Patient } from '../types';

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onViewDetails: (patient: Patient) => void;
  onReanalyze: (patientId: number) => void;
  reanalyzingId: number | null;
  activeRiskFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  loading,
  onEdit,
  onDelete,
  onViewDetails,
  onReanalyze,
  reanalyzingId,
  activeRiskFilter = 'All',
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [localRiskFilter, setLocalRiskFilter] = useState<string>(activeRiskFilter);

  const currentRiskFilter = onFilterChange ? activeRiskFilter : localRiskFilter;
  const setRiskFilter = (val: string) => {
    setLocalRiskFilter(val);
    if (onFilterChange) onFilterChange(val);
  };

  // Filter & sort patients
  const processedPatients = useMemo(() => {
    let result = [...patients];

    // Filter by search
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.date_of_birth.includes(q)
      );
    }

    // Filter by risk level
    if (currentRiskFilter !== 'All') {
      if (currentRiskFilter === 'High') {
        result = result.filter((p) => p.risk_level === 'High' || p.risk_level === 'Critical');
      } else {
        result = result.filter((p) => p.risk_level === currentRiskFilter);
      }
    }

    // Filter by Date Section
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') {
        const todayStr = now.toISOString().slice(0, 10);
        result = result.filter((p) => p.created_at && p.created_at.startsWith(todayStr));
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        result = result.filter((p) => new Date(p.created_at) >= sevenDaysAgo);
      } else if (dateFilter === 'month') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        result = result.filter((p) => new Date(p.created_at) >= thirtyDaysAgo);
      } else if (dateFilter === 'senior') {
        result = result.filter((p) => (p.age || 0) >= 60);
      } else if (dateFilter === 'adult') {
        result = result.filter((p) => (p.age || 0) >= 18 && (p.age || 0) < 60);
      } else if (dateFilter === 'youth') {
        result = result.filter((p) => (p.age || 0) < 18);
      }
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case 'score-asc':
        result.sort((a, b) => (a.health_score || 0) - (b.health_score || 0));
        break;
      case 'score-desc':
        result.sort((a, b) => (b.health_score || 0) - (a.health_score || 0));
        break;
      case 'glucose-desc':
        result.sort((a, b) => b.glucose - a.glucose);
        break;
      case 'cholesterol-desc':
        result.sort((a, b) => b.cholesterol - a.cholesterol);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [patients, searchTerm, currentRiskFilter, dateFilter, sortBy]);

  // Counts for filter tabs
  const counts = useMemo(() => {
    const total = patients.length;
    let high = 0;
    let moderate = 0;
    let optimal = 0;

    patients.forEach((p) => {
      const lvl = p.risk_level;
      if (lvl === 'Critical' || lvl === 'High') high++;
      else if (lvl === 'Moderate') moderate++;
      else optimal++;
    });

    return { total, high, moderate, optimal };
  }, [patients]);

  // Export to CSV
  const handleExportCSV = () => {
    if (processedPatients.length === 0) return;

    const headers = [
      'ID',
      'Full Name',
      'DOB',
      'Age',
      'Email',
      'Glucose (mg/dL)',
      'Haemoglobin (g/dL)',
      'Cholesterol (mg/dL)',
      'Risk Level',
      'Health Score',
      'AI Remarks',
    ];

    const rows = processedPatients.map((p) => [
      p.id,
      `"${p.full_name.replace(/"/g, '""')}"`,
      p.date_of_birth,
      p.age || '',
      p.email,
      p.glucose,
      p.haemoglobin,
      p.cholesterol,
      p.risk_level || 'Moderate',
      p.health_score || 70,
      `"${(p.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medpulse_patients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskPill = (level?: string, score?: number) => {
    switch (level) {
      case 'Critical':
      case 'High':
        return (
          <span className="risk-score-pill pill-high" title={`High Risk • Score: ${score || '--'}/100`}>
            <ShieldAlert size={12} />
            <span>{level}</span>
            {score !== undefined && <span className="score-num">{score}</span>}
          </span>
        );
      case 'Moderate':
        return (
          <span className="risk-score-pill pill-moderate" title={`Moderate Risk • Score: ${score || '--'}/100`}>
            <AlertTriangle size={12} />
            <span>Moderate</span>
            {score !== undefined && <span className="score-num">{score}</span>}
          </span>
        );
      default:
        return (
          <span className="risk-score-pill pill-optimal" title={`Optimal Status • Score: ${score || '--'}/100`}>
            <ShieldCheck size={12} />
            <span>Optimal</span>
            {score !== undefined && <span className="score-num">{score}</span>}
          </span>
        );
    }
  };

  const getGlucoseBadge = (val: number) => {
    if (val < 70) return <span className="badge badge-borderline">Low {val}</span>;
    if (val <= 99) return <span className="badge badge-normal">{val}</span>;
    if (val <= 125) return <span className="badge badge-borderline">{val} Prediabetic</span>;
    return <span className="badge badge-high">{val} High</span>;
  };

  const getHaemoglobinBadge = (val: number) => {
    if (val < 12.0) return <span className="badge badge-high">{val} Low</span>;
    if (val <= 17.5) return <span className="badge badge-normal">{val}</span>;
    return <span className="badge badge-borderline">{val} High</span>;
  };

  const getCholesterolBadge = (val: number) => {
    if (val < 200) return <span className="badge badge-normal">{val}</span>;
    if (val <= 239) return <span className="badge badge-borderline">{val} Borderline</span>;
    return <span className="badge badge-high">{val} High</span>;
  };

  return (
    <div className="patient-list-card glass-panel" id="patients-table-section">
      {/* Table Header Bar */}
      <div className="table-header-bar">
        <div>
          <div className="card-title-badge-row">
            <h2 className="card-title">Patient Diagnostic Directory</h2>
            <span className="badge badge-cyan">{processedPatients.length} Records</span>
          </div>
          <p className="card-subtitle">
            Click any row to open the complete clinical Diagnostic Center & biomarker breakdown.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="table-controls-row">
          {/* Search Input */}
          <div className="search-bar-wrap">
            <div className="input-wrapper search-input-wrapper">
              <span className="input-icon">
                <Search size={15} />
              </span>
              <input
                id="search-patients-input"
                type="text"
                className="form-input has-icon search-input"
                placeholder="Search name, email or DOB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date Section Menu Dropdown */}
          <div className="date-filter-select-wrapper">
            <Calendar size={13} className="date-icon" />
            <select
              className="date-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              id="select-date-section-filter"
              aria-label="Filter by Date Section"
            >
              <option value="all">Date: All Records</option>
              <option value="today">Date: Registered Today</option>
              <option value="week">Date: Past 7 Days</option>
              <option value="month">Date: Past 30 Days</option>
              <option value="senior">Demographics: Seniors (60+)</option>
              <option value="adult">Demographics: Adults (18-59)</option>
              <option value="youth">Demographics: Youth (&lt;18)</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sort-select-wrapper">
            <ArrowUpDown size={13} className="sort-icon" />
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              id="select-sort-patients"
              aria-label="Sort Patients"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="score-asc">Sort: Lowest Health Score (Risk)</option>
              <option value="score-desc">Sort: Highest Health Score</option>
              <option value="name">Sort: Full Name (A-Z)</option>
              <option value="glucose-desc">Sort: Highest Glucose</option>
              <option value="cholesterol-desc">Sort: Highest Cholesterol</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            disabled={processedPatients.length === 0}
            title="Export filtered records to CSV"
            id="btn-export-csv"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Risk Filter Chips Bar */}
      <div className="risk-filter-chips-bar">
        <span className="filter-label">
          <Filter size={13} /> Filter Risk:
        </span>
        <button
          className={`filter-chip ${currentRiskFilter === 'All' ? 'active' : ''}`}
          onClick={() => setRiskFilter('All')}
        >
          All ({counts.total})
        </button>
        <button
          className={`filter-chip chip-high ${currentRiskFilter === 'High' ? 'active' : ''}`}
          onClick={() => setRiskFilter('High')}
        >
          <ShieldAlert size={12} /> High / Critical ({counts.high})
        </button>
        <button
          className={`filter-chip chip-moderate ${currentRiskFilter === 'Moderate' ? 'active' : ''}`}
          onClick={() => setRiskFilter('Moderate')}
        >
          <AlertTriangle size={12} /> Moderate ({counts.moderate})
        </button>
        <button
          className={`filter-chip chip-optimal ${currentRiskFilter === 'Optimal' ? 'active' : ''}`}
          onClick={() => setRiskFilter('Optimal')}
        >
          <ShieldCheck size={12} /> Optimal ({counts.optimal})
        </button>
      </div>

      {loading && patients.length === 0 ? (
        <div className="loading-state-box">
          <Sparkles className="animate-spin" size={26} color="#06b6d4" />
          <p>Syncing diagnostic registry from SQLite...</p>
        </div>
      ) : processedPatients.length === 0 ? (
        <div className="empty-state-box" id="empty-patients-state">
          {searchTerm || currentRiskFilter !== 'All' || dateFilter !== 'all' ? (
            <>
              <AlertCircle size={38} color="#64748b" />
              <h3>No matching patient records</h3>
              <p>No records match your current filter and search criteria.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {searchTerm && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </button>
                )}
                {currentRiskFilter !== 'All' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setRiskFilter('All')}>
                    Reset Risk Filter
                  </button>
                )}
                {dateFilter !== 'all' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setDateFilter('all')}>
                    Reset Date Filter
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <UserX size={44} color="#64748b" />
              <h3>No patients enrolled yet</h3>
              <p>Register your first patient above to trigger multi-risk AI predictions.</p>
            </>
          )}
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="medical-table" id="patients-data-table">
            <thead>
              <tr>
                <th>Patient Identity</th>
                <th>DOB / Age</th>
                <th>Risk Profile</th>
                <th>Glucose <span className="th-unit">(mg/dL)</span></th>
                <th>Haemoglobin <span className="th-unit">(g/dL)</span></th>
                <th>Cholesterol <span className="th-unit">(mg/dL)</span></th>
                <th style={{ textAlign: 'right', minWidth: '240px' }} className="actions-header-th">Diagnostic &amp; Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedPatients.map((patient) => {
                const isReanalyzing = reanalyzingId === patient.id;
                return (
                  <tr
                    key={patient.id}
                    id={`patient-row-${patient.id}`}
                    className="table-row-hover table-row-clickable"
                    onClick={() => onViewDetails(patient)}
                    title="Click row to open Diagnostic Center"
                  >
                    <td>
                      <div className="patient-name-cell">
                        <div className="patient-avatar">
                          {patient.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="patient-name-text">{patient.full_name}</span>
                          <span className="patient-email-sub">{patient.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="dob-cell">
                        <span className="dob-text">{patient.date_of_birth}</span>
                        {patient.age && <span className="age-tag">{patient.age} yrs</span>}
                      </div>
                    </td>
                    <td>{getRiskPill(patient.risk_level, patient.health_score)}</td>
                    <td>{getGlucoseBadge(patient.glucose)}</td>
                    <td>{getHaemoglobinBadge(patient.haemoglobin)}</td>
                    <td>{getCholesterolBadge(patient.cholesterol)}</td>
                    <td>
                      <div className="actions-cell">
                        {/* Direct Diagnostic Center button in place of the old column */}
                        <button
                          className="btn-diagnostic-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(patient);
                          }}
                          title="Open Comprehensive AI Diagnostic Center"
                          id={`btn-diagnostic-${patient.id}`}
                        >
                          <Eye size={13} />
                          <span>Diagnostic Center</span>
                        </button>

                        {/* Re-analyze AI */}
                        <button
                          className="btn-action-icon ai"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReanalyze(patient.id);
                          }}
                          disabled={isReanalyzing}
                          title="Re-evaluate with AI Powered engine"
                          id={`btn-reanalyze-${patient.id}`}
                        >
                          <Sparkles size={14} className={isReanalyzing ? 'animate-spin' : ''} />
                        </button>

                        {/* Edit Record */}
                        <button
                          className="btn-action-icon edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(patient);
                          }}
                          title="Edit Patient Information"
                          id={`btn-edit-${patient.id}`}
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Delete Record */}
                        <button
                          className="btn-action-icon delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(patient);
                          }}
                          title="Delete Patient Record"
                          id={`btn-delete-${patient.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
