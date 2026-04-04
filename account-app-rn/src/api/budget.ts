import {useAppStore} from '@/store/appStore';
import {ApiResponse} from '@/types/api';
import {BudgetSummary} from '@/types/bill';

export async function saveBudget(month: string, amount: number): Promise<ApiResponse<null>> {
  useAppStore.getState().setBudget(month, amount);
  return {code: 200, message: 'success', data: null};
}

export async function getBudget(month: string): Promise<ApiResponse<BudgetSummary>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getBudgetByMonth(month),
  };
}

export async function getBudgetHistory(limit = 12): Promise<ApiResponse<BudgetSummary[]>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getBudgetHistory(limit),
  };
}

export async function copyLastMonthBudget(month: string): Promise<ApiResponse<null>> {
  useAppStore.getState().copyBudgetFromLastMonth(month);
  return {
    code: 200,
    message: 'success',
    data: null,
  };
}
