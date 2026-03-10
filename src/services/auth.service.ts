import { apiClient } from '@/lib/api-client';

interface LoginPayload {
    email: string;
    password: string;
}

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleDescription?: string | null;
    tenantName?: string | null;
    brandColor?: string | null;
    logoUrl?: string | null;
    branchName?: string | null;
    branchId?: string | null;
    subscriptionStatus?: string;
    daysRemaining?: number | null;
    branches?: any[];
}

interface LoginResponse {
    access_token: string;
    user: User;
}

export const authService = {
    async registerClinic(payload: any) {
        const result = await apiClient.post('/auth/register-clinic', payload);
        return result.data;
    },

    async login(payload: LoginPayload) {
        const result = await apiClient.post<LoginResponse>('/auth/login', payload);
        localStorage.setItem('access_token', result.data.access_token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        return result.data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    },

    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    },

    getUser(): User | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr) as User;
        } catch {
            return null;
        }
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    async me() {
        const result = await apiClient.get<any>('/auth/me');
        if (result.data) {
            const currentUser = this.getUser();
            const data = result.data;
            const updatedUser: User = {
                ...currentUser,
                ...data,
                roleDescription: data.roleRef?.description || data.roleDescription || currentUser?.roleDescription,
                tenantName: data.tenant?.name || data.tenantName || currentUser?.tenantName,
                brandColor: data.tenant?.brandColor || data.brandColor || currentUser?.brandColor,
                logoUrl: data.tenant?.logoUrl || data.logoUrl || currentUser?.logoUrl,
                branchName: data.branches?.[0]?.branch?.name || data.branchName || currentUser?.branchName,
                branchId: data.branches?.[0]?.branchId || data.branchId || currentUser?.branchId,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        }
        return null;
    },
};
