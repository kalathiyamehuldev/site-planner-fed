import React from "react";
import { cn } from "@/lib/utils";

export type ActionButtonVariant = "primary" | "secondary" | "gray" | "text" | "danger";
export type ActionButtonMotion = "subtle" | "bounce" | "scale" | "none";
export type ActionButtonSize = "xl" | "l" | "m" | "s";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: ActionButtonVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  motion?: ActionButtonMotion;
  size?: ActionButtonSize;
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(({
  text,
  variant = "primary",
  leftIcon,
  rightIcon,
  className,
  disabled,
  motion = "subtle",
  size = "m",
  ...props
}, ref) => {
  const hasLeftIcon = !!leftIcon;
  const motionClasses: Record<ActionButtonMotion, string> = {
    subtle: "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    bounce: "hover:-translate-y-1 active:translate-y-0 active:scale-[0.97]",
    scale: "hover:scale-[1.03] active:scale-[0.98]",
    none: "",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "app-btn transition-all duration-200",
        `app-btn--${size}`,
        motionClasses[motion],
        `app-btn--${variant}`,
        hasLeftIcon ? "has-left-icon" : "",
        disabled ? "app-btn--disabled" : "",
        className
      )}
      disabled={disabled}
      {...props}
   >
      {leftIcon ? <span className="app-btn__icon-left">{leftIcon}</span> : null}
      {text ? <span className="app-btn__label">{text}</span> : null}
      {rightIcon ? <span className="app-btn__icon-right">{rightIcon}</span> : null}
    </button>
  );
});

ActionButton.displayName = "ActionButton";

export default ActionButton;