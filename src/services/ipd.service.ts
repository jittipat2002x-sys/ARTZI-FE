import { authService } from './auth.service';

export interface Ward {
    id: string;
    name: string;
    description?: string;
    branchId: string;
    cages: Cage[];
}

export interface Cage {
    id: string;
    wardId: string;
    name: string;
    type?: string;
    size?: string;
    defaultPrice?: number;
    isActive: boolean;
    admissions?: Admission[];
}

export interface Admission {
    id: string;
    branchId: string;
    petId: string;
    cageId: string;
    status: 'ADMITTED' | 'DISCHARGED';
    admittedAt: string;
    dischargedAt?: string;
    reason?: string;
    notes?: string;
    isBoarding?: boolean;
    dailyPrice?: number;
    estimatedDays?: number;
    pet?: {
        id: string;
        name: string;
        species: string;
        customer?: {
            firstName: string;
            lastName: string;
            phone?: string;
        }
    };
    cage?: Cage & { ward?: Ward };
}

class IpdService {
    private get baseUrl() {
        return 'http://localhost:3100/api';
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`,
        };
    }

    // Wards
    async getWards(branchId: string): Promise<Ward[]> {
        const res = await fetch(`${this.baseUrl}/wards?branchId=${branchId}`, {
            headers: this.headers,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to load wards');
        return result.data || result;
    }

    async createWard(data: Partial<Ward>): Promise<Ward> {
        const res = await fetch(`${this.baseUrl}/wards`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to create ward');
        return result.data || result;
    }

    async updateWard(id: string, data: Partial<Ward>): Promise<Ward> {
        const res = await fetch(`${this.baseUrl}/wards/${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to update ward');
        return result.data || result;
    }

    async deleteWard(id: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}/wards/${id}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to delete ward');
        }
    }

    // Cages
    async createCage(data: Partial<Cage>): Promise<Cage> {
        const res = await fetch(`${this.baseUrl}/wards/cages`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to create cage');
        return result.data || result;
    }

    async updateCage(id: string, data: Partial<Cage>): Promise<Cage> {
        const res = await fetch(`${this.baseUrl}/wards/cages/${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to update cage');
        return result.data || result;
    }

    async deleteCage(id: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}/wards/cages/${id}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to delete cage');
        }
    }

    // Admissions
    async admit(data: { petId: string; cageId: string; branchId: string; reason?: string; notes?: string }): Promise<Admission> {
        const res = await fetch(`${this.baseUrl}/admissions`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to admit pet');
        return result.data || result;
    }

    async discharge(id: string, notes?: string): Promise<Admission> {
        const res = await fetch(`${this.baseUrl}/admissions/${id}/discharge`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ notes }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to discharge pet');
        return result.data || result;
    }

    async transfer(id: string, cageId: string): Promise<Admission> {
        const res = await fetch(`${this.baseUrl}/admissions/${id}/transfer`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ cageId }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to transfer pet');
        return result.data || result;
    }

    async getActiveAdmissions(branchId: string): Promise<Admission[]> {
        const res = await fetch(`${this.baseUrl}/admissions/active?branchId=${branchId}`, {
            headers: this.headers,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to load active admissions');
        return result.data || result;
    }

    async getPetAdmissionHistory(petId: string): Promise<Admission[]> {
        const res = await fetch(`${this.baseUrl}/admissions/history/${petId}`, {
            headers: this.headers,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to load admission history');
        return result.data || result;
    }

    async updateAdmission(id: string, data: Partial<Admission>): Promise<Admission> {
        const res = await fetch(`${this.baseUrl}/admissions/${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to update admission');
        return result.data || result;
    }

    async deleteAdmission(id: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}/admissions/${id}`, {
            method: 'DELETE',
            headers: this.headers,
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to delete admission');
        }
    }
}

export const ipdService = new IpdService();
