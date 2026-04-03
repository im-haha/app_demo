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

export async function replaceCategoryAndDelete(
  fromCategoryId: number,
  toCategoryId: number,
): Promise<ApiResponse<null>> {
  useAppStore.getState().replaceCategoryAndRemove(fromCategoryId, toCategoryId);
  return {code: 200, message: 'success', data: null};
}

export async function checkCategoryNameDuplicated(
  type: BillType,
  name: string,
  excludeCategoryId?: number,
): Promise<ApiResponse<boolean>> {
  const state = useAppStore.getState();
  const normalizedName = name.trim().toLowerCase();
  const duplicated = state.categories.some(category => {
    if (category.userId !== state.currentUserId || category.type !== type) {
      return false;
    }
    if (excludeCategoryId && category.id === excludeCategoryId) {
      return false;
    }
    return category.name.trim().toLowerCase() === normalizedName;
  });

  return {code: 200, message: 'success', data: duplicated};
}
