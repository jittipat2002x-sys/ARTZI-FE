import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export function useGetDashboardSummary(branchId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['dashboard', 'summary', branchId, startDate, endDate],
    queryFn: () => dashboardService.getSummary(branchId, startDate, endDate),
    enabled: !!branchId, // Only fetch if we have a branchId
  });
}
