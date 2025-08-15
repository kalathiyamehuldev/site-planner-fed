
export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    VIEWER = 'VIEWER'
}

export enum UserType {
    USER = 'USER',
    CUSTOMER = 'CUSTOMER',
    VENDOR = 'VENDOR'
}

export interface Company {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserCompany {
    id: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
    userId: string;
    companyId: string;
    company: Company;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: UserType;
    role: UserRole;
    companyId?: string;
    company?: Company;
    userCompanies?: UserCompany[];
    createdAt: string;
    updatedAt: string;
}

// Company Registration DTO (for signup)
export interface CreateCompanyDto {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    firstName: string;
    lastName: string;
    password: string;
}

// Universal Login DTO
export interface LoginDto {
    email: string;
    password: string;
    userType: UserType;
}

// Company Selection DTO (after login for multi-company users)
export interface CompanySelectionDto {
    companyId: string;
}

export interface ForgotPasswordDto {
    email: string;
}

export interface ResetPasswordDto {
    email: string;
    otp: string;
    newPassword: string;
}

export interface AuthState {
    user: User | null;
    selectedCompany: Company | null;
    availableCompanies: UserCompany[];
    isAuthenticated: boolean;
    needsCompanySelection: boolean;
    isLoading: boolean;
    error: string | null;
}

// API Response types
export interface LoginResponse {
    access_token: string;
    user: User;
    companies?: Company[];
    message: string;
}

export interface CompanyRegistrationResponse {
    access_token: string;
    user: User;
    companies: Company[];
    message: string;
}
