
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAppSelector } from "@/redux/hooks";
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
import TimeTracking from "./pages/TimeTracking";
import TodoList from "./pages/TodoList";
import Invoices from "./pages/Invoices";
import Documents from "./pages/Documents";
import ProcurementHub from "./pages/ProcurementHub";
import PurchaseOrders from "./pages/PurchaseOrders";
import AddressBook from "./pages/AddressBook";
import ImageLibrary from "./pages/ImageLibrary";
import ProductLibrary from "./pages/ProductLibrary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, selectedCompany, needsCompanySelection } = useAppSelector((state) => state.auth);

  // Check if user is authenticated
  if (!isAuthenticated || !user || !localStorage.getItem("token")) {
    return <Navigate to="/auth/login" />;
  }

  // If user needs to select a company, redirect to company selection
  if (needsCompanySelection) {
    return <Navigate to="/auth/login" />; // Login component handles company selection
  }

  // If user is authenticated but no company is selected, redirect to login
  if (!selectedCompany) {
    return <Navigate to="/auth/login" />;
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
                      <div className="flex-1 min-h-screen">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/projects" element={<Projects />} />
                          <Route
                            path="/projects/:id"
                            element={<ProjectDetails />}
                          />
                          <Route path="/tasks" element={<Tasks />} />
                          <Route
                            path="/time-tracking"
                            element={<TimeTracking />}
                          />
                          <Route path="/todo" element={<TodoList />} />
                          <Route path="/invoices" element={<Invoices />} />
                          <Route path="/documents" element={<Documents />} />
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
