
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'root' | 'team_member';
    createdAt: string;
    updatedAt: string;
}

export interface LoginDto {
    email: string;
    password: string;
    role: 'root' | 'team_member';
}

export interface SignupDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'root' | 'team_member';
}

export interface ForgotPasswordDto {
    email: string;
    role: 'root' | 'team_member';
}

export interface ResetPasswordDto {
    email: string;
    otp: string;
    newPassword: string;
    role: 'root' | 'team_member';
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}
