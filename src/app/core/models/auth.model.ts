export interface User {
  id: string;
  name: string;
  email?: string;
  token?: string; // ✅ Ensure this exists
  role?: 'ADMIN' | 'USER';
}

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: User;
}
