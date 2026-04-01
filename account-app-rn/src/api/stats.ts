import {useAppStore} from '@/store/appStore';
import {ApiResponse} from '@/types/api';
import {BillType, CategoryStat, OverviewStats, TrendPoint} from '@/types/bill';

export async function getOverviewStats(): Promise<ApiResponse<OverviewStats>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getOverview(),
  };
}

export async function getCategoryStats(
  month: string,
  type: BillType,
): Promise<ApiResponse<CategoryStat[]>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getCategoryBreakdown(month, type),
  };
}

export async function getTrendStats(
  rangeDays: number,
  type: BillType,
): Promise<ApiResponse<TrendPoint[]>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getTrend(rangeDays, type),
  };
}
