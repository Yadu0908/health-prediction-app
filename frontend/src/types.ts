export interface RiskDetail {
  level: string;
  assessment: string;
}

export interface HealthAnalysis {
  risk_level: 'Optimal' | 'Moderate' | 'High' | 'Critical';
  health_score: number;
  summary: string;
  diabetes_risk: RiskDetail;
  cardiovascular_risk: RiskDetail;
  anemia_risk: RiskDetail;
  recommendations: string[];
  urgency: string;
  model_used?: string;
}

export interface BiomarkerMetric {
  value: number;
  unit: string;
  status: 'Optimal' | 'Borderline' | 'High' | 'Low';
  category: string;
  reference: string;
}

export interface BiomarkerStatusSummary {
  glucose: BiomarkerMetric;
  haemoglobin: BiomarkerMetric;
  cholesterol: BiomarkerMetric;
}

export interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  email: string;
  glucose: number;
  haemoglobin: number;
  cholesterol: number;
  remarks: string | null;
  created_at: string;
  age?: number;
  risk_level?: 'Optimal' | 'Moderate' | 'High' | 'Critical';
  health_score?: number;
  analysis?: HealthAnalysis;
  biomarker_status?: BiomarkerStatusSummary;
}

export interface PatientFormData {
  full_name: string;
  date_of_birth: string;
  email: string;
  glucose: string;
  haemoglobin: string;
  cholesterol: string;
}

export interface FormValidationErrors {
  full_name?: string;
  date_of_birth?: string;
  email?: string;
  glucose?: string;
  haemoglobin?: string;
  cholesterol?: string;
  general?: string;
}

export interface HealthStats {
  total_patients: number;
  avg_glucose: number;
  avg_haemoglobin: number;
  avg_cholesterol: number;
  high_risk_count: number;
  moderate_risk_count: number;
  optimal_count: number;
  avg_health_score: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
