import * as React from "react";
import { cn } from "@/lib/utils";

export interface BrutalInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const BrutalInput = React.forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full border-thick border-border bg-input px-4 py-3 text-sm font-medium transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-brutal disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
BrutalInput.displayName = "BrutalInput";

export { BrutalInput };
