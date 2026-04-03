export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  nickname: string;
}

export interface UpdateProfilePayload {
  nickname: string;
}

export interface SessionState {
  currentUserId: number | null;
}
