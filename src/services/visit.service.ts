import { apiClient } from '@/lib/api-client';

export interface MedicalTreatment {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    type: string;
    instructions: string;
}

export interface MedicalRecord {
    id: string;
    petId: string;
    symptoms: string;
    diagnosis: string;
    treatment: string;
    prescription: string;
    notes: string;
    medications: MedicalTreatment[];
    pet: any;
    vet: any;
}

export interface Visit {
    id: string;
    branchId: string;
    customerId: string;
    visitDate: string;
    medicalRecords: MedicalRecord[];
    invoice: any;
}

export const visitService = {
    async getVisits(customerId?: string, date?: string, appointmentId?: string): Promise<Visit[]> {
        const params = new URLSearchParams();
        if (customerId) params.append('customerId', customerId || '');
        if (date) params.append('date', date || '');
        if (appointmentId) params.append('appointmentId', appointmentId || '');

        const res = await apiClient.get<Visit[]>(`/visits?${params.toString()}`);
        return res.data;
    },
};
