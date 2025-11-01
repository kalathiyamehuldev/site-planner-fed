import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const PageHeader = ({ 
  title,
  subtitle,
  children 
}: PageHeaderProps) => {
  return (
    <>
      {/* Desktop Header - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex items-center justify-between mb-4 sm:mb-10 w-full">
        {/* Left side - Title and subtitle */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h1 className="typography-common font-semibold leading-[100%] text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side - Additional content */}
        {children && (
          <div className="flex-shrink-0 ml-4">
            {children}
          </div>
        )}
      </div>

      {/* Mobile Title - Show on mobile, hidden on desktop */}
      <div className="mb-6 sm:hidden">
        <h1 className="font-semibold leading-[100%] text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </>
  );
};

export default PageHeader;