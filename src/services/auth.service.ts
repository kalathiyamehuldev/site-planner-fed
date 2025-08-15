
import {
    LoginDto,
    CreateCompanyDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    CompanySelectionDto,
    LoginResponse,
    CompanyRegistrationResponse,
    Company
} from '@/common/types/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class AuthService {
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        };
    }

    async login(credentials: LoginDto): Promise<LoginResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(credentials)
            });
            const result = await response.json();
            console.log("result", result)
            if (!response.ok || result.status != "success") {
                throw new Error(result.error || 'Login failed');
            }
            return result.data;
        } catch (error) {
            console.log("error", error)
        }
    }

    async registerCompany(companyData: CreateCompanyDto): Promise<CompanyRegistrationResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/register-company`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(companyData)
        });

        const result = await response.json();

        if (!response.ok || result.status != "success") {
            throw new Error(result.error || 'Company registration failed');
        }

        return result.data;
    }

    async selectCompany(companySelection: CompanySelectionDto): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/select-company`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(companySelection)
        });

        const result = await response.json();

        if (!response.ok || result.status != "success") {
            throw new Error(result.error || 'Company selection failed');
        }

        return result.data;
    }

    async getUserCompanies(): Promise<Company[]> {
        const response = await fetch(`${API_BASE_URL}/auth/user-companies`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok || result.status != "success") {
            throw new Error(result.error || 'Failed to fetch user companies');
        }

        return result.data;
    }

    async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || result.status != "success") {
            throw new Error(result.error || 'Failed to process forgot password request');
        }

        return result.data;
    }

    async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || result.status != "success") {
            throw new Error(result.error || 'Failed to reset password');
        }

        return result.data;
    }

    async getProfile(): Promise<{ user: any; message: string }> {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok || result.status != "success") {
            throw new Error(result.error || 'Failed to fetch profile');
        }

        return result.data;
    }

    async refreshToken(): Promise<{ access_token: string; message: string }> {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok || result.status != "success") {
            throw new Error(result.error || 'Failed to refresh token');
        }

        return result.data;
    }

    async logout(): Promise<void> {
        localStorage.removeItem('token');
        localStorage.removeItem('selectedCompany');
        window.location.href = '/auth/login';
    }
}

export const authService = new AuthService();
