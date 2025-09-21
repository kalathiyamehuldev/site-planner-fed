
import React from "react";
import { cn } from "@/lib/utils";
import Navbar from "./Navbar";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  padding?: boolean;
  reducedTopPadding?: boolean;
}

const PageContainer = ({ 
  children, 
  className, 
  fullWidth = false,
  padding = true,
  reducedTopPadding = false
}: PageContainerProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <main
        className={cn(
          "flex-1 bg-background w-full",
          padding && reducedTopPadding ? "pt-12 pb-12 px-3 sm:px-4 md:px-6 lg:px-8" : 
          padding ? "pt-16 pb-12 px-3 sm:px-4 md:px-6 lg:px-8" : "",
          !fullWidth && "max-w-7xl mx-auto",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
