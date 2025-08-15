
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    AuthState,
    LoginDto,
    CreateCompanyDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    CompanySelectionDto,
    UserType,
    Company,
    UserCompany
} from '@/common/types/auth.types';
import { authService } from '@/services/auth.service';
import { toast } from "sonner";

const initialState: AuthState = {
    user: null,
    selectedCompany: null,
    availableCompanies: [],
    isAuthenticated: false,
    needsCompanySelection: false,
    isLoading: false,
    error: null
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginDto, { rejectWithValue }) => {
        try {
            const response = await authService.login(credentials);
            console.log("response", response)
            localStorage.setItem('token', response.access_token);
            // Check if user has multiple companies and needs to select one
            if (response.user.userCompanies && response.user.userCompanies.length > 1) {
                return {
                    user: response.user,
                    companies: response.user.userCompanies,
                    needsCompanySelection: true
                };
            } else if (response.user.userCompanies && response.user.userCompanies.length === 1) {
                // Auto-select the only company
                localStorage.setItem('selectedCompany', JSON.stringify(response.user.userCompanies[0]?.company?.id));
                return {
                    user: response.user,
                    selectedCompany: response.user.userCompanies[0],
                    needsCompanySelection: false
                };
            }

            return {
                user: response.user,
                needsCompanySelection: false
            };
        } catch (error: any) {
            console.log("error", error)
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

export const registerCompany = createAsyncThunk(
    'auth/registerCompany',
    async (companyData: CreateCompanyDto, { rejectWithValue }) => {
        try {
            const response = await authService.registerCompany(companyData);
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('selectedCompany', JSON.stringify(response.company?.id));
            return {
                user: response.user,
                company: response.company
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Company registration failed');
        }
    }
);

export const selectCompany = createAsyncThunk(
    'auth/selectCompany',
    async (companySelection: CompanySelectionDto, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState() as { auth: AuthState };
            const selectedCompany = auth.availableCompanies.find(c => c.companyId === companySelection.companyId);

            if (!selectedCompany) {
                return rejectWithValue('Company not found');
            }

            localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany?.company?.id));
            return selectedCompany;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Company selection failed');
        }
    }
);

export const getUserCompanies = createAsyncThunk(
    'auth/getUserCompanies',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.getUserCompanies();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch companies');
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
            return rejectWithValue(error.message || 'Failed to send reset email');
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
            return rejectWithValue(error.message || 'Password reset failed');
        }
    }
);

export const getProfile = createAsyncThunk(
    'auth/getProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.getProfile();
            return response.user;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch profile');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Logout failed');
        }
    }
);

export const initializeAuth = createAsyncThunk(
    'auth/initialize',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const selectedCompanyStr = localStorage.getItem('selectedCompany');

            if (!token) {
                return { isAuthenticated: false };
            }

            // Get user profile to verify token is still valid
            const profileResponse = await authService.getProfile();
            const selectedCompany = selectedCompanyStr ? JSON.parse(selectedCompanyStr) : null;

            return {
                isAuthenticated: true,
                user: profileResponse.user,
                selectedCompany,
                needsCompanySelection: false
            };
        } catch (error: any) {
            // Token is invalid, clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('selectedCompany');
            return { isAuthenticated: false };
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.error = null;

                if (action.payload.needsCompanySelection) {
                    state.needsCompanySelection = true;
                    state.availableCompanies = action.payload.companies as any[] || [];
                } else {
                    state.needsCompanySelection = false;
                    state.selectedCompany = action.payload.selectedCompany as any || null;
                }

                toast.success('Login successful');
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string);
            })
            // Register Company
            .addCase(registerCompany.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerCompany.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.selectedCompany = action.payload.company;
                state.needsCompanySelection = false;
                state.error = null;
                toast.success('Company registration successful');
            })
            .addCase(registerCompany.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string);
            })
            // Select Company
            .addCase(selectCompany.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(selectCompany.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedCompany = action.payload as any;
                state.needsCompanySelection = false;
                state.error = null;
                toast.success('Company selected successfully');
            })
            .addCase(selectCompany.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string);
            })
            // Get User Companies
            .addCase(getUserCompanies.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getUserCompanies.fulfilled, (state, action) => {
                state.isLoading = false;
                state.availableCompanies = action.payload as any;
                state.error = null;
            })
            .addCase(getUserCompanies.rejected, (state, action) => {
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
                state.selectedCompany = null;
                state.availableCompanies = [];
                state.needsCompanySelection = false;
                state.error = null;
                toast.success('Logout successful');
            })
            // Initialize Auth
            .addCase(initializeAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(initializeAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload.isAuthenticated) {
                    state.isAuthenticated = true;
                    state.user = action.payload.user;
                    state.selectedCompany = action.payload.selectedCompany;
                    state.needsCompanySelection = action.payload.needsCompanySelection;
                } else {
                    state.isAuthenticated = false;
                    state.user = null;
                    state.selectedCompany = null;
                    state.needsCompanySelection = false;
                }
                state.error = null;
            })
            .addCase(initializeAuth.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.selectedCompany = null;
                state.needsCompanySelection = false;
                state.error = null;
            });
    }
});

export default authSlice.reducer;
