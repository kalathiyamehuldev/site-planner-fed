
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Mock data for invoices
const initialInvoices = [
  {
    id: "INV-2023-001",
    projectId: "p1",
    projectName: "Modern Loft Redesign",
    clientId: "c1",
    clientName: "Jane Cooper",
    clientEmail: "jane.cooper@example.com",
    clientAddress: "123 Main St, San Francisco, CA 94105",
    invoiceDate: "2023-08-15",
    dueDate: "2023-09-15",
    status: "Paid" as const,
    items: [
      { id: "i1", description: "Design Consultation", quantity: 1, rate: 150, amount: 150, type: "service" as const },
      { id: "i2", description: "Floor Plan Creation", quantity: 1, rate: 500, amount: 500, type: "service" as const },
      { id: "i3", description: "Modern Leather Sofa", quantity: 1, rate: 2499.99, amount: 2499.99, type: "product" as const },
    ],
    subtotal: 3149.99,
    taxRate: 8.5,
    taxAmount: 267.75,
    total: 3417.74,
    amountPaid: 3417.74,
    notes: "Thank you for your business!",
    paymentTerms: "Due in 30 days",
  },
  {
    id: "INV-2023-002",
    projectId: "p2",
    projectName: "Coastal Vacation Home",
    clientId: "c2",
    clientName: "Michael Scott",
    clientEmail: "michael.scott@example.com",
    clientAddress: "1725 Slough Ave, Scranton, PA 18503",
    invoiceDate: "2023-08-20",
    dueDate: "2023-09-20",
    status: "Unpaid" as const,
    items: [
      { id: "i4", description: "Initial Concept Development", quantity: 1, rate: 800, amount: 800, type: "service" as const },
      { id: "i5", description: "Material Selection", quantity: 1, rate: 350, amount: 350, type: "service" as const },
      { id: "i6", description: "Glass Coffee Table", quantity: 1, rate: 799.99, amount: 799.99, type: "product" as const },
    ],
    subtotal: 1949.99,
    taxRate: 6,
    taxAmount: 117,
    total: 2066.99,
    amountPaid: 0,
    notes: "First invoice for the Coastal Vacation Home project",
    paymentTerms: "Due in 30 days",
  },
  {
    id: "INV-2023-003",
    projectId: "p3",
    projectName: "Corporate Office Revamp",
    clientId: "c3",
    clientName: "Acme Corp",
    clientEmail: "billing@acmecorp.com",
    clientAddress: "456 Business Ave, Chicago, IL 60601",
    invoiceDate: "2023-08-25",
    dueDate: "2023-09-25",
    status: "Partially Paid" as const,
    items: [
      { id: "i7", description: "Space Planning", quantity: 1, rate: 1200, amount: 1200, type: "service" as const },
      { id: "i8", description: "3D Rendering", quantity: 1, rate: 1500, amount: 1500, type: "service" as const },
      { id: "i9", description: "Project Management (50% retainer)", quantity: 1, rate: 2500, amount: 2500, type: "service" as const },
    ],
    subtotal: 5200,
    taxRate: 9.5,
    taxAmount: 494,
    total: 5694,
    amountPaid: 2847,
    notes: "50% deposit received. Balance due upon completion.",
    paymentTerms: "50% upfront, 50% upon completion",
  },
  {
    id: "INV-2023-004",
    projectId: "p1",
    projectName: "Modern Loft Redesign",
    clientId: "c1",
    clientName: "Jane Cooper",
    clientEmail: "jane.cooper@example.com",
    clientAddress: "123 Main St, San Francisco, CA 94105",
    invoiceDate: "2023-09-01",
    dueDate: "2023-10-01",
    status: "Draft" as const,
    items: [
      { id: "i10", description: "Lighting Design", quantity: 1, rate: 750, amount: 750, type: "service" as const },
      { id: "i11", description: "Pendant Light Fixtures (3)", quantity: 3, rate: 349.99, amount: 1049.97, type: "product" as const },
    ],
    subtotal: 1799.97,
    taxRate: 8.5,
    taxAmount: 153,
    total: 1952.97,
    amountPaid: 0,
    notes: "Second invoice for the Modern Loft project focusing on lighting design and fixtures",
    paymentTerms: "Due in 30 days",
  },
  {
    id: "INV-2023-005",
    projectId: "p5",
    projectName: "Restaurant Interior",
    clientId: "c5",
    clientName: "Fine Dining Inc.",
    clientEmail: "accounts@finedining.com",
    clientAddress: "789 Gourmet Blvd, Los Angeles, CA 90028",
    invoiceDate: "2023-09-05",
    dueDate: "2023-10-05",
    status: "Overdue" as const,
    items: [
      { id: "i12", description: "Concept Development", quantity: 1, rate: 1800, amount: 1800, type: "service" as const },
      { id: "i13", description: "Material Board Creation", quantity: 1, rate: 500, amount: 500, type: "service" as const },
      { id: "i14", description: "Furniture Specification", quantity: 1, rate: 1200, amount: 1200, type: "service" as const },
    ],
    subtotal: 3500,
    taxRate: 9,
    taxAmount: 315,
    total: 3815,
    amountPaid: 0,
    notes: "Payment is overdue. Please remit as soon as possible.",
    paymentTerms: "Due in 30 days",
  }
];

