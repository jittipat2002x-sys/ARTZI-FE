import { apiClient } from '@/lib/api-client';
import { Pet } from './customer.service';

export const petService = {
    async getPets(customerId?: string) {
        const params = new URLSearchParams();
        if (customerId) params.append('customerId', customerId);

        return apiClient.get<Pet[]>(`/pets?${params.toString()}`);
    },

    async getPetById(id: string) {
        return apiClient.get<Pet>(`/pets/${id}`);
    },

    async createPet(data: Partial<Pet>) {
        return apiClient.post<Pet>('/pets', data);
    },

    async updatePet(id: string, data: Partial<Pet>) {
        return apiClient.patch<Pet>(`/pets/${id}`, data);
    },

    async deletePet(id: string) {
        return apiClient.delete(`/pets/${id}`);
    }
};
