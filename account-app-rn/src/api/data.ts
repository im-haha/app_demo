import {useAppStore} from '@/store/appStore';
import {ApiResponse} from '@/types/api';
import {AppDataExportPayload} from '@/services/localAppService';

// Local data façade: import/export reads and writes local store only.
export async function exportMyData(): Promise<ApiResponse<AppDataExportPayload>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().exportCurrentUserData(),
  };
}

export async function importMyData(payload: AppDataExportPayload): Promise<ApiResponse<null>> {
  useAppStore.getState().importCurrentUserData(payload);
  return {
    code: 200,
    message: 'success',
    data: null,
  };
}
