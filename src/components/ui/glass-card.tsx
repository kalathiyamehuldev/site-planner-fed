
import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dark" | "gradient" | "clean";
  intensity?: "low" | "medium" | "high";
  children: React.ReactNode;
}

const GlassCard = ({
  className,
  variant = "default",
  intensity = "medium",
  children,
  ...props
}: GlassCardProps) => {
  const intensityClasses = {
    low: "bg-white/40 backdrop-blur-sm border-white/10",
    medium: "bg-white/60 backdrop-blur-md border-white/20",
    high: "bg-white/80 backdrop-blur-lg border-white/30",
  };

  const variantClasses = {
    default: intensityClasses[intensity],
    dark: "bg-foreground/10 backdrop-blur-md border-foreground/10",
    gradient: "bg-gradient-to-br from-white/80 to-secondary/50 backdrop-blur-md border-white/20",
    clean: "bg-white border-0 shadow-none",
  };

  return (
    <div
      className={cn(
        "rounded-md transition-all duration-300",
        variant === "clean" ? "bg-white" : "border shadow-sm animate-scale-in",
        variant === "clean" ? "" : "rounded-2xl",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { GlassCard };
