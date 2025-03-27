
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Mock data for contacts
const initialContacts = [
  {
    id: "c1",
    name: "Jane Cooper",
    type: "Client",
    company: "Cooper Design Studio",
    email: "jane.cooper@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, San Francisco, CA 94105",
    isFavorite: true,
    notes: "Prefers modern design styles",
    website: "cooperdesign.com",
    image: null
  },
  {
    id: "c2",
    name: "Michael Scott",
    type: "Client",
    company: "Dunder Mifflin",
    email: "michael.scott@example.com",
    phone: "(555) 234-5678",
    address: "1725 Slough Ave, Scranton, PA 18503",
    isFavorite: false,
    notes: "Likes bold colors and statement pieces",
    website: "dundermifflin.com",
    image: null
  },
  {
    id: "c3",
    name: "Sarah Williams",
    type: "Vendor",
    company: "Modern Furnishings Inc.",
    email: "sarah@modernfurnishings.com",
    phone: "(555) 345-6789",
    address: "456 Market St, Seattle, WA 98101",
    isFavorite: true,
    notes: "Great selection of contemporary furniture",
    website: "modernfurnishings.com",
    image: null
  },
  {
    id: "c4",
    name: "Robert Johnson",
    type: "Contractor",
    company: "Johnson & Sons Construction",
    email: "robert@johnsonconst.com",
    phone: "(555) 456-7890",
    address: "789 Builder Ave, Portland, OR 97205",
    isFavorite: false,
    notes: "Specializes in high-end residential renovations",
    website: "johnsonconst.com",
    image: null
  },
  {
    id: "c5",
    name: "Emily Chen",
    type: "Architect",
    company: "Chen Architecture",
    email: "emily@chenarch.com",
    phone: "(555) 567-8901",
    address: "321 Design Blvd, Chicago, IL 60601",
    isFavorite: false,
    notes: "Collaborative partner for complex projects",
    website: "chenarchitecture.com",
    image: null
  },
  {
    id: "c6",
    name: "David Miller",
    type: "Vendor",
    company: "Luxe Lighting Solutions",
    email: "david@luxelighting.com",
    phone: "(555) 678-9012",
    address: "555 Illumination Way, Los Angeles, CA 90028",
    isFavorite: true,
    notes: "Custom lighting designs and fixtures",
    website: "luxelighting.com",
    image: null
  },
];

export type Contact = typeof initialContacts[0];
export type ContactType = 'Client' | 'Vendor' | 'Contractor' | 'Architect' | 'Other';

interface ContactsState {
  contacts: Contact[];
  selectedContact: Contact | null;
  loading: boolean;
  error: string | null;
}

const initialState: ContactsState = {
  contacts: initialContacts,
  selectedContact: null,
  loading: false,
  error: null
};

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    getContacts: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedContact: (state, action: PayloadAction<string>) => {
      state.selectedContact = state.contacts.find(contact => contact.id === action.payload) || null;
    },
    clearSelectedContact: (state) => {
      state.selectedContact = null;
    },
    addContact: (state, action: PayloadAction<Omit<Contact, 'id'>>) => {
      const newContact = {
        ...action.payload,
        id: `c${state.contacts.length + 1}`,
      };
      state.contacts.push(newContact);
    },
    updateContact: (state, action: PayloadAction<{ id: string; contact: Partial<Contact> }>) => {
      const { id, contact } = action.payload;
      const index = state.contacts.findIndex(c => c.id === id);
      if (index !== -1) {
        state.contacts[index] = { ...state.contacts[index], ...contact };
        if (state.selectedContact?.id === id) {
          state.selectedContact = state.contacts[index];
        }
      }
    },
    deleteContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter(contact => contact.id !== action.payload);
      if (state.selectedContact?.id === action.payload) {
        state.selectedContact = null;
      }
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const contact = state.contacts.find(c => c.id === action.payload);
      if (contact) {
        contact.isFavorite = !contact.isFavorite;
      }
    }
  }
});

export const { 
  getContacts, 
  setSelectedContact, 
  clearSelectedContact, 
  addContact, 
  updateContact, 
  deleteContact,
  toggleFavorite
} = contactsSlice.actions;

export const selectAllContacts = (state: RootState) => state.contacts.contacts;
export const selectSelectedContact = (state: RootState) => state.contacts.selectedContact;
export const selectContactById = (id: string) => (state: RootState) => 
  state.contacts.contacts.find(contact => contact.id === id);
export const selectContactsByType = (type: ContactType) => (state: RootState) => 
  state.contacts.contacts.filter(contact => contact.type === type);
export const selectFavoriteContacts = (state: RootState) => 
  state.contacts.contacts.filter(contact => contact.isFavorite);

export default contactsSlice.reducer;
