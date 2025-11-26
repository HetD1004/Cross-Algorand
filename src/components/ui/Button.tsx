import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-button font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] relative z-10 pointer-events-auto",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-dark hover:bg-primary-400 shadow-sm hover:shadow font-semibold",
        outline: "border-2 border-primary-400 text-primary-400 hover:bg-primary-400/10 hover:border-primary-300",
        ghost: "text-primary-400 hover:bg-primary-400/10",
        secondary: "bg-surface text-text-primary hover:bg-surface-hover shadow-sm",
        danger: "bg-error text-white hover:bg-error/90 shadow-sm hover:shadow",
        success: "bg-success text-dark hover:bg-success/90 shadow-sm hover:shadow font-semibold",
        gradient: "bg-gradient-to-r from-primary-500 to-primary-600 text-dark hover:from-primary-400 hover:to-primary-500 shadow-sm hover:shadow font-semibold",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
      },
      fullWidth: {
        true: "w-full",
      },
      rounded: {
        default: "rounded-button",
        full: "rounded-full",
        none: "rounded-none",
      },
      hasIcon: {
        true: "inline-flex items-center",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
      rounded: "default",
      hasIcon: false,
    },
    compoundVariants: [
      {
        hasIcon: true,
        size: "xs",
        className: "gap-1",
      },
      {
        hasIcon: true,
        size: ["sm", "md"],
        className: "gap-2",
      },
      {
        hasIcon: true,
        size: ["lg", "xl"],
        className: "gap-3",
      },
    ],
  }
);

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, 
    VariantProps<typeof buttonVariants> {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, rounded, hasIcon, leftIcon, rightIcon, isLoading, children, ...props }, ref) => {
    // If we have icons, ensure hasIcon is true
    const computedHasIcon = hasIcon || !!leftIcon || !!rightIcon || !!isLoading;
    
    return (
      <button
        className={buttonVariants({ 
          variant, 
          size, 
          fullWidth, 
          rounded,
          hasIcon: computedHasIcon,
          className
        })}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
        onClick={(e) => {
          // Ensure the click event fires
          e.stopPropagation();
          if (props.onClick) {
            props.onClick(e);
          }
        }}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };