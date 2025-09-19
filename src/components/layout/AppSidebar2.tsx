
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/utils";
import { hasPermission, isSuperAdmin } from "@/utils/permissionUtils";
import { selectCurrentRolePermissions } from "@/redux/slices/rolesSlice";
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
import { Resource } from "@/utils/permissionUtils";

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const permissions = useAppSelector(selectCurrentRolePermissions);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Define menu items with their permission requirements
  // Define type for menu items to ensure resource is correctly typed as Resource
  interface MenuItem {
    name: string;
    path: string;
    icon: React.ElementType;
    color: string;
    resource: Resource;
  }

  const mainItems: MenuItem[] = [
    { name: "Dashboard", path: "/", icon: LayoutGrid, color: "text-blue-600", resource: 'dashboard' as Resource },
    { name: "Projects", path: "/projects", icon: FileText, color: "text-green-600", resource: "projects" as Resource },
    { name: "Tasks", path: "/tasks", icon: CheckSquare, color: "text-purple-600", resource: "tasks" as Resource },
    { name: "Admin", path: "/admin", icon: Shield, color: "text-red-600", resource: "admin" as Resource },
    { name: "Roles", path: "/roles", icon: Shield, color: "text-orange-600", resource: "roles" as Resource },
  ];

  // Conditionally add Roles menu item if user has manage permission for users or is super admin
  const sidebarItems: MenuItem[] = [
    ...mainItems.filter(item => hasPermission(permissions, item.resource, 'manage')),
    ...(hasPermission(permissions, 'users' as Resource, 'manage') ? [{ name: "Roles", path: "/roles", icon: Shield, color: "text-orange-600", resource: "roles" as Resource }] : [])
  ];

  const toolItems: MenuItem[] = [
    { name: "Time Tracking", path: "/time-tracking", icon: Clock, color: "text-orange-600", resource: "time_tracking" as Resource },
    { name: "To-Do List", path: "/todo", icon: CheckSquare, color: "text-indigo-600", resource: "todo" as Resource },
    // { name: "Invoices", path: "/invoices", icon: CreditCard, color: "text-yellow-600", resource: "invoices" },
    // { name: "Procurement Hub", path: "/procurement", icon: ShoppingBag, color: "text-pink-600", resource: "procurement" },
    // { name: "Purchase Orders", path: "/purchase-orders", icon: ShoppingBag, color: "text-teal-600", resource: "purchase_orders" },
    { name: "Documents", path: "/documents", icon: FolderArchive, color: "text-gray-600", resource: "documents" as Resource },
  ].filter(item => hasPermission(permissions, item.resource, 'manage'));

  const libraryItems: MenuItem[] = [
    { name: "Address Book", path: "/address-book", icon: Users, color: "text-cyan-600", resource: "contacts" as Resource },
    // { name: "Image Library", path: "/image-library", icon: FileImage, color: "text-emerald-600", resource: "image_library" },
    // { name: "Product Library", path: "/product-library", icon: Package, color: "text-violet-600", resource: "product_library" },
  ].filter(item => hasPermission(permissions, item.resource, 'manage'));

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== "/" && location.pathname.startsWith(path));
  };

  const SidebarMenuItems = ({ items }: { items: MenuItem[] }) => {
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
              <SidebarMenuItems items={sidebarItems} />
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
