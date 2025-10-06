import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full bg-white rounded-md overflow-hidden">
    <div className="relative w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom", className)}
        {...props}
      />
    </div>
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn("h-12 [&_tr]:border-b [&_tr]:border-[#1a2624]/10", className)} 
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0 [&_tr]:border-b [&_tr]:border-[#1a2624]/10 [&_tr]:h-16 bg-white", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "h-12 bg-white border-t border-[#1a2624]/10",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors hover:bg-gray-50/50",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  TableHeadProps
>(({ className, children, sortable = false, sortDirection, onSort, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-3 text-left align-middle font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight [&:has([role=checkbox])]:pr-0",
      sortable && "cursor-pointer hover:bg-gray-50/50",
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    {sortable ? (
      <div className="flex items-center gap-1">
        <span>{children}</span>
        <div className="w-4 h-4 flex items-center justify-center">
          {sortDirection === 'asc' ? (
            <ChevronUp size={14} className="text-[#1a2624]/60" />
          ) : sortDirection === 'desc' ? (
            <ChevronDown size={14} className="text-[#1a2624]/60" />
          ) : (
            <div className="w-3.5 h-3 bg-[#1a2624]/60 opacity-60" style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
            }} />
          )}
        </div>
      </div>
    ) : (
      children
    )}
  </th>
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-3 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-3 md:mt-4 text-xs md:text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  className?: string;
}

const TablePagination = React.forwardRef<
  HTMLDivElement,
  TablePaginationProps
>(({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange,
  className,
  ...props 
}, ref) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div 
      ref={ref}
      className={cn("h-12 flex justify-between items-center px-3 bg-white", className)}
      {...props}
    >
      {/* Left padding */}
      <div className="w-3 h-3 opacity-0" />
      
      <div className="flex-1 flex justify-start items-center gap-5">
        {/* Rows per page */}
        <div className="flex justify-center items-center gap-1">
          <span className="text-[#1a2624]/70 text-sm font-normal font-['Manrope'] leading-tight">
            Rows per page:
          </span>
          <div className="flex justify-start items-center gap-0.5">
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight bg-transparent border-none outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown size={16} className="text-[#1a2624]/80" />
          </div>
        </div>
        
        {/* Items count */}
        <div className="flex-1 text-right">
          <span className="text-[#1a2624] text-sm font-normal font-['Manrope'] leading-tight">
            {startItem}-{endItem}
          </span>
          <span className="text-[#1a2624]/70 text-sm font-normal font-['Manrope'] leading-tight">
            {' '}of {totalItems}
          </span>
        </div>
        
        {/* Pagination controls */}
        <div className="flex justify-center items-center gap-2.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-[#1a2624]/10 flex justify-center items-center gap-1 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronUp 
              size={16} 
              className={cn(
                "rotate-[-90deg]",
                currentPage === 1 ? "text-[#1a2624]/40" : "text-[#1a2624]/80"
              )} 
            />
          </button>
          
          <div className="flex justify-start items-center gap-1">
            <span className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight">
              {currentPage}
            </span>
            <span className="text-[#1a2624]/70 text-sm font-normal font-['Manrope'] leading-tight">
              /{totalPages}
            </span>
          </div>
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-[#1a2624]/10 flex justify-center items-center gap-1 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronUp 
              size={16} 
              className={cn(
                "rotate-90",
                currentPage === totalPages ? "text-[#1a2624]/40" : "text-[#1a2624]/80"
              )} 
            />
          </button>
        </div>
      </div>
      
      {/* Right padding */}
      <div className="w-3 h-3 opacity-0" />
    </div>
  );
})
TablePagination.displayName = "TablePagination"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TablePagination,
}
