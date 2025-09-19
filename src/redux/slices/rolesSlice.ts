import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '@/lib/axios';

// API Response interface
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// Permission actions interface
export interface PermissionActions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  manage: boolean;
}

// Permission interface
export interface ApiPermission {
  id: string;
  resource: string;
  actions: PermissionActions;
  createdAt?: string;
  updatedAt?: string;
}

// API Role interface
export interface ApiRole {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  companyId: string;
  permissions?: ApiPermission[];
}

// Create role data interface
export interface CreateRoleData {
  name: string;
  description?: string;
  companyId: string;
  isDefault?: boolean;
  isActive?: boolean;
  permissions?: Array<{
    resource: string;
    actions: PermissionActions;
  }>;
}

// Update role data interface
export interface UpdateRoleData extends Partial<CreateRoleData> {}

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Transform API role to frontend format
const transformApiRole = (apiRole: ApiRole) => ({
  id: apiRole.id,
  name: apiRole.name,
  description: apiRole.description || '',
  isDefault: apiRole.isDefault,
  isActive: apiRole.isActive !== undefined ? apiRole.isActive : true,
  permissions: apiRole.permissions || [],
  companyId: apiRole.companyId
});

export type Role = ReturnType<typeof transformApiRole>;

export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (_, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      const response: any = await api.get(`/roles`);
      if (response.status === 'error') {
        return rejectWithValue(response.message || response.error || 'Failed to fetch roles');
      }
      return (response?.data || []).map(transformApiRole);
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch roles');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchDefaultRoles = createAsyncThunk(
  'roles/fetchDefaultRoles',
  async (_, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      const response: any = await api.get(`/roles/default`);
      if (response.status === 'error') {
        return rejectWithValue(response.message || response.error || 'Failed to fetch default roles');
      }
      return (response?.items || []).map(transformApiRole);
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch default roles');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Fetch permissions by role ID
export const fetchPermissionsByRole = createAsyncThunk(
  'roles/fetchPermissionsByRole',
  async (roleId: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/roles/${roleId}/permissions`);
      if (response.status === 'error') {
        return rejectWithValue(response.message || response.error || 'Failed to fetch permissions');
      }
      console.log("Fetched permissions for role ID:", roleId, response.data);
      
      return response.data as ApiPermission[];
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch permissions');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Create a new role
export const createRole = createAsyncThunk(
  'roles/createRole',
  async (roleData: CreateRoleData, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      // Add companyId to the role data
      const roleWithCompany = {
        ...roleData,
        companyId,
        isDefault: roleData.isDefault || false,
        isActive: roleData.isActive !== undefined ? roleData.isActive : true
      };
      
      const response: any = await api.post('/roles', roleWithCompany);
      if (response.status === 'error') {
        return rejectWithValue(response.message || response.error || 'Failed to create role');
      }
      
      return transformApiRole(response.data);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create role');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Update a role
export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async ({ id, roleData }: { id: string; roleData: UpdateRoleData }, { rejectWithValue }) => {
    try {
      const response: any = await api.patch(`/roles/${id}`, roleData);
      if (response.status === 'error') {
        return rejectWithValue(response.message || response.error || 'Failed to update role');
      }
      
      return transformApiRole(response.data);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update role');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Delete a role
export const deleteRole = createAsyncThunk(
  'roles/deleteRole',
  async (roleId: string, { rejectWithValue }) => {
    try {
      const response: any = await api.delete(`/roles/${roleId}`);
      console.log('delete role response', response);
      
      if (response.status === 'error') {
        return rejectWithValue(response.message || response.error || 'Failed to delete role');
      }
      
      return roleId;
    } catch (error: any) {
      if (error.response) {
        const apiError = error.response as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete role');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Assign permissions to a role
export const assignPermissionsToRole = createAsyncThunk(
  'roles/assignPermissionsToRole',
  async ({ roleId, permissions }: { roleId: string; permissions: Array<{ resource: string; actions: PermissionActions }> }, { rejectWithValue }) => {
    try {
      const response: any = await api.post(`/roles/${roleId}/permissions`, { permissions });
      if (response.status === 'error') {
        return rejectWithValue(response.message || response.error || 'Failed to assign permissions');
      }
      
      return transformApiRole(response.data);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to assign permissions');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

interface RolesState {
  roles: Role[];
  currentRolePermissions: ApiPermission[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: RolesState = {
  roles: [],
  currentRolePermissions: null,
  loading: false,
  error: null,
};

export const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRolePermissions: (state, action) => {
      state.currentRolePermissions = action.payload;
    },
    clearCurrentRolePermissions: (state) => {
      state.currentRolePermissions = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        console.log("roles in fetchRoles.fulfilled", action.payload);
        
        state.roles = action.payload;
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch default roles
      .addCase(fetchDefaultRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDefaultRoles.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchDefaultRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch permissions by role
      .addCase(fetchPermissionsByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissionsByRole.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRolePermissions = action.payload;
        state.error = null;
      })
      .addCase(fetchPermissionsByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create role
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles.push(action.payload);
        state.error = null;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update role
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete role
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter(role => role.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Assign permissions
      .addCase(assignPermissionsToRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignPermissionsToRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(assignPermissionsToRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, setCurrentRolePermissions, clearCurrentRolePermissions } = rolesSlice.actions;

// Selectors
export const selectAllRoles = (state: RootState) => state.roles.roles;
export const selectRoleById = (id: string) => (state: RootState) => 
  state.roles.roles.find(role => role.id === id);
export const selectRolesLoading = (state: RootState) => state.roles.loading;
export const selectRolesError = (state: RootState) => state.roles.error;
export const selectCurrentRolePermissions = (state: RootState) => state.roles.currentRolePermissions;

export default rolesSlice.reducer;