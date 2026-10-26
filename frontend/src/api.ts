import type { Patient, HealthStats } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `HTTP error ${res.status}`;
    try {
      const errorData = await res.json();
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((err: any) => `${err.loc?.slice(-1)[0] || 'field'}: ${err.msg}`)
          .join(', ');
      }
    } catch {
      errorMessage = (await res.text()) || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export const api = {
  async getPatients(search?: string, riskLevel?: string): Promise<Patient[]> {
    const url = new URL(`${API_BASE_URL}/patients`);
    if (search && search.trim()) {
      url.searchParams.append('search', search.trim());
    }
    if (riskLevel && riskLevel !== 'All') {
      url.searchParams.append('risk_level', riskLevel);
    }
    const res = await fetch(url.toString());
    return handleResponse<Patient[]>(res);
  },

  async getPatient(id: number): Promise<Patient> {
    const res = await fetch(`${API_BASE_URL}/patients/${id}`);
    return handleResponse<Patient>(res);
  },

  async createPatient(payload: {
    full_name: string;
    date_of_birth: string;
    email: string;
    glucose: number;
    haemoglobin: number;
    cholesterol: number;
  }): Promise<Patient> {
    const res = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Patient>(res);
  },

  async updatePatient(id: number, payload: Partial<Patient>): Promise<Patient> {
    const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Patient>(res);
  },

  async deletePatient(id: number): Promise<{ message: string; success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string; success: boolean }>(res);
  },

  async reanalyzePatient(id: number): Promise<Patient> {
    const res = await fetch(`${API_BASE_URL}/patients/${id}/analyze`, {
      method: 'POST',
    });
    return handleResponse<Patient>(res);
  },

  async getHealthStats(): Promise<HealthStats> {
    const res = await fetch(`${API_BASE_URL}/stats`);
    return handleResponse<HealthStats>(res);
  },
};
