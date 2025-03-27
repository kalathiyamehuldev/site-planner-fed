
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost" | "glass" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  motion?: "subtle" | "bounce" | "scale" | "none";
}

const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant = "default", size = "default", motion = "subtle", children, ...props }, ref) => {
    const motionClasses = {
      subtle: "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
      bounce: "hover:-translate-y-1 active:translate-y-0 active:scale-[0.97]",
      scale: "hover:scale-[1.03] active:scale-[0.98]",
      none: "",
    };

    const variantSpecificClasses = 
      variant === "glass" 
        ? "bg-white/70 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/80" 
        : "";

    return (
      <Button
        ref={ref}
        variant={variant === "glass" ? "outline" : variant}
        size={size}
        className={cn(
          "transition-all duration-200",
          motionClasses[motion],
          variantSpecificClasses,
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MotionButton.displayName = "MotionButton";

export { MotionButton };
