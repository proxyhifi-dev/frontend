export interface User {
  id: string;
  name: string;
  email?: string;
  token?: string; // ✅ Ensure this exists
  role?: 'ADMIN' | 'USER';
}
