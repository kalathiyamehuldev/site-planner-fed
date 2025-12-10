
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    AuthState,
    LoginDto,
    CreateCompanyDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    CompanySelectionDto,
    VerifyOtpDto
} from '@/common/types/auth.types';
import { RootState } from '@/redux/store';
import api from '@/lib/axios';
import { toast } from "@/components/ui/use-toast";
import { fetchPermissionsByRole } from './rolesSlice';
import { forceStopTimer } from './timeTrackingSlice';

import { Company } from '@/common/types/auth.types';



// Define AsyncThunkConfig type
type AsyncThunkConfig = {
  rejectValue: string;
};

// Define interfaces for other thunks
interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Define initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  selectedCompany: null,
  needsCompanySelection: false,
  availableCompanies: [],
  permissions: JSON.parse(localStorage.getItem('userPermissions') || '[]')
};

// Helper function to fetch permissions after authentication
export const fetchUserPermissions = createAsyncThunk<
    any,
    string | undefined,
    AsyncThunkConfig
>(
    'auth/fetchUserPermissions',
    async (roleId, { dispatch, rejectWithValue }) => {
        try {
            if (!roleId) {
                console.error('No role ID provided for fetching permissions');
                return rejectWithValue('No role ID provided');
            }
            
            // Fetch permissions for the user's role
            const resultAction = await dispatch(fetchPermissionsByRole(roleId));
            
            if (fetchPermissionsByRole.fulfilled.match(resultAction)) {
                return resultAction.payload;
            } else if (fetchPermissionsByRole.rejected.match(resultAction)) {
                return rejectWithValue('Failed to fetch permissions');
            }
            
            return [];
        } catch (error: any) {
            console.error('Failed to fetch user permissions:', error);
            return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

// Define a union type for the return values
interface LoginResponseWithCompanies {
    user: any;
    companies: Company[];
    needsCompanySelection: boolean;
}

interface LoginResponseWithSelectedCompany {
    user: any;
    selectedCompany: Company;
    needsCompanySelection: boolean;
}

interface LoginResponseBasic {
    user: any;
    needsCompanySelection: boolean;
}
// Login thunk
export const login = createAsyncThunk<
    LoginResponseWithCompanies | LoginResponseWithSelectedCompany | LoginResponseBasic,
    LoginDto,
    AsyncThunkConfig
>(
    'auth/login',
    async (credentials: LoginDto, { dispatch, rejectWithValue }) => {
        try {
            const response: any = await api.post('/auth/login', credentials);
            if (response.status != "success") {
                throw new Error(response.error || 'Login failed');
            }
            const { data } = response;
            localStorage.setItem('token', data.access_token);
            // Persist static permissions immediately if provided (e.g., Customer/Vendor)
            if (Array.isArray(data?.permissions)) {
                localStorage.setItem('userPermissions', JSON.stringify(data.permissions));
            }
            // Check if user has multiple companies and needs to select one
            if (data.companies && data.companies.length > 1) {
                await dispatch(getProfile());
                return {
                    user: data.user,
                    companies: data.companies,
                    needsCompanySelection: true,
                    permissions: data.permissions,
                    role: data.role,
                };
            } else if (data.companies && data.companies.length === 1) {
                // Auto-select the only company
                localStorage.setItem('selectedCompany', JSON.stringify(data.companies[0]));
                const result: LoginResponseWithSelectedCompany = {
                    user: data.user,
                    selectedCompany: data.companies[0],
                    needsCompanySelection: false,
                };
                // If user has a role, fetch permissions
                if (data.role && data.role.id) {
                    await dispatch(fetchUserPermissions(data.role.id));
                }
                await dispatch(getProfile());
                return { ...result, permissions: data.permissions, role: data.role } as any;
            }
            const result: LoginResponseBasic = {
                    user: data.user,
                    needsCompanySelection: false,
                };
            // If user has a role, fetch permissions
            if (data.role && data.role.id) {
                await dispatch(fetchUserPermissions(data.role.id));
            }
            await dispatch(getProfile());
            return { ...result, permissions: data.permissions, role: data.role } as any;
        } catch (error: any) {
            console.log("error", error)
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

// Register company
interface RegisterCompanyResponse {
    success: boolean;
    company: Company | null;
    user: any;
    needsCompanySelection: boolean;
}

export const registerCompany = createAsyncThunk<
    RegisterCompanyResponse,
    CreateCompanyDto,
    AsyncThunkConfig
>(
    'auth/registerCompany',
    async (companyData: CreateCompanyDto, { dispatch, rejectWithValue }) => {
        try {
            const response: any = await api.post('/auth/register-company', companyData);
            if (response.status != "success") {
                throw new Error(response.error || 'Company registration failed');
            }
            const { data } = response;
            localStorage.setItem('token', data.access_token);
            // Since company registration creates a single company, auto-select it
            if (data.user.companies && data.user.companies.length === 1) {
                localStorage.setItem('selectedCompany', JSON.stringify(data.user.companies[0]));
                const result: RegisterCompanyResponse = {
                success: true,
                company: data.user.companies[0],
                user: data.user,
                needsCompanySelection: false
            };
            // If user has a role, fetch permissions
            if (data.user.role && data.user.role.id) {
                await dispatch(fetchUserPermissions(data.user.role.id));
            }
            return result;
            }

            const result: RegisterCompanyResponse = {
                success: true,
                company: null,
                user: data.user,
                needsCompanySelection: false
            };
            // If user has a role, fetch permissions
            if (data.user.role && data.user.role.id) {
                await dispatch(fetchUserPermissions(data.user.role.id));
            }
            return result;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Company registration failed');
        }
    }
);

// Define interface for company selection response
interface CompanySelectionResponse {
    selectedCompany: Company;
    needsCompanySelection: boolean;
}

// Select company thunk
export const selectCompany = createAsyncThunk<
    CompanySelectionResponse,
    CompanySelectionDto,
    AsyncThunkConfig
>(
    'auth/selectCompany',
    async (companyData: CompanySelectionDto, { rejectWithValue, getState, dispatch }) => {
        try {
            const { auth } = getState() as { auth: AuthState };
            const selectedCompany = auth.availableCompanies.find(c => c.id === companyData.companyId);
            if (!selectedCompany) {
                throw new Error('Company not found');
            }

            // Request a new JWT scoped to the selected company
            const response: any = await api.post('/auth/switch-company', { companyId: selectedCompany.id });
            if (response.status === 'error') {
                return rejectWithValue(response.error || response.message || 'Failed to switch company');
            }

            const { data } = response;
            // Persist new token and selected company
            if (data?.access_token) {
                localStorage.setItem('token', data.access_token);
            }
            localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany));

            // Update permissions using returned role or fallback to userCompanies mapping
            const roleId = data?.role?.id
                || auth?.user?.userCompanies?.find(c => c.companyId === selectedCompany.id)?.roleId;
            if (roleId) {
                await dispatch(fetchUserPermissions(roleId));
            }

            return {
                selectedCompany,
                needsCompanySelection: false
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Company selection failed');
        }
    }
);

export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (data: ForgotPasswordDto, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/forgot-password', data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to send reset email');
        }
    }
);
export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async (data: ResetPasswordDto, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/reset-password', data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to reset password');
        }
    }
);

