
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// API Response interface
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// Interfaces
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  type: 'client' | 'vendor' | 'partner';
  isFavorite: boolean;
  projects?: string[];
  projectIds?: string[];
  projectsData?: Array<{ id: string; name: string }>;
  lastContact?: string;
  notes?: string;
  companyId: string;
  tags?: Array<{ id: string; name: string }>;
  vendorTags?: Array<{ id: string; name: string }>;
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactApiResponse {
  success: boolean;
  message: string;
  data: Contact;
}

export interface ContactsApiResponse {
  success: boolean;
  message: string;
  data: {
    contacts: Contact[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface ContactFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'client' | 'vendor' | 'partner';
  isFavorite?: boolean;
}

export interface CreateContactDto {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  type: 'Client' | 'Vendor' | 'Architect';
  isFavorite?: boolean;
  notes?: string;
  projectIds?: string[];
  tagIds?: string[];
  vendorId?: string;
}

export interface UpdateContactDto extends Partial<CreateContactDto> { }

// Helper functions
const transformApiContact = (apiContact: any): Contact => {
  return {
    id: apiContact.id,
    name: apiContact.name,
    email: apiContact.email,
    phone: apiContact.phone,
    company: apiContact.company,
    position: apiContact.position,
    type: apiContact.type,
    isFavorite: apiContact.isFavorite,
    projects: apiContact.projects?.map((p: any) => p.name) || [],
    lastContact: apiContact.lastContact,
    notes: apiContact.notes,
    companyId: apiContact.companyId,
    tags: apiContact.tags || [],
    vendorTags: apiContact.vendorTags || [],
    vendorId: apiContact.vendorId,
    createdAt: apiContact.createdAt,
    updatedAt: apiContact.updatedAt,
  };
};

const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Async thunks
export const fetchAllContactsByCompany = createAsyncThunk(
  'contacts/fetchAllContactsByCompany',
  async (params: ContactFilterParams = {}, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }

      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
        companyId,
        ...(params.search && { search: params.search }),
        ...(params.type && { type: params.type }),
        ...(params.isFavorite !== undefined && { isFavorite: params.isFavorite.toString() }),
      });
      const response = await api.get(`/contacts?${queryParams.toString()}`) as ApiResponse<{
        items: Contact[];
        total: number;
        page: number;
        limit: number;
      }>;
      if (response.status === 'success' && response.data) {
        return {
          contacts: response.data.items.map(transformApiContact),
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch contacts');
      }
    } catch (error: any) {
      console.log("error", error)
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch contacts');
    }
  }
);

export const fetchContactsByProject = createAsyncThunk(
  'contacts/fetchContactsByProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/contacts/project/${projectId}`) as ApiResponse<Contact[]>;
      if (response.status === 'success' && response.data) {
        return response.data.map(transformApiContact);
      } else {
        return rejectWithValue(response.message || 'Failed to fetch project contacts');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project contacts');
    }
  }
);

export const fetchContactById = createAsyncThunk(
  'contacts/fetchContactById',
  async (contactId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/contacts/${contactId}`) as ApiResponse<Contact>;
      if (response.status === 'success' && response.data) {
        return transformApiContact(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to fetch contact');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contact');
    }
  }
);

export const createContactAsync = createAsyncThunk(
  'contacts/createContact',
  async (contactData: CreateContactDto, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      const response = await api.post('/contacts', {
        ...contactData,
        companyId
      }) as ApiResponse<Contact>;
      if (response.status === 'success' && response.data) {
        return transformApiContact(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to create contact');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create contact');
    }
  }
);

export const updateContactAsync = createAsyncThunk(
  'contacts/updateContact',
  async ({ id, data }: { id: string; data: UpdateContactDto }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/contacts/${id}`, data) as ApiResponse<Contact>;
      if (response.status === 'success' && response.data) {
        return transformApiContact(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to update contact');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update contact');
    }
  }
);

