import {useAppStore} from '@/store/appStore';
import {BillFilters, BillInput, BillRecord} from '@/types/bill';
import {ApiResponse, PageResult} from '@/types/api';

export async function createBill(payload: BillInput): Promise<ApiResponse<null>> {
  useAppStore.getState().saveBillRecord(payload);
  return {code: 200, message: 'success', data: null};
}

export async function updateBill(billId: number, payload: BillInput): Promise<ApiResponse<null>> {
  useAppStore.getState().saveBillRecord(payload, billId);
  return {code: 200, message: 'success', data: null};
}

export async function deleteBill(billId: number): Promise<ApiResponse<null>> {
  useAppStore.getState().deleteBillRecord(billId);
  return {code: 200, message: 'success', data: null};
}

export async function getBillDetail(
  billId: number,
): Promise<ApiResponse<BillRecord | undefined>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getBillById(billId),
  };
}

export async function getBillPage(
  filters?: BillFilters,
): Promise<ApiResponse<PageResult<BillRecord>>> {
  const list = useAppStore.getState().getBills(filters);
  return {code: 200, message: 'success', data: {list, total: list.length}};
}
