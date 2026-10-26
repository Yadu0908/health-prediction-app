import React, { useState, useMemo } from 'react';
import {
  User,
  Mail,
  Droplets,
  Activity,
  HeartPulse,
  Sparkles,
  AlertCircle,
  Wand2,
  Gauge,
  TrendingUp,
} from 'lucide-react';

import type { Patient, PatientFormData, FormValidationErrors } from '../types';
import { validateField, validatePatientForm } from '../validation';
import { api } from '../api';
import { DatePickerPopover } from './DatePickerPopover';


interface AddPatientFormProps {
  onSuccess: (newPatient: Patient) => void;
  onError: (errorMessage: string) => void;
}

const INITIAL_FORM: PatientFormData = {
  full_name: '',
  date_of_birth: '',
  email: '',
  glucose: '',
  haemoglobin: '',
  cholesterol: '',
};

export const AddPatientForm: React.FC<AddPatientFormProps> = ({
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<PatientFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live biomarker calculations for interactive preview
  const liveAnalysis = useMemo(() => {
    const g = parseFloat(formData.glucose);
    const h = parseFloat(formData.haemoglobin);
    const c = parseFloat(formData.cholesterol);

    const hasGlucose = !isNaN(g) && g > 0;
    const hasHb = !isNaN(h) && h > 0;
    const hasChol = !isNaN(c) && c > 0;

    let score = 100;
    let glucoseStatus = 'Pending';
    let hbStatus = 'Pending';
    let cholStatus = 'Pending';

    if (hasGlucose) {
      if (g < 70) {
        glucoseStatus = 'Hypoglycemia (<70)';
        score -= 20;
      } else if (g <= 99) {
        glucoseStatus = 'Normal (70-99)';
      } else if (g <= 125) {
        glucoseStatus = 'Prediabetes (100-125)';
        score -= 25;
      } else {
        glucoseStatus = 'High Risk Diabetes (≥126)';
        score -= 40;
      }
    }

    if (hasHb) {
      if (h < 12.0) {
        hbStatus = 'Low / Anemia (<12.0)';
        score -= 25;
      } else if (h <= 17.5) {
        hbStatus = 'Normal (12.0-17.5)';
      } else {
        hbStatus = 'Elevated (>17.5)';
        score -= 15;
      }
    }

    if (hasChol) {
      if (c < 200) {
        cholStatus = 'Desirable (<200)';
      } else if (c <= 239) {
        cholStatus = 'Borderline (200-239)';
        score -= 20;
      } else {
        cholStatus = 'High Risk (≥240)';
        score -= 35;
      }
    }

    const calculatedScore = Math.max(10, Math.min(100, score));
    const isReady = hasGlucose || hasHb || hasChol;

    return {
      hasGlucose,
      hasHb,
      hasChol,
      isReady,
      score: calculatedScore,
      glucoseStatus,
      hbStatus,
      cholStatus,
      g,
      h,
      c,
    };
  }, [formData.glucose, formData.haemoglobin, formData.cholesterol]);

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const fieldError = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleBlur = (field: keyof PatientFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const loadPreset = (presetType: 'healthy' | 'diabetic' | 'anemic' | 'borderline') => {
    const timestamp = Math.floor(Math.random() * 900) + 100;
    if (presetType === 'healthy') {
      setFormData({
        full_name: 'Elena Rostova',
        date_of_birth: '14/06/1992',
        email: `elena.rostova${timestamp}@medcare.org`,
        glucose: '88',
        haemoglobin: '14.2',
        cholesterol: '175',
      });
    } else if (presetType === 'diabetic') {
      setFormData({
        full_name: 'Marcus Vance',
        date_of_birth: '22/10/1981',
        email: `marcus.vance${timestamp}@healthlink.net`,
        glucose: '168',
        haemoglobin: '13.5',
        cholesterol: '255',
      });
    } else if (presetType === 'anemic') {
      setFormData({
        full_name: 'Clara Oswald',
        date_of_birth: '05/03/1998',
        email: `clara.oswald${timestamp}@tardis.med`,
        glucose: '92',
        haemoglobin: '10.4',
        cholesterol: '190',
      });
    } else {
      setFormData({
        full_name: 'Julian Hayes',
        date_of_birth: '19/08/1975',
        email: `julian.hayes${timestamp}@biocare.io`,
        glucose: '114',
        haemoglobin: '13.8',
        cholesterol: '228',
      });
    }
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched: Record<string, boolean> = {
      full_name: true,
      date_of_birth: true,
      email: true,
      glucose: true,
      haemoglobin: true,
      cholesterol: true,
    };
    setTouched(allTouched);

    const validation = validatePatientForm(formData);
    setErrors(validation.errors);

    if (!validation.isValid) {
      onError('Please correct the validation errors before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      const createdPatient = await api.createPatient({
        full_name: formData.full_name.trim(),
        date_of_birth: formData.date_of_birth.trim(),
        email: formData.email.trim().toLowerCase(),
        glucose: parseFloat(formData.glucose),
        haemoglobin: parseFloat(formData.haemoglobin),
        cholesterol: parseFloat(formData.cholesterol),
      });

      setFormData(INITIAL_FORM);
      setTouched({});
      setErrors({});

      onSuccess(createdPatient);
    } catch (err: any) {
      const message = err.message || 'Failed to register patient';
      onError(message);
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-patient-card glass-panel" id="add-patient-section">
      <div className="card-header-row">
        <div>
          <div className="card-title-badge-row">
            <h2 className="card-title">Register Patient & AI Diagnostics</h2>
            <span className="badge badge-ai pulse-glow-badge">
              <Sparkles size={11} /> AI Powered
            </span>
          </div>
          <p className="card-subtitle">
            Provide patient demographics and blood test markers for instant multi-system risk evaluation.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="presets-wrapper">
          <span className="preset-label">
            <Wand2 size={13} /> Quick Fill Presets:
          </span>
          <button
            type="button"
            className="preset-chip chip-optimal"
            onClick={() => loadPreset('healthy')}
            title="Load optimal profile"
            id="preset-healthy-btn"
          >
            Optimal
          </button>
          <button
            type="button"
            className="preset-chip chip-borderline"
            onClick={() => loadPreset('borderline')}
            title="Load borderline profile"
            id="preset-borderline-btn"
          >
            Borderline
          </button>
          <button
            type="button"
            className="preset-chip chip-high"
            onClick={() => loadPreset('diabetic')}
            title="Load high glucose profile"
            id="preset-diabetic-btn"
          >
            Diabetic
          </button>
          <button
            type="button"
            className="preset-chip chip-warn"
            onClick={() => loadPreset('anemic')}
            title="Load anemic profile"
            id="preset-anemic-btn"
          >
            Anemic
          </button>
        </div>
      </div>

      {errors.general && (
        <div className="alert-box alert-danger" id="form-general-error">
          <AlertCircle size={16} />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate id="add-patient-form">
        <div className="form-layout-split">
          {/* Left Column: Form Inputs */}
          <div className="form-inputs-col">
            <div className="form-grid-2">
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-full-name">
                  <span>
                    Full Name <span className="required-star">*</span>
                  </span>
                  <span className="form-label-hint">Patient identity</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <User size={16} />
                  </span>
                  <input
                    id="input-full-name"
                    name="full_name"
                    type="text"
                    className={`form-input has-icon ${errors.full_name && touched.full_name ? 'input-error' : ''}`}
                    placeholder="e.g. Eleanor Vance"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    onBlur={() => handleBlur('full_name')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.full_name && touched.full_name && (
                  <span className="error-message" id="error-full-name">
                    <AlertCircle size={12} /> {errors.full_name}
                  </span>
                )}
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-dob">
                  <span>
                    Date of Birth <span className="required-star">*</span>
                  </span>
                  <span className="form-label-hint">Click calendar icon to pick</span>
                </label>
                <DatePickerPopover
                  id="input-dob"
                  value={formData.date_of_birth}
                  onChange={(val) => handleChange('date_of_birth', val)}
                  onBlur={() => handleBlur('date_of_birth')}
                  hasError={Boolean(errors.date_of_birth && touched.date_of_birth)}
                  disabled={isSubmitting}
                  placeholder="DD/MM/YYYY (click calendar to pick)"
                />
                {errors.date_of_birth && touched.date_of_birth && (
                  <span className="error-message" id="error-dob">
                    <AlertCircle size={12} /> {errors.date_of_birth}
                  </span>
                )}
              </div>

            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-email">
                <span>
                  Email Address <span className="required-star">*</span>
                </span>
                <span className="form-label-hint">Unique medical record identifier</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="input-email"
                  name="email"
                  type="email"
                  className={`form-input has-icon ${errors.email && touched.email ? 'input-error' : ''}`}
                  placeholder="patient@domain.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && touched.email && (
                <span className="error-message" id="error-email">
                  <AlertCircle size={12} /> {errors.email}
                </span>
              )}
            </div>

            {/* Biomarkers 3 Inputs */}
            <div className="biomarkers-section-label">
              <Activity size={14} color="#06b6d4" />
              <span>Laboratory Blood Measurements</span>
            </div>

            <div className="form-grid-3">
              {/* Glucose */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-glucose">
                  <span>
                    Fasting Glucose <span className="required-star">*</span>
                  </span>
                  <span className="form-label-hint">mg/dL</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Droplets size={16} />
                  </span>
                  <input
                    id="input-glucose"
                    name="glucose"
                    type="number"
                    step="0.1"
                    min="1"
                    className={`form-input has-icon ${errors.glucose && touched.glucose ? 'input-error' : ''}`}
                    placeholder="70 - 99"
                    value={formData.glucose}
                    onChange={(e) => handleChange('glucose', e.target.value)}
                    onBlur={() => handleBlur('glucose')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.glucose && touched.glucose && (
                  <span className="error-message" id="error-glucose">
                    <AlertCircle size={12} /> {errors.glucose}
                  </span>
                )}
              </div>

              {/* Haemoglobin */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-haemoglobin">
                  <span>
                    Haemoglobin <span className="required-star">*</span>
                  </span>
                  <span className="form-label-hint">g/dL</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Activity size={16} />
                  </span>
                  <input
                    id="input-haemoglobin"
                    name="haemoglobin"
                    type="number"
                    step="0.1"
                    min="1"
                    className={`form-input has-icon ${errors.haemoglobin && touched.haemoglobin ? 'input-error' : ''}`}
                    placeholder="12.0 - 17.5"
                    value={formData.haemoglobin}
                    onChange={(e) => handleChange('haemoglobin', e.target.value)}
                    onBlur={() => handleBlur('haemoglobin')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.haemoglobin && touched.haemoglobin && (
                  <span className="error-message" id="error-haemoglobin">
                    <AlertCircle size={12} /> {errors.haemoglobin}
                  </span>
                )}
              </div>

              {/* Cholesterol */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-cholesterol">
                  <span>
                    Total Cholesterol <span className="required-star">*</span>
                  </span>
                  <span className="form-label-hint">mg/dL</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <HeartPulse size={16} />
                  </span>
                  <input
                    id="input-cholesterol"
                    name="cholesterol"
                    type="number"
                    step="0.1"
                    min="1"
                    className={`form-input has-icon ${errors.cholesterol && touched.cholesterol ? 'input-error' : ''}`}
                    placeholder="< 200"
                    value={formData.cholesterol}
                    onChange={(e) => handleChange('cholesterol', e.target.value)}
                    onBlur={() => handleBlur('cholesterol')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.cholesterol && touched.cholesterol && (
                  <span className="error-message" id="error-cholesterol">
                    <AlertCircle size={12} /> {errors.cholesterol}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Biomarker Visualizer */}
          <div className="live-biomarker-preview-card">
            <div className="live-preview-header">
              <div className="live-header-title">
                <Gauge size={16} color="#06b6d4" />
                <span>Live Biomarker Range Meter</span>
              </div>
              {liveAnalysis.isReady && (
                <span className="live-score-pill" style={{
                  color: liveAnalysis.score >= 80 ? '#34d399' : liveAnalysis.score >= 60 ? '#fbbf24' : '#fb7185',
                  borderColor: liveAnalysis.score >= 80 ? 'rgba(16,185,129,0.3)' : liveAnalysis.score >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)',
                }}>
                  Est. Health Index: {liveAnalysis.score}/100
                </span>
              )}
            </div>

            <p className="live-preview-desc">
              Values update in real time against clinical diagnostic thresholds before AI evaluation.
            </p>

            <div className="live-meters-container">
              {/* Glucose Live Meter */}
              <div className="live-meter-item">
                <div className="live-meter-labels">
                  <span className="meter-name">Glucose</span>
                  <span className="meter-val-tag">
                    {liveAnalysis.hasGlucose ? `${liveAnalysis.g} mg/dL • ${liveAnalysis.glucoseStatus}` : 'Enter value'}
                  </span>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-indicator"
                    style={{
                      left: liveAnalysis.hasGlucose
                        ? `${Math.min(96, Math.max(4, (liveAnalysis.g / 220) * 100))}%`
                        : '0%',
                      background: liveAnalysis.g >= 126 ? '#f43f5e' : liveAnalysis.g >= 100 ? '#f59e0b' : '#10b981',
                    }}
                  />
                  <div className="meter-zone zone-norm" style={{ width: '45%' }} title="Normal: 70-99" />
                  <div className="meter-zone zone-warn" style={{ width: '15%' }} title="Prediabetes: 100-125" />
                  <div className="meter-zone zone-danger" style={{ width: '40%' }} title="Diabetes: ≥126" />
                </div>
                <div className="meter-axis-ticks">
                  <span>0</span>
                  <span>70 Normal</span>
                  <span>100</span>
                  <span>126 Diabetes</span>
                  <span>220+</span>
                </div>
              </div>

              {/* Haemoglobin Live Meter */}
              <div className="live-meter-item">
                <div className="live-meter-labels">
                  <span className="meter-name">Haemoglobin</span>
                  <span className="meter-val-tag">
                    {liveAnalysis.hasHb ? `${liveAnalysis.h} g/dL • ${liveAnalysis.hbStatus}` : 'Enter value'}
                  </span>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-indicator"
                    style={{
                      left: liveAnalysis.hasHb
                        ? `${Math.min(96, Math.max(4, (liveAnalysis.h / 20) * 100))}%`
                        : '0%',
                      background: liveAnalysis.h < 12 ? '#f43f5e' : liveAnalysis.h > 17.5 ? '#f59e0b' : '#10b981',
                    }}
                  />
                  <div className="meter-zone zone-danger" style={{ width: '60%' }} title="Low: <12" />
                  <div className="meter-zone zone-norm" style={{ width: '27.5%' }} title="Normal: 12-17.5" />
                  <div className="meter-zone zone-warn" style={{ width: '12.5%' }} title="High: >17.5" />
                </div>
                <div className="meter-axis-ticks">
                  <span>0</span>
                  <span>12.0 Low (Anemia)</span>
                  <span>17.5 Optimal</span>
                  <span>20 g/dL</span>
                </div>
              </div>

              {/* Cholesterol Live Meter */}
              <div className="live-meter-item">
                <div className="live-meter-labels">
                  <span className="meter-name">Cholesterol</span>
                  <span className="meter-val-tag">
                    {liveAnalysis.hasChol ? `${liveAnalysis.c} mg/dL • ${liveAnalysis.cholStatus}` : 'Enter value'}
                  </span>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-indicator"
                    style={{
                      left: liveAnalysis.hasChol
                        ? `${Math.min(96, Math.max(4, (liveAnalysis.c / 300) * 100))}%`
                        : '0%',
                      background: liveAnalysis.c >= 240 ? '#f43f5e' : liveAnalysis.c >= 200 ? '#f59e0b' : '#10b981',
                    }}
                  />
                  <div className="meter-zone zone-norm" style={{ width: '66%' }} title="Desirable: <200" />
                  <div className="meter-zone zone-warn" style={{ width: '13%' }} title="Borderline: 200-239" />
                  <div className="meter-zone zone-danger" style={{ width: '21%' }} title="High Risk: ≥240" />
                </div>
                <div className="meter-axis-ticks">
                  <span>0</span>
                  <span>200 Desirable</span>
                  <span>240 High Risk</span>
                  <span>300+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="form-actions-bar">
          <div className="form-action-hint">
            <TrendingUp size={14} color="#06b6d4" />
            <span>Submission automatically invokes AI Powered analysis with structured multi-risk classification.</span>
          </div>

          <button
            id="btn-submit-patient"
            type="submit"
            className="btn btn-primary btn-glow"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Sparkles size={16} className="animate-spin" />
                <span>Analyzing Biomarkers with AI Powered engine...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate AI Risk Prediction</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
