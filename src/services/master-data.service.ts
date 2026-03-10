import { authService } from './auth.service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100/api';

function getHeaders() {
    const token = authService.getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

async function handleResponse(res: Response) {
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Request failed');
    }
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
}

export interface MasterProductCategory {
    id: string;
    nameTh: string;
    nameEn?: string;
    isActive: boolean;
}

export interface MasterMedicineCategory {
    id: string;
    nameTh: string;
    nameEn?: string;
    isActive: boolean;
}

export interface MasterUnit {
    id: string;
    medicineCategoryId?: string | null;
    medicineCategory?: MasterMedicineCategory | null;
    nameTh: string;
    nameEn?: string;
    isActive: boolean;
}

export interface MasterUsageInstruction {
    id: string;
    type: 'FREQUENCY' | 'TIME';
    nameTh: string;
    nameEn?: string;
    isActive: boolean;
}

export const masterDataService = {
    // Product Categories
    getProductCategories: async (): Promise<MasterProductCategory[]> => {
        const res = await fetch(`${API_BASE}/master-data/product-categories`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createProductCategory: async (data: any) => {
        const res = await fetch(`${API_BASE}/master-data/product-categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateProductCategory: async (id: string, data: any) => {
        const res = await fetch(`${API_BASE}/master-data/product-categories/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteProductCategory: async (id: string) => {
        const res = await fetch(`${API_BASE}/master-data/product-categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    // Medicine Categories
    getMedicineCategories: async (): Promise<MasterMedicineCategory[]> => {
        const res = await fetch(`${API_BASE}/master-data/medicine-categories`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createMedicineCategory: async (data: any) => {
        const res = await fetch(`${API_BASE}/master-data/medicine-categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateMedicineCategory: async (id: string, data: any) => {
        const res = await fetch(`${API_BASE}/master-data/medicine-categories/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteMedicineCategory: async (id: string) => {
        const res = await fetch(`${API_BASE}/master-data/medicine-categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    // Units
    getUnits: async (medicineCategoryId?: string): Promise<MasterUnit[]> => {
        const params = new URLSearchParams();
        if (medicineCategoryId) params.append('medicineCategoryId', medicineCategoryId);
        const res = await fetch(`${API_BASE}/master-data/units?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createUnit: async (data: any) => {
        const res = await fetch(`${API_BASE}/master-data/units`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateUnit: async (id: string, data: any) => {
        const res = await fetch(`${API_BASE}/master-data/units/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteUnit: async (id: string) => {
        const res = await fetch(`${API_BASE}/master-data/units/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    // Usage Instructions
    getUsageInstructions: async (type?: 'FREQUENCY' | 'TIME'): Promise<MasterUsageInstruction[]> => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        const res = await fetch(`${API_BASE}/master-data/usage-instructions?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createUsageInstruction: async (data: any) => {
        const res = await fetch(`${API_BASE}/master-data/usage-instructions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateUsageInstruction: async (id: string, data: any) => {
        const res = await fetch(`${API_BASE}/master-data/usage-instructions/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteUsageInstruction: async (id: string) => {
        const res = await fetch(`${API_BASE}/master-data/usage-instructions/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
};
