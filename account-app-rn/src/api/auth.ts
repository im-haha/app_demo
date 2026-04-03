import {ApiResponse} from '@/types/api';
import {LoginPayload, RegisterPayload, UpdateProfilePayload, UserProfile} from '@/types/user';
import {useAuthStore} from '@/store/authStore';

// Local auth façade: all operations are in-process store calls (no remote API request).
export async function register(payload: RegisterPayload): Promise<ApiResponse<UserProfile>> {
  const data = await useAuthStore.getState().register(payload);
  return {code: 200, message: 'success', data};
}

export async function login(payload: LoginPayload): Promise<ApiResponse<UserProfile>> {
  const data = await useAuthStore.getState().login(payload);
  return {code: 200, message: 'success', data};
}

export async function getCurrentUser(): Promise<ApiResponse<UserProfile | undefined>> {
  return {
    code: 200,
    message: 'success',
    data: useAuthStore.getState().getCurrentUser(),
  };
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<ApiResponse<UserProfile | undefined>> {
  useAuthStore.getState().updateProfile(payload.nickname);

  return {
    code: 200,
    message: 'success',
    data: useAuthStore.getState().getCurrentUser(),
  };
}
