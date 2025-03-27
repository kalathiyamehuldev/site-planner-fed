
import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  FolderArchive
} from "lucide-react";
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

const AppSidebar = () => {
  const location = useLocation();

  const mainItems = [
    { name: "Dashboard", path: "/", icon: LayoutGrid },
    { name: "Projects", path: "/projects", icon: FileText },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
  ];

  const toolItems = [
    { name: "Time Tracking", path: "/time-tracking", icon: Clock },
    { name: "To-Do List", path: "/todo", icon: CheckSquare },
    { name: "Invoices", path: "/invoices", icon: CreditCard },
    { name: "Procurement Hub", path: "/procurement", icon: ShoppingBag },
    { name: "Purchase Orders", path: "/purchase-orders", icon: ShoppingBag },
    { name: "Documents", path: "/documents", icon: FolderArchive },
  ];

  const libraryItems = [
    { name: "Address Book", path: "/address-book", icon: Users },
    { name: "Image Library", path: "/image-library", icon: FileImage },
    { name: "Product Library", path: "/product-library", icon: Package },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== "/" && location.pathname.startsWith(path));
  };

  const SidebarMenuItems = ({ items }: { items: { name: string; path: string; icon: React.ElementType }[] }) => {
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
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </>
    );
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
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
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help">
              <Link to="/help">
                <HelpCircle size={18} />
                <span>Need Help?</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
