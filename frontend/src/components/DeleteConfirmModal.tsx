import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { Patient } from '../types';

interface DeleteConfirmModalProps {
  patient: Patient;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  patient,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  return (
    <div className="modal-overlay" onClick={onCancel} id="delete-confirm-overlay">
      <div
        className="modal-content"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
        id="delete-confirm-modal"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="stat-icon-wrap rose">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>
                Confirm Patient Deletion
              </h3>
              <p className="modal-subtitle">This action cannot be undone</p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-padded">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Are you sure you want to permanently delete the medical record for{' '}
            <strong style={{ color: 'var(--text-main)' }}>{patient.full_name}</strong>{' '}
            (DOB: {patient.date_of_birth}, Email: {patient.email})?
          </p>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isDeleting}
              id="btn-cancel-delete"
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
              disabled={isDeleting}
              id="btn-confirm-delete"
            >
              {isDeleting ? (
                <span>Deleting...</span>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