// New thunks for OTP-based flow
export const sendForgotPasswordOtp = createAsyncThunk(
  'auth/sendForgotPasswordOtp',
  async (data: ForgotPasswordDto, { rejectWithValue }) => {
    try {
      const response: any = await api.post('/auth/forgot-password/send-otp', data);
      if (response?.status && response.status !== 'success') {
        return rejectWithValue(response.error || response.message || 'Failed to send OTP');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send OTP');
    }
  }
);

export const verifyForgotPasswordOtp = createAsyncThunk(
  'auth/verifyForgotPasswordOtp',
  async (data: VerifyOtpDto, { rejectWithValue }) => {
    try {
      const response: any = await api.post('/auth/forgot-password/verify-otp', data);
      if (response?.status && response.status !== 'success') {
        return rejectWithValue(response.error || response.message || 'Invalid OTP');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Invalid OTP');
    }
  }
);

export const confirmForgotPassword = createAsyncThunk(
  'auth/confirmForgotPassword',
  async (data: ResetPasswordDto, { rejectWithValue }) => {
    try {
      const response: any = await api.post('/auth/forgot-password/reset-password', data);
      if (response?.status && response.status !== 'success') {
        return rejectWithValue(response.error || response.message || 'Failed to reset password');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reset password');
    }
  }
);
export const getProfile = createAsyncThunk(
    'auth/getProfile',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.get('/auth/profile');
            const payload: any = response;
            const user = payload?.user ?? payload;
            if (user?.userType === 'USER' && user?.role?.id) {
              await dispatch(fetchUserPermissions(user.role.id));
            }
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to get profile');
        }
    }
);

// Update profile
interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  email?: string;
  newPassword?: string;
  company?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      const response = await api.patch('/auth/profile', data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            // Force stop any running timer before logout
            try {
                await dispatch(forceStopTimer()).unwrap();
            } catch (timerError) {
                // Continue with logout even if timer stop fails
                console.warn('Failed to stop timer during logout:', timerError);
            }
            
            localStorage.removeItem('token');
            localStorage.removeItem('selectedCompany');
            localStorage.removeItem('userPermissions');
            window.location.href = '/auth/login';
            return null;
        } catch (error: any) {
            // Even if logout fails on server, clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('selectedCompany');
            localStorage.removeItem('userPermissions');
            return null;
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setPermissions: (state, action) => {
            state.permissions = action.payload;
        }
    },
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
                
                // Type guard to handle different response types
                const response = action.payload;
                if ('companies' in response && Array.isArray(response.companies) && response.companies.length > 0) {
                    state.availableCompanies = response.companies;
                    state.needsCompanySelection = true;
                } else if ('selectedCompany' in response && response.selectedCompany) {
                    state.selectedCompany = response.selectedCompany;
                    state.needsCompanySelection = false;
                } else {
                    state.selectedCompany = null;
                    state.needsCompanySelection = false;
                }

                const permsFromLogin = (response as any)?.permissions;
                if (Array.isArray(permsFromLogin)) {
                    state.permissions = permsFromLogin;
                    localStorage.setItem('userPermissions', JSON.stringify(permsFromLogin));
                }

                //toast.success('Login successful');
            })
            .addCase(fetchUserPermissions.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchUserPermissions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.permissions = (action.payload as any[]) || [];
                // Persist permissions to localStorage
                localStorage.setItem('userPermissions', JSON.stringify((action.payload as any[]) || []));
                state.error = null;
            })
            .addCase(fetchUserPermissions.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            // Get Profile
            .addCase(getProfile.pending, (state) => {
              state.isLoading = true;
              state.error = null;
            })
            .addCase(getProfile.fulfilled, (state, action) => {
              state.isLoading = false;
              const payload: any = action.payload;
              // Profile endpoint returns { user, message, permissions? }
              const user = payload?.user ?? payload;
              state.user = user || state.user;
              
              const permsFromProfile = (payload as any)?.permissions;
              if (Array.isArray(permsFromProfile)) {
                state.permissions = permsFromProfile;
                localStorage.setItem('userPermissions', JSON.stringify(permsFromProfile));
              }
              
              // Sync selected company from payload or user
              const company = payload?.company ?? user?.company;
              // Preserve existing selectedCompany from state/localStorage to avoid overriding
              const existingSelectedCompany = state.selectedCompany || (() => {
                try {
                  return JSON.parse(localStorage.getItem('selectedCompany') || 'null');
                } catch {
                  return null;
                }
              })();
              if (!existingSelectedCompany && company) {
                // Only set if nothing is currently selected
                state.selectedCompany = company;
                localStorage.setItem('selectedCompany', JSON.stringify(company));
              }
              state.error = null;
            })
            .addCase(getProfile.rejected, (state, action) => {
              state.isLoading = false;
              state.error = action.payload as string;
              toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
              state.isLoading = true;
              state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
              state.isLoading = false;
              // Axios returns response.data; backend may wrap data
              const data: any = action.payload?.data ?? action.payload;
              const user = data?.user;
              const company = data?.company;
              if (user) state.user = user;
              if (company) {
                state.selectedCompany = company;
                localStorage.setItem('selectedCompany', JSON.stringify(company));
              }
              //toast.success('Profile updated successfully');
            })
            .addCase(updateProfile.rejected, (state, action) => {
              state.isLoading = false;
              state.error = action.payload as string;
              toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
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
                
                if (action.payload.company) {
                    state.selectedCompany = action.payload.company;
                } else {
                    state.selectedCompany = null;
                }
                
                state.needsCompanySelection = action.payload.needsCompanySelection;
                state.error = null;
                //toast.success('Company registration successful');
            })
            .addCase(registerCompany.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            // Select Company
            .addCase(selectCompany.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(selectCompany.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedCompany = action.payload.selectedCompany || null;
                state.needsCompanySelection = action.payload.needsCompanySelection;
                state.error = null;
                //toast.success('Company selected successfully');
            })
            .addCase(selectCompany.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            // Send OTP
            .addCase(sendForgotPasswordOtp.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(sendForgotPasswordOtp.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
            })
            .addCase(sendForgotPasswordOtp.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            // Verify OTP
            .addCase(verifyForgotPasswordOtp.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyForgotPasswordOtp.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
            })
            .addCase(verifyForgotPasswordOtp.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            // Confirm Reset
            .addCase(confirmForgotPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(confirmForgotPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
            })
            .addCase(confirmForgotPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            .addCase(forgotPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
                //toast.success('Password reset instructions sent to your email');
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            .addCase(resetPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
                //toast.success('Password reset successful');
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast({ title: 'Error', description: action.payload as string, variant: 'destructive' });
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.selectedCompany = null;
                state.availableCompanies = [];
                state.needsCompanySelection = false;
                state.error = null;
                //toast.success('Logout successful');
            })
    }
});

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectSelectedCompany = (state: RootState) => state.auth.selectedCompany;
export const selectAvailableCompanies = (state: RootState) => state.auth.availableCompanies;
export const selectNeedsCompanySelection = (state: RootState) => state.auth.needsCompanySelection;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectPermissions = (state: RootState) => state.auth.permissions;

// Export actions
export const { setPermissions } = authSlice.actions;

export default authSlice.reducer;
