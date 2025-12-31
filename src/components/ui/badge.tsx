import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        success:
          "border-transparent bg-success text-success-foreground shadow-sm hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow-sm hover:bg-warning/90",
        info:
          "border-transparent bg-info text-info-foreground shadow-sm hover:bg-info/90",
        outline: "text-foreground border-border bg-background/50 backdrop-blur-sm",
        glass: "backdrop-blur-md bg-card/80 border-border text-foreground shadow-sm",
        pending: "border-transparent bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning",
        accepted: "border-transparent bg-info/15 text-info dark:bg-info/20 dark:text-info",
        completed: "border-transparent bg-success/15 text-success dark:bg-success/20 dark:text-success",
        declined: "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }