import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { HealthStats } from './components/HealthStats';
import { AddPatientForm } from './components/AddPatientForm';
import { PatientList } from './components/PatientList';
import { RemarksHighlightBox } from './components/RemarksHighlightBox';
import { EditPatientModal } from './components/EditPatientModal';
import { PatientDetailModal } from './components/PatientDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ToastContainer } from './components/Toast';
import type { Patient, HealthStats as HealthStatsType, ToastMessage } from './types';
import { api } from './api';

export const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<HealthStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeRiskFilter, setActiveRiskFilter] = useState<string>('All');

  // Newly submitted patient for highlighted AI remarks box
  const [submittedPatient, setSubmittedPatient] = useState<Patient | null>(null);

  // Modal states
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reanalyzingId, setReanalyzingId] = useState<number | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch patients and stats
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setIsRefreshing(true);
    try {
      const [patientsData, statsData] = await Promise.all([
        api.getPatients(),
        api.getHealthStats(),
      ]);
      setPatients(patientsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load records:', err);
      addToast('error', 'Connection Error', err.message || 'Could not connect to FastAPI server');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle successful patient creation
  const handlePatientCreated = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setSubmittedPatient(newPatient);
    fetchData(true);
    addToast(
      'success',
      'Patient Registered',
      `${newPatient.full_name} has been evaluated by AI with a score of ${newPatient.health_score || 85}/100!`
    );

    setTimeout(() => {
      document.getElementById('ai-remarks-highlight-box')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 150);
  };

  // Handle successful patient update
  const handlePatientUpdated = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
    if (detailPatient && detailPatient.id === updatedPatient.id) {
      setDetailPatient(updatedPatient);
    }
    if (submittedPatient && submittedPatient.id === updatedPatient.id) {
      setSubmittedPatient(updatedPatient);
    }
    setEditingPatient(null);
    fetchData(true);
    addToast(
      'success',
      'Patient Updated',
      `Updated clinical record for ${updatedPatient.full_name}.`
    );
  };

  // Handle patient deletion confirmation
  const handleConfirmDelete = async () => {
    if (!deletingPatient) return;
    try {
      setIsDeleting(true);
      await api.deletePatient(deletingPatient.id);
      setPatients((prev) => prev.filter((p) => p.id !== deletingPatient.id));
      if (submittedPatient?.id === deletingPatient.id) {
        setSubmittedPatient(null);
      }
      if (detailPatient?.id === deletingPatient.id) {
        setDetailPatient(null);
      }
      addToast(
        'info',
        'Record Deleted',
        `Patient record for ${deletingPatient.full_name} has been removed.`
      );
      setDeletingPatient(null);
      fetchData(true);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle re-analysis via AI
  const handleReanalyze = async (patientId: number) => {
    try {
      setReanalyzingId(patientId);
      const updated = await api.reanalyzePatient(patientId);
      setPatients((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      if (detailPatient && detailPatient.id === updated.id) {
        setDetailPatient(updated);
      }
      if (submittedPatient && submittedPatient.id === updated.id) {
        setSubmittedPatient(updated);
      }
      addToast(
        'success',
        'AI Assessment Refreshed',
        `Re-evaluated biomarkers for ${updated.full_name} with AI Powered intelligence.`
      );
    } catch (err: any) {
      addToast('error', 'AI Analysis Failed', err.message || 'Failed to re-run AI prediction.');
    } finally {
      setReanalyzingId(null);
    }
  };

  return (
    <div className="app-container">
      <Navbar
        onOpenAddModal={() => {
          document.getElementById('add-patient-section')?.scrollIntoView({
            behavior: 'smooth',
          });
        }}
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
        patientCount={patients.length}
      />

      <main className="main-content">
        {/* Cohort Biomarker Statistics */}
        <HealthStats
          stats={stats}
          loading={loading}
          onFilterRisk={(risk) => {
            setActiveRiskFilter(risk);
            document.getElementById('patients-table-section')?.scrollIntoView({
              behavior: 'smooth',
            });
          }}
          activeRiskFilter={activeRiskFilter}
        />

        {/* AI Remarks Highlight Box after submission */}
        {submittedPatient && (
          <RemarksHighlightBox
            patient={submittedPatient}
            onDismiss={() => setSubmittedPatient(null)}
            onViewDetails={(patient) => setDetailPatient(patient)}
          />
        )}

        {/* Add Patient Form with Live Biomarker Analyzer */}
        <AddPatientForm
          onSuccess={handlePatientCreated}
          onError={(msg) => addToast('error', 'Validation Notice', msg)}
        />

        {/* Patient List Table */}
        <PatientList
          patients={patients}
          loading={loading}
          onEdit={(patient) => setEditingPatient(patient)}
          onDelete={(patient) => setDeletingPatient(patient)}
          onViewDetails={(patient) => setDetailPatient(patient)}
          onReanalyze={handleReanalyze}
          reanalyzingId={reanalyzingId}
          activeRiskFilter={activeRiskFilter}
          onFilterChange={(filter) => setActiveRiskFilter(filter)}
        />
      </main>

      {/* Edit Patient Modal */}
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onUpdated={handlePatientUpdated}
          onError={(msg) => addToast('error', 'Update Error', msg)}
        />
      )}

      {/* Patient Detail Modal */}
      {detailPatient && (
        <PatientDetailModal
          patient={detailPatient}
          onClose={() => setDetailPatient(null)}
          onEdit={(patient) => {
            setDetailPatient(null);
            setEditingPatient(patient);
          }}
          onDelete={(patient) => {
            setDetailPatient(null);
            setDeletingPatient(patient);
          }}
          onReanalyze={handleReanalyze}
          isReanalyzing={reanalyzingId === detailPatient.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPatient && (
        <DeleteConfirmModal
          patient={deletingPatient}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingPatient(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>&copy; {new Date().getFullYear()} MedPulse AI &bull; Advanced Clinical Biomarker &amp; Risk Intelligence</span>
          <div className="footer-tech">
            <span>FastAPI REST</span>
            <span>&bull;</span>
            <span>SQLite &amp; SQLAlchemy</span>
            <span>&bull;</span>
            <span style={{ color: '#06b6d4', fontWeight: 600 }}>AI Powered</span>
            <span>&bull;</span>
            <span>React + TypeScript</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
