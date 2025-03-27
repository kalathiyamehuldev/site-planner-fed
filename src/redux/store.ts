
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from './slices/projectsSlice';
import tasksReducer from './slices/tasksSlice';
import timeTrackingReducer from './slices/timeTrackingSlice';
import todoReducer from './slices/todoSlice';
import invoicesReducer from './slices/invoicesSlice';
import purchaseOrdersReducer from './slices/purchaseOrdersSlice';
import documentsReducer from './slices/documentsSlice';
import contactsReducer from './slices/contactsSlice';
import imagesReducer from './slices/imagesSlice';
import productsReducer from './slices/productsSlice';

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    tasks: tasksReducer,
    timeTracking: timeTrackingReducer,
    todos: todoReducer,
    invoices: invoicesReducer,
    purchaseOrders: purchaseOrdersReducer,
    documents: documentsReducer,
    contacts: contactsReducer,
    images: imagesReducer,
    products: productsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
