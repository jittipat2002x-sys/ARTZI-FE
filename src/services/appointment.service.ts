import { apiClient } from '@/lib/api-client';

export interface Appointment {
    id: string;
    branchId: string;
    petId: string;
    vetId: string | null;
    date: string; // ISO date string
    reason: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    createdAt: string;
    updatedAt: string;
    pet: {
        id: string;
        name: string;
        species: string;
        breed: string | null;
        customer: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
    };
    vet?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    branch: {
        id: string;
        name: string;
    };
}

export const appointmentService = {
    async getAppointments(page = 1, limit = 10, status?: string, branchId?: string, date?: string, search?: string) {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (status && status !== 'all') params.append('status', status);
        if (branchId && branchId !== 'all') params.append('branchId', branchId);
        if (date) params.append('date', date);
        if (search) params.append('search', search);

        const res = await apiClient.get<{ data: Appointment[]; meta: any }>(`/appointments?${params.toString()}`);
        return res.data;
    },

    async update(id: string, data: Partial<Appointment>) {
        const res = await apiClient.patch<Appointment>(`/appointments/${id}`, data);
        return res.data;
    },
    async createAppointment(data: { petIds: string[], vetId?: string, date: string, reason: string }) {
        const res = await apiClient.post<Appointment[]>('/appointments', data);
        return res.data;
    },
};
