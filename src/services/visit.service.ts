import { apiClient } from '@/lib/api-client';

export interface MedicalTreatment {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    type: string;
    instructions: string;
    requiresConsent?: boolean;
}

export interface LabTestFile {
    id: string;
    url: string;
    name: string;
}

export interface LabTest {
    id: string;
    testType: string;
    result: string;
    notes: string;
    files: LabTestFile[];
}

export interface MedicalRecord {
    id: string;
    petId: string;
    weightAtVisit: number;
    temperature: number;
    isSurgery: boolean;
    symptoms: string;
    diagnosis: string;
    treatment: string;
    prescription: string;
    notes: string;
    medications: MedicalTreatment[];
    labTests: LabTest[];
    signedConsentForms?: any[];
    pet: any;
    vet: any;
    vetId?: string;
    admission?: any;
}

export interface Visit {
    id: string;
    branchId: string;
    customerId: string;
    visitDate: string;
    customer?: any;
    medicalRecords: MedicalRecord[];
    invoice: any;
    appointments?: any[];
    status: 'DRAFT' | 'COMPLETED';
}

export interface PaginatedVisits {
    data: Visit[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
    };
}

export const visitService = {
    async getVisits(
        customerId?: string,
        date?: string,
        appointmentId?: string,
        search?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<PaginatedVisits> {
        const params = new URLSearchParams();
        if (customerId) params.append('customerId', customerId);
        if (date) params.append('date', date);
        if (appointmentId) params.append('appointmentId', appointmentId);
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const res = await apiClient.get<PaginatedVisits>(`/visits?${params.toString()}`);
        return res.data;
    },
};
