
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Protected Pages
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import TaskView from "./components/tasks/TaskView";
import TimeTracking from "./pages/TimeTracking";
import TodoList from "./pages/TodoList";
import Invoices from "./pages/Invoices";
import Documents from "./pages/Documents";
import FolderView from "./pages/FolderView";
import ProcurementHub from "./pages/ProcurementHub";
import PurchaseOrders from "./pages/PurchaseOrders";
import AddressBook from "./pages/AddressBook";
import ImageLibrary from "./pages/ImageLibrary";
import ProductLibrary from "./pages/ProductLibrary";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import RolesPage from "./pages/Roles";
import CreateRolePage from "./pages/CreateRole";
import EditRolePage from "./pages/EditRole";
import Profile from "./pages/Profile";
import Photos from "./pages/Photos";
import AlbumView from "./components/photos/AlbumView";
import PhotoViewer from "./components/photos/PhotoViewer";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const selectedCompany = localStorage.getItem("selectedCompany");
  if (!token) {
    return <Navigate to="/auth/login" />;
  }
  // If ser needs to select a company, redirect to company selection
  if (!selectedCompany) {
    return <Navigate to="/auth/login" />; // Login component handles company selection
  }

  return <>{children}</>;
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <div className="flex-1 min-h-screen bg-background">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/projects" element={<Projects />} />
                          <Route
                            path="/projects/:id"
                            element={<ProjectDetails />}
                          />
                          <Route path="/tasks" element={<Tasks />} />
                          <Route path="/tasks/:id" element={<TaskView />} />
                          <Route
                            path="/time-tracking"
                            element={<TimeTracking />}
                          />
                          <Route path="/todo" element={<TodoList />} />
                          <Route path="/invoices" element={<Invoices />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/documents/folder/:folderId" element={<FolderView />} />
                          <Route
                            path="/procurement"
                            element={<ProcurementHub />}
                          />
                          <Route
                            path="/purchase-orders"
                            element={<PurchaseOrders />}
                          />
                          <Route
                            path="/address-book"
                            element={<AddressBook />}
                          />
                          <Route
                            path="/image-library"
                            element={<ImageLibrary />}
                          />
                          <Route
                            path="/product-library"
                            element={<ProductLibrary />}
                          />
                          <Route path="/roles" element={<RolesPage />}/>
                          <Route path="/roles/create" element={<CreateRolePage />}/>
                          <Route path="/roles/edit/:roleId" element={<EditRolePage />}/>
                          <Route path="/photos" element={<Photos />} />
                          <Route path="/photos/album/:visitId" element={<AlbumView />} />
                          <Route path="/photos/viewer/:photoId" element={<PhotoViewer />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/admin" element={<Admin />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
