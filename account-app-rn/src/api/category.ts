import {useAppStore} from '@/store/appStore';
import {ApiResponse} from '@/types/api';
import {BillType, Category} from '@/types/bill';

export async function getCategoryList(type?: BillType): Promise<ApiResponse<Category[]>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getCategories(type),
  };
}

export async function createCategory(
  payload: Pick<Category, 'type' | 'name' | 'icon' | 'color'>,
): Promise<ApiResponse<null>> {
  useAppStore.getState().addCategory(payload);
  return {code: 200, message: 'success', data: null};
}

export async function updateCategory(
  categoryId: number,
  payload: Partial<Pick<Category, 'name' | 'icon' | 'color'>>,
): Promise<ApiResponse<null>> {
  useAppStore.getState().editCategory(categoryId, payload);
  return {code: 200, message: 'success', data: null};
}

export async function deleteCategory(categoryId: number): Promise<ApiResponse<null>> {
  useAppStore.getState().removeCategory(categoryId);
  return {code: 200, message: 'success', data: null};
}
