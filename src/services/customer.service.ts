import { apiClient } from '@/lib/api-client';

export interface Pet {
    id: string;
    tenantId: string;
    customerId: string;
    name: string;
    species: string;
    breed?: string;
    sex?: string;
    birthDate?: string;
    color?: string;
    weight?: number;
    tagId?: string;
    branchId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    lineId?: string;
    address?: string;
    branchId?: string;
    pets?: Pet[];
    createdAt: string;
    updatedAt: string;
}

export const customerService = {
    async getCustomers(page = 1, limit = 10, search?: string, branchId?: string) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) params.append('search', search);
        if (branchId) params.append('branchId', branchId);

        const result = await apiClient.get<any>(`/customers?${params.toString()}`);
        return result.data;
    },

    async getCustomerById(id: string) {
        const result = await apiClient.get<Customer>(`/customers/${id}`);
        return result.data;
    },

    async createCustomer(data: Partial<Customer>) {
        const result = await apiClient.post<Customer>('/customers', data);
        return result.data;
    },

    async updateCustomer(id: string, data: Partial<Customer>) {
        const result = await apiClient.patch<Customer>(`/customers/${id}`, data);
        return result.data;
    },

    async deleteCustomer(id: string) {
        const result = await apiClient.delete<void>(`/customers/${id}`);
        return result.data;
    }
};
