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
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import foldersReducer from './slices/foldersSlice';
import commentsReducer from './slices/commentsSlice';
import rolesReducer from './slices/rolesSlice';
import notificationsReducer from './slices/notificationsSlice';
import locationsReducer from './slices/locationsSlice';
import visitsReducer from './slices/visitsSlice';
import photosReducer from './slices/photosSlice';
import albumsReducer from './slices/albumsSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
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
    admin: adminReducer,
    folders: foldersReducer,
    comments: commentsReducer,
    roles: rolesReducer,
    notifications: notificationsReducer,
    locations: locationsReducer,
    visits: visitsReducer,
    photos: photosReducer,
    dashboard: dashboardReducer,
    albums: albumsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
