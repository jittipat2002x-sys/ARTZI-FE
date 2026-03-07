import { authService } from './auth.service';

export const PRODUCT_TYPE_OPTIONS = [
    { id: 'MEDICINE', name: 'ยา' },
    { id: 'VACCINE', name: 'วัคซีน' },
    { id: 'SUPPLY', name: 'วัสดุสิ้นเปลือง' },
    { id: 'FOOD', name: 'อาหารสัตว์' },
    { id: 'SERVICE', name: 'บริการ' },
    { id: 'OTHER', name: 'อื่นๆ' },
];

export const MEDICINE_TYPE_OPTIONS = [
    { id: 'INJECTION', name: 'แบบฉีด' },
    { id: 'LIQUID', name: 'แบบน้ำ' },
    { id: 'PILL', name: 'แบบเม็ด' },
];

const API_BASE = 'http://localhost:3100/api';

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

export interface InventoryItem {
    id: string;
    branchId: string;
    name: string;
    type: 'MEDICINE' | 'VACCINE' | 'SUPPLY' | 'FOOD' | 'SERVICE' | 'OTHER';
    medicineType?: 'INJECTION' | 'LIQUID' | 'PILL' | 'NONE' | null;
    categoryId?: string | null;
    masterMedicineCategoryId?: string | null;
    unitId?: string | null;
    usageUnitId?: string | null;
    usageFrequencyId?: string | null;
    usageTimeId?: string | null;
    category?: { nameTh: string; nameEn?: string };
    masterMedicineCategory?: { nameTh: string; nameEn?: string };
    masterUnit?: { nameTh: string; nameEn?: string };
    masterUsageUnit?: { nameTh: string; nameEn?: string };
    masterUsageFrequency?: { nameTh: string; nameEn?: string };
    masterUsageTime?: { nameTh: string; nameEn?: string };
    description?: string | null;
    price: number;
    cost: number;
    quantity: number;
    lowStockThreshold?: number;
    unit: string;
    lotNumber?: string | null;
    barcode?: string | null;
    expirationDate?: string | null;
    // Drug Usage Instructions
    usageAmount?: string | null;
    usageUnit?: string | null;
    usageFrequency?: string | null;
    usageTime?: 'BEFORE_MEAL' | 'AFTER_MEAL' | null;
    usageMorning?: boolean;
    usageNoon?: boolean;
    usageEvening?: boolean;
    usageNight?: boolean;
    usageRemark?: string | null;
    createdAt: string;
    updatedAt: string;
}

export const inventoryService = {
    getInventories: async (branchId?: string, type?: string, medicineType?: string, search?: string, page: number = 1, limit: number = 10, stockAlert: boolean = false): Promise<{ data: InventoryItem[], meta: any }> => {
        const params = new URLSearchParams();
        if (branchId && branchId !== 'all') params.append('branchId', branchId);
        if (type && type !== 'all') params.append('type', type);
        if (medicineType && medicineType !== 'all') params.append('medicineType', medicineType);
        if (search) params.append('search', search);
        if (stockAlert) params.append('stockAlert', 'true');
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const res = await fetch(`${API_BASE}/inventory?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    getInventoryById: async (id: string): Promise<InventoryItem> => {
        const res = await fetch(`${API_BASE}/inventory/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    createInventory: async (data: Partial<InventoryItem>): Promise<InventoryItem> => {
        const res = await fetch(`${API_BASE}/inventory`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    updateInventory: async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
        const res = await fetch(`${API_BASE}/inventory/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    deleteInventory: async (id: string): Promise<void> => {
        await fetch(`${API_BASE}/inventory/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
    },
};
