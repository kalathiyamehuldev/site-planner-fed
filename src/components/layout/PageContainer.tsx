
import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  padding?: boolean;
  showHeader?: boolean;
}

const PageContainer = ({
  children,
  className,
  fullWidth = false,
  padding = true,
  showHeader = false
}: PageContainerProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] w-full overflow-x-hidden">
      <main
        className={cn(
          "flex-1 w-full min-w-0",
          // Add top padding on mobile to account for the mobile header from AppSidebar
          padding ? "pt-20 md:pt-0 p-3 sm:p-4 md:p-6 lg:p-8" : "pt-20 md:pt-0",
          !fullWidth && "max-w-none",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
