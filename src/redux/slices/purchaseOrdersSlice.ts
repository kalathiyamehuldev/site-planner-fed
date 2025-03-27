
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Mock data for purchase orders
const initialPurchaseOrders = [
  {
    id: "PO-2023-001",
    vendorId: "v1",
    vendor: "Modern Furnishings Inc.",
    vendorEmail: "orders@modernfurnishings.com",
    vendorAddress: "456 Market St, Seattle, WA 98101",
    vendorPhone: "(555) 345-6789",
    projectId: "p1",
    project: "Modern Loft Redesign",
    date: "2023-08-15",
    deliveryDate: "2023-09-15",
    amount: 4200,
    status: "Delivered" as const,
    items: [
      { id: "poi1", name: "Modular Sofa", quantity: 1, price: 2500, total: 2500 },
      { id: "poi2", name: "Coffee Table", quantity: 1, price: 800, total: 800 },
      { id: "poi3", name: "Floor Lamp", quantity: 3, price: 300, total: 900 }
    ],
    shippingCost: 0,
    notes: "Delivery to client address, installation included",
    paymentTerms: "Net 30",
    trackingNumber: "TRK123456789",
    receivedDate: "2023-09-14",
  },
  {
    id: "PO-2023-002",
    vendorId: "v2",
    vendor: "Artistic Lighting Solutions",
    vendorEmail: "sales@artisticlighting.com",
    vendorAddress: "789 Edison St, Portland, OR 97205",
    vendorPhone: "(555) 456-7890",
    projectId: "p3",
    project: "Corporate Office Revamp",
    date: "2023-08-20",
    deliveryDate: "2023-09-20",
    amount: 3600,
    status: "In Transit" as const,
    items: [
      { id: "poi4", name: "Pendant Lights", quantity: 6, price: 250, total: 1500 },
      { id: "poi5", name: "Recessed Lights", quantity: 12, price: 100, total: 1200 },
      { id: "poi6", name: "Wall Sconces", quantity: 6, price: 150, total: 900 }
    ],
    shippingCost: 0,
    notes: "Special installation requirements, electrician to be present",
    paymentTerms: "Net 30",
    trackingNumber: "TRK987654321",
    receivedDate: null,
  },
  {
    id: "PO-2023-003",
    vendorId: "v3",
    vendor: "Premium Fabric Wholesalers",
    vendorEmail: "orders@premiumfabric.com",
    vendorAddress: "321 Textile Ave, New York, NY 10001",
    vendorPhone: "(555) 567-8901",
    projectId: "p2",
    project: "Coastal Vacation Home",
    date: "2023-08-25",
    deliveryDate: "2023-09-25",
    amount: 1800,
    status: "Processing" as const,
    items: [
      { id: "poi7", name: "Upholstery Fabric", quantity: 20, price: 40, total: 800 },
      { id: "poi8", name: "Drapery Material", quantity: 15, price: 35, total: 525 },
      { id: "poi9", name: "Throw Pillows", quantity: 10, price: 45, total: 450 }
    ],
    shippingCost: 25,
    notes: "Fabric swatches to be sent first for final approval",
    paymentTerms: "50% deposit, 50% on delivery",
    trackingNumber: null,
    receivedDate: null,
  },
  {
    id: "PO-2023-004",
    vendorId: "v4",
    vendor: "Eco-Friendly Flooring Co.",
    vendorEmail: "sales@ecoflooring.com",
    vendorAddress: "567 Green St, Austin, TX 78701",
    vendorPhone: "(555) 678-9012",
    projectId: "p1",
    project: "Modern Loft Redesign",
    date: "2023-09-01",
    deliveryDate: "2023-10-01",
    amount: 5500,
    status: "Processing" as const,
    items: [
      { id: "poi10", name: "Engineered Hardwood", quantity: 500, price: 8, total: 4000 },
      { id: "poi11", name: "Underlayment", quantity: 500, price: 2, total: 1000 },
      { id: "poi12", name: "Transition Strips", quantity: 10, price: 50, total: 500 }
    ],
    shippingCost: 0,
    notes: "Material to be delivered 2 days before installation",
    paymentTerms: "Net 30",
    trackingNumber: null,
    receivedDate: null,
  },
  {
    id: "PO-2023-005",
    vendorId: "v5",
    vendor: "Custom Cabinetry Specialists",
    vendorEmail: "info@customcabinetry.com",
    vendorAddress: "890 Craft Blvd, Denver, CO 80202",
    vendorPhone: "(555) 789-0123",
    projectId: "p4",
    project: "Luxury Apartment Redesign",
    date: "2023-09-05",
    deliveryDate: "2023-10-15",
    amount: 8200,
    status: "Ordered" as const,
    items: [
      { id: "poi13", name: "Kitchen Cabinets", quantity: 1, price: 6000, total: 6000 },
      { id: "poi14", name: "Bathroom Vanity", quantity: 2, price: 900, total: 1800 },
      { id: "poi15", name: "Built-in Shelving", quantity: 1, price: 400, total: 400 }
    ],
    shippingCost: 0,
    notes: "On-site measurements scheduled for next week",
    paymentTerms: "50% deposit, balance on delivery",
    trackingNumber: null,
    receivedDate: null,
  }
];

