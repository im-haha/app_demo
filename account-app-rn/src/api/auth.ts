import {ApiResponse} from '@/types/api';
import {LoginPayload, RegisterPayload, UpdateProfilePayload, UserProfile} from '@/types/user';
import {useAppStore} from '@/store/appStore';

// Local-auth mock: keep API signatures stable for future server-side migration.
export async function register(payload: RegisterPayload): Promise<ApiResponse<UserProfile>> {
  const data = await useAppStore.getState().register(payload);
  return {code: 200, message: 'success', data};
}

export async function login(payload: LoginPayload): Promise<ApiResponse<UserProfile>> {
  const data = await useAppStore.getState().login(payload);
  return {code: 200, message: 'success', data};
}

export async function getCurrentUser(): Promise<ApiResponse<UserProfile | undefined>> {
  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getCurrentUser(),
  };
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<ApiResponse<UserProfile | undefined>> {
  useAppStore.getState().updateProfile(payload.nickname);

  return {
    code: 200,
    message: 'success',
    data: useAppStore.getState().getCurrentUser(),
  };
}
