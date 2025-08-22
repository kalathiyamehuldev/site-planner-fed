
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  FileText, 
  CheckSquare, 
  Clock, 
  Users, 
  ShoppingBag, 
  FileImage, 
  Package,
  Settings, 
  HelpCircle,
  BookOpen,
  Timer,
  CreditCard,
  FolderArchive,
  LogOut,
  Shield
} from "lucide-react";
import { logout } from "@/redux/slices/authSlice";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const mainItems = [
    { name: "Dashboard", path: "/", icon: LayoutGrid, color: "text-blue-600" },
    { name: "Projects", path: "/projects", icon: FileText, color: "text-green-600" },
    { name: "Tasks", path: "/tasks", icon: CheckSquare, color: "text-purple-600" },
    { name: "Admin", path: "/admin", icon: Shield, color: "text-red-600" },
  ];

  const toolItems = [
    { name: "Time Tracking", path: "/time-tracking", icon: Clock, color: "text-orange-600" },
    { name: "To-Do List", path: "/todo", icon: CheckSquare, color: "text-indigo-600" },
    // { name: "Invoices", path: "/invoices", icon: CreditCard, color: "text-yellow-600" },
    // { name: "Procurement Hub", path: "/procurement", icon: ShoppingBag, color: "text-pink-600" },
    // { name: "Purchase Orders", path: "/purchase-orders", icon: ShoppingBag, color: "text-teal-600" },
    { name: "Documents", path: "/documents", icon: FolderArchive, color: "text-gray-600" },
  ];

  const libraryItems = [
    { name: "Address Book", path: "/address-book", icon: Users, color: "text-cyan-600" },
    // { name: "Image Library", path: "/image-library", icon: FileImage, color: "text-emerald-600" },
    // { name: "Product Library", path: "/product-library", icon: Package, color: "text-violet-600" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== "/" && location.pathname.startsWith(path));
  };

  const SidebarMenuItems = ({ items }: { items: { name: string; path: string; icon: React.ElementType; color: string }[] }) => {
    return (
      <>
        {items.map((item) => (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton 
              asChild
              isActive={isActive(item.path)}
              tooltip={item.name}
            >
              <Link to={item.path}>
                <item.icon className={cn(
                  "transition-colors duration-200",
                  isActive(item.path) ? "text-slate-800" : item.color
                )} />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </>
    );
  };

  return (
    <Sidebar variant="inset">
      <SidebarRail />
      <SidebarHeader className="pt-6 px-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
            D
          </div>
          <span className="text-xl font-light tracking-tight">designflow</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems items={mainItems} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems items={toolItems} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Libraries</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems items={libraryItems} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link to="/settings">
                <Settings
                  size={18}
                  className={cn(
                    "transition-colors duration-200",
                    isActive("/settings") ? "text-primary-foreground" : "text-slate-600"
                  )}
                />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log Out" onClick={handleLogout}>
              <LogOut
                size={18}
                className="text-red-600 transition-colors duration-200"
              />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
