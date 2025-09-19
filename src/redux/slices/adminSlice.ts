import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// API Response interface
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// Types
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: {
    id: string;
    name: string;
  };
  isActive: boolean;
  companyId: string;
  projectIds: string[];
  projectMembers?: {
    project: {
      id: string;
      name: string;
    };
    role: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  projectIds?: string[];
  projects?: { project: {id: string; name: string} }[];
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  projectIds?: string[];
  projects?: { project: {id: string; name: string} }[];
}

export interface CreateMemberData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  roleId: string;
  password: string;
  companyId: string;
  projectIds?: string[];
}

export interface UpdateMemberData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  roleId?: string;
  isActive?: boolean;
  projectIds?: string[];
}

export interface CreateVendorData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
  password: string;
  companyId: string;
  tags?: string[];
  projectIds?: string[];
}

export interface UpdateVendorData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  tags?: string[];
  projectIds?: string[];
}

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
  password: string;
  companyId: string;
  projectIds?: string[];
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  projectIds?: string[];
}

interface AdminState {
  members: {
    items: Member[];
    loading: boolean;
    error: string | null;
  };
  vendors: {
    items: Vendor[];
    loading: boolean;
    error: string | null;
  };
  customers: {
    items: Customer[];
    loading: boolean;
    error: string | null;
  };
  tags: {
    items: Tag[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: AdminState = {
  members: {
    items: [],
    loading: false,
    error: null,
  },
  vendors: {
    items: [],
    loading: false,
    error: null,
  },
  customers: {
    items: [],
    loading: false,
    error: null,
  },
  tags: {
    items: [],
    loading: false,
    error: null,
  },
};

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Member async thunks
export const fetchMembers = createAsyncThunk(
  'admin/fetchMembers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.get(`/company/members?companyId=${companyId}`) as ApiResponse<Member[]>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch members');
      }
      
      return response.data || [];
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch members');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createMember = createAsyncThunk(
  'admin/createMember',
  async (memberData: Omit<CreateMemberData, 'companyId'>, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.post(`/company/members`, {
         ...memberData,
         companyId
       }) as ApiResponse<Member>;
       
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create member');
      }
      
      return { data: response.data!, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create member');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateMember = createAsyncThunk(
  'admin/updateMember',
  async ({ id, data }: { id: string; data: UpdateMemberData }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.patch(`/company/members/${id}?companyId=${companyId}`, data) as ApiResponse<Member>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update member');
      }
      
      return { data: response.data!, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update member');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const deleteMember = createAsyncThunk(
  'admin/deleteMember',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.delete(`/company/members/${id}?companyId=${companyId}`) as ApiResponse<null>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete member');
      }
      
      return { id, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete member');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Vendor async thunks
export const fetchVendors = createAsyncThunk(
  'admin/fetchVendors',
  async (_, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.get(`/company/vendors?companyId=${companyId}`) as ApiResponse<Vendor[]>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch vendors');
      }
      
      return response.data || [];
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch vendors');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createVendor = createAsyncThunk(
  'admin/createVendor',
  async (vendorData: Omit<CreateVendorData, 'companyId'>, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.post(`/company/vendors`, {
         ...vendorData,
         companyId
       }) as ApiResponse<Vendor>;
       
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create vendor');
      }
      
      return { data: response.data!, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create vendor');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateVendor = createAsyncThunk(
  'admin/updateVendor',
  async ({ id, data }: { id: string; data: UpdateVendorData }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.patch(`/company/vendors/${id}?companyId=${companyId}`, data) as ApiResponse<Vendor>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update vendor');
      }
      
      return { data: response.data!, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update vendor');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const deleteVendor = createAsyncThunk(
  'admin/deleteVendor',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.delete(`/company/vendors/${id}?companyId=${companyId}`) as ApiResponse<null>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete vendor');
      }
      
      return { id, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete vendor');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Customer async thunks
export const fetchCustomers = createAsyncThunk(
  'admin/fetchCustomers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.get(`/company/customers?companyId=${companyId}`) as ApiResponse<Customer[]>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch customers');
      }
      
      return response.data || [];
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch customers');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createCustomer = createAsyncThunk(
  'admin/createCustomer',
  async (customerData: Omit<CreateCustomerData, 'companyId'>, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.post(`/company/customers`, {
         ...customerData,
         companyId
       }) as ApiResponse<Customer>;
       
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create customer');
      }
      
      return { data: response.data!, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create customer');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'admin/updateCustomer',
  async ({ id, data }: { id: string; data: UpdateCustomerData }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.patch(`/company/customers/${id}?companyId=${companyId}`, data) as ApiResponse<Customer>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update customer');
      }
      
      return { data: response.data!, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update customer');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  'admin/deleteCustomer',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.delete(`/company/customers/${id}?companyId=${companyId}`) as ApiResponse<null>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete customer');
      }
      
      return { id, message: response.message };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete customer');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Tag async thunks
export const fetchTags = createAsyncThunk(
  'admin/fetchTags',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tags') as ApiResponse<Tag[]>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch tags');
      }
      
      return response.data || [];
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch tags');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createTag = createAsyncThunk(
  'admin/createTag',
  async (tagData: { name: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/tags', tagData) as ApiResponse<Tag>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create tag');
      }
      
      return response.data!;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create tag');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const searchTags = createAsyncThunk(
  'admin/searchTags',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tags/search?q=${encodeURIComponent(query)}`) as ApiResponse<Tag[]>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to search tags');
      }
      
      return response.data || [];
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to search tags');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Admin slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearMembersError: (state) => {
      state.members.error = null;
    },
    clearVendorsError: (state) => {
      state.vendors.error = null;
    },
    clearCustomersError: (state) => {
      state.customers.error = null;
    },
  },
  extraReducers: (builder) => {
    // Members
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.members.loading = true;
        state.members.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.members.loading = false;
        state.members.items = action.payload;
        state.members.error = null;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.members.loading = false;
        state.members.error = action.payload as string;
      })
      .addCase(createMember.pending, (state) => {
        state.members.loading = true;
        state.members.error = null;
      })
      .addCase(createMember.fulfilled, (state, action) => {
        state.members.loading = false;
        state.members.items.push(action.payload.data);
        state.members.error = null;
      })
      .addCase(createMember.rejected, (state, action) => {
        state.members.loading = false;
        state.members.error = action.payload as string;
      })
      .addCase(updateMember.pending, (state) => {
        state.members.loading = true;
        state.members.error = null;
      })
      .addCase(updateMember.fulfilled, (state, action) => {
        state.members.loading = false;
        const index = state.members.items.findIndex(item => item.id === action.payload.data.id);
        if (index !== -1) {
          state.members.items[index] = action.payload.data;
        }
        state.members.error = null;
      })
      .addCase(updateMember.rejected, (state, action) => {
        state.members.loading = false;
        state.members.error = action.payload as string;
      })
      .addCase(deleteMember.pending, (state) => {
        state.members.loading = true;
        state.members.error = null;
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        state.members.loading = false;
        state.members.items = state.members.items.filter(item => item.id !== action.payload.id);
      })
      .addCase(deleteMember.rejected, (state, action) => {
        state.members.loading = false;
        state.members.error = action.payload as string;
      })
      // Vendors
      .addCase(fetchVendors.pending, (state) => {
        state.vendors.loading = true;
        state.vendors.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.vendors.loading = false;
        state.vendors.items = action.payload;
        state.vendors.error = null;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.vendors.loading = false;
        state.vendors.error = action.payload as string;
      })
      .addCase(createVendor.pending, (state) => {
        state.vendors.loading = true;
        state.vendors.error = null;
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.vendors.loading = false;
        state.vendors.items.push(action.payload.data);
        state.vendors.error = null;
      })
      .addCase(createVendor.rejected, (state, action) => {
        state.vendors.loading = false;
        state.vendors.error = action.payload as string;
      })
      .addCase(updateVendor.pending, (state) => {
        state.vendors.loading = true;
        state.vendors.error = null;
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.vendors.loading = false;
        const index = state.vendors.items.findIndex(item => item.id === action.payload.data.id);
        if (index !== -1) {
          state.vendors.items[index] = action.payload.data;
        }
        state.vendors.error = null;
      })
      .addCase(updateVendor.rejected, (state, action) => {
        state.vendors.loading = false;
        state.vendors.error = action.payload as string;
      })
      .addCase(deleteVendor.pending, (state) => {
        state.vendors.loading = true;
        state.vendors.error = null;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.vendors.loading = false;
        state.vendors.items = state.vendors.items.filter(item => item.id !== action.payload.id);
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        state.vendors.loading = false;
        state.vendors.error = action.payload as string;
      })
      // Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.customers.loading = true;
        state.customers.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers.loading = false;
        state.customers.items = action.payload;
        state.customers.error = null;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload as string;
      })
      .addCase(createCustomer.pending, (state) => {
        state.customers.loading = true;
        state.customers.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.loading = false;
        state.customers.items.push(action.payload.data);
        state.customers.error = null;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload as string;
      })
      .addCase(updateCustomer.pending, (state) => {
        state.customers.loading = true;
        state.customers.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.customers.loading = false;
        const index = state.customers.items.findIndex(item => item.id === action.payload.data.id);
        if (index !== -1) {
          state.customers.items[index] = action.payload.data;
        }
        state.customers.error = null;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload as string;
      })
      .addCase(deleteCustomer.pending, (state) => {
        state.customers.loading = true;
        state.customers.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers.loading = false;
        state.customers.items = state.customers.items.filter(item => item.id !== action.payload.id);
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload as string;
      })
      // Tags
      .addCase(fetchTags.pending, (state) => {
        state.tags.loading = true;
        state.tags.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.tags.loading = false;
        state.tags.items = action.payload;
        state.tags.error = null;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.tags.loading = false;
        state.tags.error = action.payload as string;
      })
      .addCase(createTag.pending, (state) => {
        state.tags.loading = true;
        state.tags.error = null;
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.tags.loading = false;
        state.tags.items.push(action.payload);
        state.tags.error = null;
      })
      .addCase(createTag.rejected, (state, action) => {
        state.tags.loading = false;
        state.tags.error = action.payload as string;
      })
      .addCase(searchTags.pending, (state) => {
        state.tags.loading = true;
        state.tags.error = null;
      })
      .addCase(searchTags.fulfilled, (state, action) => {
        state.tags.loading = false;
        state.tags.items = action.payload;
        state.tags.error = null;
      })
      .addCase(searchTags.rejected, (state, action) => {
        state.tags.loading = false;
        state.tags.error = action.payload as string;
      });
  },
});

export const { clearMembersError, clearVendorsError, clearCustomersError } = adminSlice.actions;
export default adminSlice.reducer;