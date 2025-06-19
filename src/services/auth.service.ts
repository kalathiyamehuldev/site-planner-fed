
import { LoginDto, SignupDto, ForgotPasswordDto, ResetPasswordDto, User } from '@/common/types/auth.types';

export const authService = {
    async login(credentials: LoginDto): Promise<{ user: User; token: string }> {
        return {
            user: {
                id: "1",
                email: "test@test.com",
                firstName: "Test",
                lastName: "User",
                accountId: "1",
                role: "root",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            token: "1234567890"
        }
    },

    async signup(userData: SignupDto): Promise<{ user: User; token: string }> {
        return {
            user: {
                id: "1",
                email: "test@test.com",
                firstName: "Test",
                lastName: "User",
                accountId: "1",
                role: "root",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            token: "1234567890"
        }
    },

    async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
        return {
            message: "Password reset email sent"
        }
    },

    async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
        return {
            message: "Password reset successful"
        }
    },

    async logout(): Promise<void> {
        return;
    }
};
