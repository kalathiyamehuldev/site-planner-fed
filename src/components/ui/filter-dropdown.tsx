import React, { useState } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type FilterOption = {
  id: string;
  label: string;
  options: {
    value: string;
    label: string;
  }[];
};

type FilterDropdownProps = {
  filters: FilterOption[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  className?: string;
};

export function FilterDropdown({
  filters,
  selectedFilters,
  onFilterChange,
  className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Count total active filters
  const activeFilterCount = Object.values(selectedFilters).reduce(
    (count, values) => count + values.length,
    0
  );

  const handleFilterSelect = (filterId: string) => {
    setActiveFilter(filterId);
  };

  const handleOptionToggle = (filterId: string, value: string) => {
    // For mobile devices, implement radio-button like behavior (select only one option)
    if (window.innerWidth <= 640) {
      // If already selected, do nothing (prevent unchecking the only selected option)
      if (selectedFilters[filterId]?.includes(value) && selectedFilters[filterId].length === 1) {
        return;
      }
      // Otherwise, select only this option
      onFilterChange(filterId, [value]);
    } else {
      // For desktop, keep the original multi-select behavior
      const currentValues = selectedFilters[filterId] || [];
      
      // Special handling for "All" option (case insensitive check)
      if (value.toLowerCase() === "all" || value === "all") {
        // If "All" is being selected, clear other selections
        onFilterChange(filterId, [value]);
      } else {
        // For other options, remove "All" if it exists and toggle the current value
        const valuesWithoutAll = currentValues.filter(v => 
          v.toLowerCase() !== "all" && v !== "all"
        );
        
        const newValues = valuesWithoutAll.includes(value)
          ? valuesWithoutAll.filter((v) => v !== value)
          : [...valuesWithoutAll, value];
        
        onFilterChange(filterId, newValues);
      }
    }
  };

  const clearFilters = () => {
    filters.forEach(filter => {
      onFilterChange(filter.id, []);
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-1.5 h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm border-dashed relative w-fit lg:hidden",
            activeFilterCount > 0 && "border-primary",
            className
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-[10px] md:text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] md:w-[280px] p-0" align="start">
        <div className="grid grid-cols-3 border-b">
          <div className="col-span-1 border-r max-h-[300px] overflow-y-auto">
            {filters.map((filter) => {
              const isActive = filter.id === activeFilter;
              const hasSelected = (selectedFilters[filter.id]?.length || 0) > 0;
              
              return (
                <button
                  key={filter.id}
                  className={cn(
                    "w-full text-left px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm hover:bg-accent transition-colors",
                    isActive && "bg-accent",
                    hasSelected && "font-medium"
                  )}
                  onClick={() => handleFilterSelect(filter.id)}
                >
                  {filter.label}
                  {hasSelected && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedFilters[filter.id]?.length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
          <div className="col-span-2 p-1 max-h-[300px] overflow-y-auto">
            {activeFilter && (
              <div className="space-y-1">
                {filters
                  .find((f) => f.id === activeFilter)
                  ?.options.map((option) => {
                    const isSelected = selectedFilters[activeFilter]?.includes(option.value) || 
                      (option.value.toLowerCase() === "all" && (!selectedFilters[activeFilter] || selectedFilters[activeFilter].length === 0));
                    
                    return (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1 md:py-1.5 text-xs md:text-sm rounded-sm cursor-pointer hover:bg-accent",
                          isSelected && "bg-accent/50"
                        )}
                        onClick={() => handleOptionToggle(activeFilter, option.value)}
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-primary/20"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span>{option.label}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}