import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export function useGetInventoryReport(branchId?: string) {
  return useQuery({
    queryKey: ['reports', 'inventory', branchId],
    queryFn: () => dashboardService.getInventoryReport(branchId),
    enabled: !!branchId,
  });
}

export function useGetFinanceReport(branchId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'finance', branchId, startDate, endDate],
    queryFn: () => dashboardService.getFinanceReport(branchId, startDate, endDate),
    enabled: !!branchId,
  });
}

export function useGetStatsReport(branchId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'stats', branchId, startDate, endDate],
    queryFn: () => dashboardService.getStatsReport(branchId, startDate, endDate),
    enabled: !!branchId,
  });
}
