
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthState, LoginDto, SignupDto, ForgotPasswordDto, ResetPasswordDto } from '@/common/types/auth.types';
import { authService } from '@/services/auth.service';
import { toast } from "sonner";

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginDto, { rejectWithValue }) => {
        try {
            const response = await authService.login(credentials);
            localStorage.setItem('token', response.token);
            return response.user;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const signup = createAsyncThunk(
    'auth/signup',
    async (userData: SignupDto, { rejectWithValue }) => {
        try {
            const response = await authService.signup(userData);
            localStorage.setItem('token', response.token);
            return response.user;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Signup failed');
        }
    }
);

export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (data: ForgotPasswordDto, { rejectWithValue }) => {
        try {
            const response = await authService.forgotPassword(data);
            return response.message;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
        }
    }
);

export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async (data: ResetPasswordDto, { rejectWithValue }) => {
        try {
            const response = await authService.resetPassword(data);
            return response.message;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Password reset failed');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout();
            localStorage.removeItem('token');
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Logout failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
                state.error = null;
                toast.success('Login successful');
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string);
            })
            .addCase(signup.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(signup.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
                state.error = null;
                toast.success('Signup successful');
            })
            .addCase(signup.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string);
            })
            .addCase(forgotPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
                toast.success('Password reset instructions sent to your email');
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string);
            })
            .addCase(resetPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
                toast.success('Password reset successful');
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string);
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.error = null;
                toast.success('Logout successful');
            });
    }
});

export default authSlice.reducer;
