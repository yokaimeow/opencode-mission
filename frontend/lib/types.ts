export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  owner?: {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export type ProjectRole = 'admin' | 'member' | 'agent' | 'guest';

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  user?: {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
  };
}

export interface AddMemberRequest {
  user_id: string;
  role: ProjectRole;
}

export interface UpdateMemberRoleRequest {
  role: ProjectRole;
}
