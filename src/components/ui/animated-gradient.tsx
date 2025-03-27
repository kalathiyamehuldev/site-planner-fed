
import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "soft";
  intensity?: "low" | "medium" | "high";
  speed?: "slow" | "medium" | "fast";
}

const AnimatedGradient = ({
  className,
  children,
  variant = "primary",
  intensity = "medium",
  speed = "medium",
  ...props
}: AnimatedGradientProps) => {
  const variantClasses = {
    primary: "from-blue-400 via-indigo-400 to-blue-500",
    secondary: "from-gray-200 via-white to-gray-100",
    accent: "from-blue-300 via-purple-300 to-pink-300",
    soft: "from-blue-100 via-indigo-50 to-blue-50",
  };

  const intensityClasses = {
    low: "opacity-30",
    medium: "opacity-50",
    high: "opacity-70",
  };

  const speedClasses = {
    slow: "animate-[gradient-shift_20s_ease_infinite]",
    medium: "animate-[gradient-shift_10s_ease_infinite]",
    fast: "animate-[gradient-shift_5s_ease_infinite]",
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-r bg-[length:400%_400%]",
        variantClasses[variant],
        intensityClasses[intensity],
        speedClasses[speed],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { AnimatedGradient };