export type PurchaseOrder = typeof initialPurchaseOrders[0];
export type PurchaseOrderStatus = 'Ordered' | 'Processing' | 'In Transit' | 'Delivered' | 'Cancelled';
export type PurchaseOrderItem = typeof initialPurchaseOrders[0]['items'][0];

interface PurchaseOrdersState {
  purchaseOrders: PurchaseOrder[];
  selectedPurchaseOrder: PurchaseOrder | null;
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseOrdersState = {
  purchaseOrders: initialPurchaseOrders,
  selectedPurchaseOrder: null,
  loading: false,
  error: null
};

export const purchaseOrdersSlice = createSlice({
  name: 'purchaseOrders',
  initialState,
  reducers: {
    getPurchaseOrders: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedPurchaseOrder: (state, action: PayloadAction<string>) => {
      state.selectedPurchaseOrder = state.purchaseOrders.find(po => po.id === action.payload) || null;
    },
    clearSelectedPurchaseOrder: (state) => {
      state.selectedPurchaseOrder = null;
    },
    addPurchaseOrder: (state, action: PayloadAction<Omit<PurchaseOrder, 'id'>>) => {
      // Generate PO number in format PO-YYYY-XXX
      const year = new Date().getFullYear();
      const lastPoNum = state.purchaseOrders
        .filter(po => po.id.includes(`PO-${year}`))
        .length + 1;
      
      const newPO = {
        ...action.payload,
        id: `PO-${year}-${lastPoNum.toString().padStart(3, '0')}`,
      };
      
      state.purchaseOrders.push(newPO);
    },
    updatePurchaseOrder: (state, action: PayloadAction<{ id: string; po: Partial<PurchaseOrder> }>) => {
      const { id, po } = action.payload;
      const index = state.purchaseOrders.findIndex(p => p.id === id);
      if (index !== -1) {
        state.purchaseOrders[index] = { ...state.purchaseOrders[index], ...po };
        if (state.selectedPurchaseOrder?.id === id) {
          state.selectedPurchaseOrder = state.purchaseOrders[index];
        }
      }
    },
    deletePurchaseOrder: (state, action: PayloadAction<string>) => {
      state.purchaseOrders = state.purchaseOrders.filter(po => po.id !== action.payload);
      if (state.selectedPurchaseOrder?.id === action.payload) {
        state.selectedPurchaseOrder = null;
      }
    },
    addPurchaseOrderItem: (state, action: PayloadAction<{ poId: string; item: Omit<PurchaseOrderItem, 'id'> }>) => {
      const { poId, item } = action.payload;
      const po = state.purchaseOrders.find(p => p.id === poId);
      
      if (po) {
        const newItem = {
          ...item,
          id: `poi${po.items.length + 1}${Math.random().toString(36).substring(2, 5)}`,
        };
        
        po.items.push(newItem);
        
        // Recalculate PO total
        po.amount = po.items.reduce((sum, item) => sum + item.total, 0) + (po.shippingCost || 0);
        
        if (state.selectedPurchaseOrder?.id === poId) {
          state.selectedPurchaseOrder = po;
        }
      }
    },
    updatePurchaseOrderItem: (state, action: PayloadAction<{ 
      poId: string; 
      itemId: string; 
      item: Partial<PurchaseOrderItem> 
    }>) => {
      const { poId, itemId, item } = action.payload;
      const po = state.purchaseOrders.find(p => p.id === poId);
      
      if (po) {
        const itemIndex = po.items.findIndex(i => i.id === itemId);
        
        if (itemIndex !== -1) {
          po.items[itemIndex] = { ...po.items[itemIndex], ...item };
          
          // If quantity or price changed, recalculate total
          if (item.quantity !== undefined || item.price !== undefined) {
            po.items[itemIndex].total = 
              po.items[itemIndex].quantity * po.items[itemIndex].price;
          }
          
          // Recalculate PO total
          po.amount = po.items.reduce((sum, item) => sum + item.total, 0) + (po.shippingCost || 0);
          
          if (state.selectedPurchaseOrder?.id === poId) {
            state.selectedPurchaseOrder = po;
          }
        }
      }
    },
    deletePurchaseOrderItem: (state, action: PayloadAction<{ poId: string; itemId: string }>) => {
      const { poId, itemId } = action.payload;
      const po = state.purchaseOrders.find(p => p.id === poId);
      
      if (po) {
        po.items = po.items.filter(item => item.id !== itemId);
        
        // Recalculate PO total
        po.amount = po.items.reduce((sum, item) => sum + item.total, 0) + (po.shippingCost || 0);
        
        if (state.selectedPurchaseOrder?.id === poId) {
          state.selectedPurchaseOrder = po;
        }
      }
    },
    updatePurchaseOrderStatus: (state, action: PayloadAction<{ id: string; status: PurchaseOrderStatus }>) => {
      const { id, status } = action.payload;
      const po = state.purchaseOrders.find(p => p.id === id);
      
      if (po) {
        po.status = status;
        
        // If status is Delivered, set receivedDate to today
        if (status === 'Delivered') {
          po.receivedDate = new Date().toISOString().split('T')[0];
        }
        
        if (state.selectedPurchaseOrder?.id === id) {
          state.selectedPurchaseOrder = po;
        }
      }
    }
  }
});

export const { 
  getPurchaseOrders, 
  setSelectedPurchaseOrder, 
  clearSelectedPurchaseOrder, 
  addPurchaseOrder, 
  updatePurchaseOrder, 
  deletePurchaseOrder,
  addPurchaseOrderItem,
  updatePurchaseOrderItem,
  deletePurchaseOrderItem,
  updatePurchaseOrderStatus
} = purchaseOrdersSlice.actions;

export const selectAllPurchaseOrders = (state: RootState) => state.purchaseOrders.purchaseOrders;
export const selectSelectedPurchaseOrder = (state: RootState) => state.purchaseOrders.selectedPurchaseOrder;
export const selectPurchaseOrderById = (id: string) => (state: RootState) => 
  state.purchaseOrders.purchaseOrders.find(po => po.id === id);
export const selectPurchaseOrdersByProject = (projectId: string) => (state: RootState) => 
  state.purchaseOrders.purchaseOrders.filter(po => po.projectId === projectId);
export const selectPurchaseOrdersByVendor = (vendorId: string) => (state: RootState) => 
  state.purchaseOrders.purchaseOrders.filter(po => po.vendorId === vendorId);
export const selectPurchaseOrdersByStatus = (status: PurchaseOrderStatus) => (state: RootState) => 
  state.purchaseOrders.purchaseOrders.filter(po => po.status === status);
export const selectPendingPurchaseOrders = (state: RootState) => 
  state.purchaseOrders.purchaseOrders.filter(po => ['Ordered', 'Processing', 'In Transit'].includes(po.status));

export default purchaseOrdersSlice.reducer;
