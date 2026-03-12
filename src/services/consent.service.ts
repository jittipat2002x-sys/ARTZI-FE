import { apiClient } from '@/lib/api-client';

export const consentService = {
  // Templates
  getAllTemplates: async () => {
    const res = await apiClient.get<any[]>('/consent-templates');
    return res.data;
  },
  getTemplateById: async (id: string) => {
    const res = await apiClient.get<any>(`/consent-templates/${id}`);
    return res.data;
  },
  createTemplate: async (data: { name: string; content: string }) => {
    const res = await apiClient.post<any>('/consent-templates', data);
    return res.data;
  },
  updateTemplate: async (id: string, data: { name?: string; content?: string; isActive?: boolean }) => {
    const res = await apiClient.patch<any>(`/consent-templates/${id}`, data);
    return res.data;
  },

  // Signed Forms
  signForm: async (data: {
    templateId: string;
    petId: string;
    medicalRecordId?: string;
    signedBy: string;
    signatureBase64: string;
    contentSnapshot: string;
  }) => {
    const res = await apiClient.post<any>('/signed-consent-forms', data);
    return res.data;
  },
  getSignedFormsByPet: async (petId: string) => {
    const res = await apiClient.get<any[]>(`/signed-consent-forms/pet/${petId}`);
    return res.data;
  }
};