export const deleteContactAsync = createAsyncThunk(
  'contacts/deleteContact',
  async (contactId: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/contacts/${contactId}`) as ApiResponse;
      if (response.status === 'success') {
        return contactId;
      } else {
        return rejectWithValue(response.message || 'Failed to delete contact');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete contact');
    }
  }
);

export const addContactToProjectAsync = createAsyncThunk(
  'contacts/addContactToProject',
  async ({ contactId, projectId }: { contactId: string; projectId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/contacts/${contactId}/projects/${projectId}`) as ApiResponse<Contact>;
      if (response.status === 'success' && response.data) {
        return transformApiContact(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to add contact to project');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add contact to project');
    }
  }
);

export const removeContactFromProjectAsync = createAsyncThunk(
  'contacts/removeContactFromProject',
  async ({ contactId, projectId }: { contactId: string; projectId: string }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/contacts/${contactId}/projects/${projectId}`) as ApiResponse<Contact>;
      if (response.status === 'success' && response.data) {
        return transformApiContact(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to remove contact from project');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove contact from project');
    }
  }
);

export type ContactType = 'Client' | 'Vendor' | 'Contractor' | 'Architect' | 'Other';

interface ContactsState {
  contacts: Contact[];
  projectContacts: Contact[];
  selectedContact: Contact | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: ContactsState = {
  contacts: [],
  projectContacts: [],
  selectedContact: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => {
      state.selectedContact = action.payload;
    },
    clearSelectedContact: (state) => {
      state.selectedContact = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all contacts by company
      .addCase(fetchAllContactsByCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllContactsByCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = action.payload.contacts;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchAllContactsByCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch contacts';
      })
      // Fetch contacts by project
      .addCase(fetchContactsByProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContactsByProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projectContacts = action.payload;
      })
      .addCase(fetchContactsByProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch project contacts';
      })
      // Fetch contact by ID
      .addCase(fetchContactById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContactById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedContact = action.payload;
      })
      .addCase(fetchContactById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch contact';
      })
      // Create contact
      .addCase(createContactAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createContactAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createContactAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create contact';
      })
      // Update contact
      .addCase(updateContactAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateContactAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.contacts.findIndex(contact => contact.id === action.payload.id);
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
        if (state.selectedContact?.id === action.payload.id) {
          state.selectedContact = action.payload;
        }
      })
      .addCase(updateContactAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update contact';
      })
      // Delete contact
      .addCase(deleteContactAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteContactAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = state.contacts.filter(contact => contact.id !== action.payload);
        state.total -= 1;
        if (state.selectedContact?.id === action.payload) {
          state.selectedContact = null;
        }
      })
      .addCase(deleteContactAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete contact';
      })
      // Add contact to project
      .addCase(addContactToProjectAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addContactToProjectAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.contacts.findIndex(contact => contact.id === action.payload.id);
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
        if (state.selectedContact?.id === action.payload.id) {
          state.selectedContact = action.payload;
        }
      })
      .addCase(addContactToProjectAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to add contact to project';
      })
      // Remove contact from project
      .addCase(removeContactFromProjectAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeContactFromProjectAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.contacts.findIndex(contact => contact.id === action.payload.id);
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
        if (state.selectedContact?.id === action.payload.id) {
          state.selectedContact = action.payload;
        }
      })
      .addCase(removeContactFromProjectAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to remove contact from project';
      });
  },
});

export const {
  setSelectedContact,
  clearSelectedContact,
  clearError,
} = contactsSlice.actions;

// Selectors
export const selectAllContacts = (state: any) => state.contacts.contacts;
export const selectProjectContacts = (state: any) => state.contacts.projectContacts;
export const selectSelectedContact = (state: any) => state.contacts.selectedContact;
export const selectContactsLoading = (state: any) => state.contacts.isLoading;
export const selectContactsError = (state: any) => state.contacts.error;
export const selectContactsTotal = (state: any) => state.contacts.total;
export const selectContactsPage = (state: any) => state.contacts.page;
export const selectContactsLimit = (state: any) => state.contacts.limit;
export const selectContactById = (id: string) => (state: any) =>
  state.contacts.contacts.find((contact: Contact) => contact.id === id);
export const selectContactsByType = (type: string) => (state: any) =>
  state.contacts.contacts.filter((contact: Contact) => contact.type === type);
export const selectFavoriteContacts = (state: any) =>
  state.contacts.contacts.filter((contact: Contact) => contact.isFavorite);

export default contactsSlice.reducer;
