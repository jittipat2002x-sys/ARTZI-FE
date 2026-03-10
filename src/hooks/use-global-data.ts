import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { apiClient } from '@/lib/api-client';

export const useAuthMe = () => {
    return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            return authService.me();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,
    });
};

export const useMenus = (enabled: boolean = true) => {
    return useQuery({
        queryKey: ['auth', 'menus'],
        queryFn: async () => {
            const res = await apiClient.get<any[]>('/auth/me/menus');
            const menuData = res.data || res;
            return (Array.isArray(menuData) ? menuData : []).map(m => {
                if (m.name === 'แอดมิท (IPD)') return { ...m, name: 'จัดการกรง/ที่พัก' };
                return m;
            });
        },
        enabled: enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useBrandingSync = (enabled: boolean = true) => {
    return useQuery({
        queryKey: ['tenant', 'branding'],
        queryFn: async () => {
            const res = await apiClient.get<any>('/tenants/my/branding');
            return res.data || res;
        },
        enabled: enabled,
        staleTime: 30 * 60 * 1000, // 30 minutes
        retry: (failureCount, error: any) => {
            // Check status code from our enhanced api-client
            if (error?.status === 403 || error?.status === 401) return false;
            return failureCount < 2;
        }
    });
};

export const useBranches = (page: number = 1, limit: number = 100, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['admin', 'branches', { page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            const res = await apiClient.get<any>(`/branches?${params.toString()}`);
            const data = res.data || res;
            return Array.isArray(data) ? data : (data.data || []);
        },
        enabled: enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useRoles = (page: number = 1, limit: number = 100, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['admin', 'roles', { page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            const res = await apiClient.get<any>(`/roles?${params.toString()}`);
            const data = res.data || res;
            return Array.isArray(data) ? data : (data.data || []);
        },
        enabled: enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};
