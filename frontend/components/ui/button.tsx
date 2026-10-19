import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-violet text-white shadow-lg shadow-brand-violet/25 hover:bg-brand-violet/90 hover:shadow-brand-violet/40 hover:-translate-y-0.5",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300",
        outline:
          "border border-white/10 bg-navy-800/60 hover:bg-navy-700/80 hover:border-white/20 text-white backdrop-blur-sm",
        secondary:
          "bg-brand-cyan/20 text-cyan-300 border border-brand-cyan/30 hover:bg-brand-cyan/30 hover:text-cyan-200",
        ghost: "hover:bg-white/5 hover:text-white text-slate-300",
        link: "text-brand-cyan underline-offset-4 hover:underline",
        glow: "bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-lg shadow-brand-violet/30 hover:shadow-brand-cyan/40 hover:brightness-110 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-xl px-8 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