export type Invoice = typeof initialInvoices[0];
export type InvoiceStatus = 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
export type InvoiceItem = typeof initialInvoices[0]['items'][0];
export type InvoiceItemType = 'service' | 'product' | 'time' | 'other';

interface InvoicesState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
}

const initialState: InvoicesState = {
  invoices: initialInvoices,
  selectedInvoice: null,
  loading: false,
  error: null
};

export const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    getInvoices: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedInvoice: (state, action: PayloadAction<string>) => {
      state.selectedInvoice = state.invoices.find(invoice => invoice.id === action.payload) || null;
    },
    clearSelectedInvoice: (state) => {
      state.selectedInvoice = null;
    },
    addInvoice: (state, action: PayloadAction<Omit<Invoice, 'id'>>) => {
      // Generate invoice number in format INV-YYYY-XXX
      const year = new Date().getFullYear();
      const lastInvoiceNum = state.invoices
        .filter(inv => inv.id.includes(`INV-${year}`))
        .length + 1;
      
      const newInvoice = {
        ...action.payload,
        id: `INV-${year}-${lastInvoiceNum.toString().padStart(3, '0')}`,
      };
      
      state.invoices.push(newInvoice);
    },
    updateInvoice: (state, action: PayloadAction<{ id: string; invoice: Partial<Invoice> }>) => {
      const { id, invoice } = action.payload;
      const index = state.invoices.findIndex(inv => inv.id === id);
      if (index !== -1) {
        state.invoices[index] = { ...state.invoices[index], ...invoice };
        if (state.selectedInvoice?.id === id) {
          state.selectedInvoice = state.invoices[index];
        }
      }
    },
    deleteInvoice: (state, action: PayloadAction<string>) => {
      state.invoices = state.invoices.filter(invoice => invoice.id !== action.payload);
      if (state.selectedInvoice?.id === action.payload) {
        state.selectedInvoice = null;
      }
    },
    addInvoiceItem: (state, action: PayloadAction<{ invoiceId: string; item: Omit<InvoiceItem, 'id'> }>) => {
      const { invoiceId, item } = action.payload;
      const invoice = state.invoices.find(inv => inv.id === invoiceId);
      
      if (invoice) {
        const newItem = {
          ...item,
          id: `i${invoice.items.length + 1}${Math.random().toString(36).substring(2, 5)}`,
        };
        
        invoice.items.push(newItem);
        
        // Recalculate invoice totals
        invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
        invoice.taxAmount = invoice.subtotal * (invoice.taxRate / 100);
        invoice.total = invoice.subtotal + invoice.taxAmount;
        
        if (state.selectedInvoice?.id === invoiceId) {
          state.selectedInvoice = invoice;
        }
      }
    },
    updateInvoiceItem: (state, action: PayloadAction<{ 
      invoiceId: string; 
      itemId: string; 
      item: Partial<InvoiceItem> 
    }>) => {
      const { invoiceId, itemId, item } = action.payload;
      const invoice = state.invoices.find(inv => inv.id === invoiceId);
      
      if (invoice) {
        const itemIndex = invoice.items.findIndex(i => i.id === itemId);
        
        if (itemIndex !== -1) {
          invoice.items[itemIndex] = { ...invoice.items[itemIndex], ...item };
          
          // If quantity or rate changed, recalculate amount
          if (item.quantity !== undefined || item.rate !== undefined) {
            invoice.items[itemIndex].amount = 
              invoice.items[itemIndex].quantity * invoice.items[itemIndex].rate;
          }
          
          // Recalculate invoice totals
          invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
          invoice.taxAmount = invoice.subtotal * (invoice.taxRate / 100);
          invoice.total = invoice.subtotal + invoice.taxAmount;
          
          if (state.selectedInvoice?.id === invoiceId) {
            state.selectedInvoice = invoice;
          }
        }
      }
    },
    deleteInvoiceItem: (state, action: PayloadAction<{ invoiceId: string; itemId: string }>) => {
      const { invoiceId, itemId } = action.payload;
      const invoice = state.invoices.find(inv => inv.id === invoiceId);
      
      if (invoice) {
        invoice.items = invoice.items.filter(item => item.id !== itemId);
        
        // Recalculate invoice totals
        invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
        invoice.taxAmount = invoice.subtotal * (invoice.taxRate / 100);
        invoice.total = invoice.subtotal + invoice.taxAmount;
        
        if (state.selectedInvoice?.id === invoiceId) {
          state.selectedInvoice = invoice;
        }
      }
    },
    recordPayment: (state, action: PayloadAction<{ 
      invoiceId: string; 
      amount: number; 
      date: string;
      notes?: string;
    }>) => {
      const { invoiceId, amount } = action.payload;
      const invoice = state.invoices.find(inv => inv.id === invoiceId);
      
      if (invoice) {
        invoice.amountPaid += amount;
        
        // Update invoice status based on payment
        if (invoice.amountPaid >= invoice.total) {
          invoice.status = 'Paid';
        } else if (invoice.amountPaid > 0) {
          invoice.status = 'Partially Paid';
        }
        
        if (state.selectedInvoice?.id === invoiceId) {
          state.selectedInvoice = invoice;
        }
      }
    }
  }
});

