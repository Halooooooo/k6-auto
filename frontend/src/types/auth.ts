export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginDto {
  username: string
  password: string
}

export interface RegisterDto {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface UpdateProfileDto {
  username?: string
  email?: string
  avatar?: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  timestamp: string
}

export interface LoginResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
  message: string
  timestamp: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}