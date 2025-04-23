
import { LoginDto, SignupDto, ForgotPasswordDto, ResetPasswordDto, User } from '@/common/types/auth.types';
import xus from '@/lib/xus';

export const authService = {
    async login(credentials: LoginDto): Promise<{ user: User; token: string }> {
        const response = await xus.post('/auth/login', credentials);
        return response.data;
    },

    async signup(userData: SignupDto): Promise<{ user: User; token: string }> {
        const response = await xus.post('/auth/signup', userData);
        return response.data;
    },

    async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
        const response = await xus.post('/auth/forgot-password', data);
        return response.data;
    },

    async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
        const response = await xus.post('/auth/reset-password', data);
        return response.data;
    },

    async logout(): Promise<void> {
        await xus.post('/auth/logout');
    }
};
