
import React from "react";
import { cn } from "@/lib/utils";
import Navbar from "./Navbar";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  padding?: boolean;
}

const PageContainer = ({ 
  children, 
  className, 
  fullWidth = false,
  padding = true 
}: PageContainerProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={cn(
        "flex-1",
        padding && "pt-24 pb-16 px-4 md:px-8",
        !fullWidth && "max-w-7xl mx-auto w-full",
        className
      )}>
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