export const { 
  getInvoices, 
  setSelectedInvoice, 
  clearSelectedInvoice, 
  addInvoice, 
  updateInvoice, 
  deleteInvoice,
  addInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
  recordPayment
} = invoicesSlice.actions;

export const selectAllInvoices = (state: RootState) => state.invoices.invoices;
export const selectSelectedInvoice = (state: RootState) => state.invoices.selectedInvoice;
export const selectInvoiceById = (id: string) => (state: RootState) => 
  state.invoices.invoices.find(invoice => invoice.id === id);
export const selectInvoicesByProject = (projectId: string) => (state: RootState) => 
  state.invoices.invoices.filter(invoice => invoice.projectId === projectId);
export const selectInvoicesByStatus = (status: InvoiceStatus) => (state: RootState) => 
  state.invoices.invoices.filter(invoice => invoice.status === status);
export const selectInvoicesByClient = (clientId: string) => (state: RootState) => 
  state.invoices.invoices.filter(invoice => invoice.clientId === clientId);
export const selectUnpaidInvoices = (state: RootState) => 
  state.invoices.invoices.filter(invoice => ['Unpaid', 'Partially Paid', 'Overdue'].includes(invoice.status));
export const selectInvoiceTotals = (state: RootState) => {
  const invoices = state.invoices.invoices;
  return {
    total: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    paid: invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0),
    outstanding: invoices.reduce((sum, invoice) => sum + (invoice.total - invoice.amountPaid), 0),
  };
};

export default invoicesSlice.reducer;
