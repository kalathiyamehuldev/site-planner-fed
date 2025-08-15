import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Types
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  isActive: boolean;
  companyId: string;
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
}

export interface CreateMemberData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  password: string;
  companyId: string;
}

export interface UpdateMemberData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: string;
  isActive?: boolean;
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
}

export interface UpdateVendorData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
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
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
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
      
      const response = await api.get(`/company/members?companyId=${companyId}`);
       return response as unknown as Member[];
    } catch (error) {
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
       });
       return response as unknown as Member;
    } catch (error) {
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
      
      const response = await api.patch(`/company/members/${id}?companyId=${companyId}`, data);
       return response as unknown as Member;
    } catch (error) {
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
      
      await api.delete(`/company/members/${id}?companyId=${companyId}`);
      return id;
    } catch (error) {
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
      
      const response = await api.get(`/company/vendors?companyId=${companyId}`);
       return response as unknown as Vendor[];
    } catch (error) {
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
       });
       return response as unknown as Vendor;
    } catch (error) {
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
      
      const response = await api.patch(`/company/vendors/${id}?companyId=${companyId}`, data);
       return response as unknown as Vendor;
    } catch (error) {
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
      
      await api.delete(`/company/vendors/${id}?companyId=${companyId}`);
      return id;
    } catch (error) {
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
      
      const response = await api.get(`/company/customers?companyId=${companyId}`);
       return response as unknown as Customer[];
    } catch (error) {
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
      
      const response = await api.post(`/company/customers?companyId=${companyId}`, {
         ...customerData,
         companyId
       });
       return response as unknown as Customer;
    } catch (error) {
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
      
      const response = await api.patch(`/company/customers/${id}?companyId=${companyId}`, data);
       return response as unknown as Customer;
    } catch (error) {
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
      
      await api.delete(`/company/customers/${id}?companyId=${companyId}`);
      return id;
    } catch (error) {
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
        state.members.items.push(action.payload);
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
        const index = state.members.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.members.items[index] = action.payload;
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
        state.members.items = state.members.items.filter(item => item.id !== action.payload);
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
        state.vendors.items.push(action.payload);
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
        const index = state.vendors.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.vendors.items[index] = action.payload;
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
        state.vendors.items = state.vendors.items.filter(item => item.id !== action.payload);
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
        state.customers.items.push(action.payload);
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
        const index = state.customers.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.customers.items[index] = action.payload;
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
        state.customers.items = state.customers.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload as string;
      });
  },
});

export const { clearMembersError, clearVendorsError, clearCustomersError } = adminSlice.actions;
export default adminSlice.reducer;