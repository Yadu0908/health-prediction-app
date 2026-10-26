import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Droplets,
  Activity,
  HeartPulse,
  Sparkles,
  AlertCircle,
  Save,
} from 'lucide-react';
import type { Patient, PatientFormData, FormValidationErrors } from '../types';
import { validateField, validatePatientForm } from '../validation';
import { api } from '../api';
import { DatePickerPopover } from './DatePickerPopover';


interface EditPatientModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdated: (updatedPatient: Patient) => void;
  onError: (errorMessage: string) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  patient,
  onClose,
  onUpdated,
  onError,
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    full_name: patient.full_name,
    date_of_birth: patient.date_of_birth,
    email: patient.email,
    glucose: patient.glucose.toString(),
    haemoglobin: patient.haemoglobin.toString(),
    cholesterol: patient.cholesterol.toString(),
  });

  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      onError('Please correct the validation errors before saving.');
      return;
    }

    try {
      setIsSubmitting(true);

      const updated = await api.updatePatient(patient.id, {
        full_name: formData.full_name.trim(),
        date_of_birth: formData.date_of_birth.trim(),
        email: formData.email.trim().toLowerCase(),
        glucose: parseFloat(formData.glucose),
        haemoglobin: parseFloat(formData.haemoglobin),
        cholesterol: parseFloat(formData.cholesterol),
      });

      onUpdated(updated);
    } catch (err: any) {
      const msg = err.message || 'Failed to update patient record';
      onError(msg);
      setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="edit-patient-modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        id="edit-patient-modal"
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit Patient Record</h2>
            <p className="modal-subtitle">ID #{patient.id} — Modify demographic or clinical values</p>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
            aria-label="Close modal"
            id="btn-close-edit-modal"
          >
            <X size={18} />
          </button>
        </div>

        {errors.general && (
          <div className="alert-box alert-danger" style={{ margin: '16px 24px 0 24px' }}>
            <AlertCircle size={16} />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="modal-form-body">
          <div className="form-grid-2">
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-full-name">
                <span>Full Name <span className="required-star">*</span></span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={16} /></span>
                <input
                  id="edit-full-name"
                  type="text"
                  className={`form-input has-icon ${errors.full_name && touched.full_name ? 'input-error' : ''}`}
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  onBlur={() => handleBlur('full_name')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.full_name && touched.full_name && (
                <span className="error-message"><AlertCircle size={12} /> {errors.full_name}</span>
              )}
            </div>

            {/* Date of Birth */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-dob">
                <span>Date of Birth <span className="required-star">*</span></span>
                <span className="form-label-hint">Click calendar icon to pick</span>
              </label>
              <DatePickerPopover
                id="edit-dob"
                value={formData.date_of_birth}
                onChange={(val) => handleChange('date_of_birth', val)}
                onBlur={() => handleBlur('date_of_birth')}
                hasError={Boolean(errors.date_of_birth && touched.date_of_birth)}
                disabled={isSubmitting}
                placeholder="DD/MM/YYYY"
              />
              {errors.date_of_birth && touched.date_of_birth && (
                <span className="error-message"><AlertCircle size={12} /> {errors.date_of_birth}</span>
              )}
            </div>

          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-email">
              <span>Email Address <span className="required-star">*</span></span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={16} /></span>
              <input
                id="edit-email"
                type="email"
                className={`form-input has-icon ${errors.email && touched.email ? 'input-error' : ''}`}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && touched.email && (
              <span className="error-message"><AlertCircle size={12} /> {errors.email}</span>
            )}
          </div>

          {/* Biomarkers */}
          <div className="biomarkers-section-label" style={{ marginTop: 12 }}>
            <Activity size={14} color="#06b6d4" />
            <span>Blood Laboratory Measurements</span>
          </div>

          <div className="form-grid-3">
            {/* Glucose */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-glucose">
                <span>Glucose (mg/dL) <span className="required-star">*</span></span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><Droplets size={16} /></span>
                <input
                  id="edit-glucose"
                  type="number"
                  step="0.1"
                  min="1"
                  className={`form-input has-icon ${errors.glucose && touched.glucose ? 'input-error' : ''}`}
                  value={formData.glucose}
                  onChange={(e) => handleChange('glucose', e.target.value)}
                  onBlur={() => handleBlur('glucose')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.glucose && touched.glucose && (
                <span className="error-message"><AlertCircle size={12} /> {errors.glucose}</span>
              )}
            </div>

            {/* Haemoglobin */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-haemoglobin">
                <span>Hb (g/dL) <span className="required-star">*</span></span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><Activity size={16} /></span>
                <input
                  id="edit-haemoglobin"
                  type="number"
                  step="0.1"
                  min="1"
                  className={`form-input has-icon ${errors.haemoglobin && touched.haemoglobin ? 'input-error' : ''}`}
                  value={formData.haemoglobin}
                  onChange={(e) => handleChange('haemoglobin', e.target.value)}
                  onBlur={() => handleBlur('haemoglobin')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.haemoglobin && touched.haemoglobin && (
                <span className="error-message"><AlertCircle size={12} /> {errors.haemoglobin}</span>
              )}
            </div>

            {/* Cholesterol */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-cholesterol">
                <span>Chol (mg/dL) <span className="required-star">*</span></span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><HeartPulse size={16} /></span>
                <input
                  id="edit-cholesterol"
                  type="number"
                  step="0.1"
                  min="1"
                  className={`form-input has-icon ${errors.cholesterol && touched.cholesterol ? 'input-error' : ''}`}
                  value={formData.cholesterol}
                  onChange={(e) => handleChange('cholesterol', e.target.value)}
                  onBlur={() => handleBlur('cholesterol')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.cholesterol && touched.cholesterol && (
                <span className="error-message"><AlertCircle size={12} /> {errors.cholesterol}</span>
              )}
            </div>
          </div>

          <div className="edit-info-callout">
            <Sparkles size={14} color="#06b6d4" />
            <span>
              Modifying blood laboratory values will automatically trigger AI Powered re-evaluation of the multi-system clinical risk prognosis.
            </span>
          </div>


          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              id="btn-cancel-edit"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="btn-save-edit"
            >
              {isSubmitting ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  <span>Updating & Re-analyzing...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
