
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface Permission {
  id: number;
  subject: string;
  action: string;
}

export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
}

export interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role_id: number | null;
    role?: Role;
  };
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number | null;
  created_by_id: number | null;
  role?: Role;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}