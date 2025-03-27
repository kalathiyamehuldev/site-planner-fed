
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

// Pages
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

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <div className="flex-1 min-h-screen">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/time-tracking" element={<TimeTracking />} />
                  <Route path="/todo" element={<TodoList />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/procurement" element={<ProcurementHub />} />
                  <Route path="/purchase-orders" element={<PurchaseOrders />} />
                  <Route path="/address-book" element={<AddressBook />} />
                  <Route path="/image-library" element={<ImageLibrary />} />
                  <Route path="/product-library" element={<ProductLibrary />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
