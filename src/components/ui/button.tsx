import * as React from "react";
import { cn } from "@/lib/ui/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium smooth-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 disabled:pointer-events-none",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-95",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "ghost" && "bg-transparent hover:bg-foreground/5",
        variant === "destructive" && "bg-destructive text-destructive-foreground hover:opacity-95",
        size === "sm" && "text-sm px-3 py-1.5",
        size === "md" && "text-sm px-4 py-2.5",
        size === "lg" && "text-base px-5 py-3",
        className
      )}
      {...props}
    />
  );
}
