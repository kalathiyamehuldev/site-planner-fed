import React from "react";
import { cn } from "@/lib/utils";

export type ActionButtonVariant = "primary" | "secondary" | "gray" | "text";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: ActionButtonVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  text,
  variant = "primary",
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const hasLeftIcon = !!leftIcon;
  return (
    <button
      className={cn(
        "app-btn",
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
};

export default ActionButton;