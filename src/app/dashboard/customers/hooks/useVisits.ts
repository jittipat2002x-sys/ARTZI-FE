import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// types
export interface CreateVisitDto {
    customerId: string;
    branchId: string;
    visitDate?: string;
    medicalRecords: Array<{
        petId: string;
        vetId: string;
        weightAtVisit?: number;
        temperature?: number;
        symptoms: string;
        diagnosis: string;
        treatment: string;
        prescription?: string;
        notes?: string;
        medications?: Array<{
            inventoryId: string;
            quantity: number;
            unitPrice: number;
            usageInstructions?: string;
        }>;
        labTests?: Array<{
            testType: string;
            result?: string;
            notes?: string;
            files?: Array<{
                name: string;
                base64Data: string;
                contentType: string;
            }>;
        }>;
    }>;
    generalItems?: Array<{
        productId?: string;
        name: string;
        quantity: number;
        unitPrice: number;
    }>;
    discount: number;
    paymentMethod?: string;
}

export const useCreateVisit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateVisitDto) => {
            return apiClient.post('/visits', data);
        },
        onSuccess: () => {
            // Invalidate relevant queries like customer history, visits list
            queryClient.invalidateQueries({ queryKey: ['visits'] });
            queryClient.invalidateQueries({ queryKey: ['medical-records'] });
        },
    });
};

export const useGetPetHistory = (petId: string) => {
    return useQuery({
        queryKey: ['medical-records', 'pet', petId],
        queryFn: async () => {
            return apiClient.get(`/medical-records/pet/${petId}`);
        },
        enabled: !!petId,
    });
};

export const useUpdateMedication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dosage }: { id: string; dosage: string }) => {
            return apiClient.patch(`/medical-records/medication/${id}`, { dosage });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['medical-records'] });
        },
    });
};
