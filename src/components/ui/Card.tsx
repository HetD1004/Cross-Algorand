import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  "rounded-card bg-surface transition-all border border-surface-hover",
  {
    variants: {
      variant: {
        default: "shadow-card hover:shadow-card-hover",
        flat: "border border-surface-hover",
        elevated: "shadow-lg shadow-black/20",
        glass: "backdrop-blur-md bg-surface/70 border border-surface-hover",
        gradient: "bg-gradient-to-br from-surface to-dark border border-primary-400/20",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      animation: {
        none: "",
        hover: "transform hover:-translate-y-1 transition-transform duration-300 ease-in-out",
        scale: "transform hover:scale-[1.02] transition-transform duration-300 ease-in-out",
        bounce: "transform hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all duration-300",
      },
      bordered: {
        true: "border border-gray-200",
      },
      interactive: {
        true: "cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      animation: "none",
      bordered: false,
      interactive: false,
    },
    compoundVariants: [
      {
        interactive: true,
        variant: "default",
        className: "hover:shadow-lg",
      },
      {
        interactive: true,
        variant: "flat",
        className: "hover:bg-surface-hover",
      },
      {
        interactive: true,
        variant: "elevated",
        className: "hover:shadow-xl",
      },
    ],
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
    as?: React.ElementType;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, animation, bordered, interactive, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cardVariants({ variant, padding, animation, bordered, interactive, className })}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export { Card, cardVariants };