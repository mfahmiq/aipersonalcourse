/**
 * Input Component
 * Komponen input yang dapat dikustomisasi dengan styling yang konsisten
 * Menggunakan forwardRef untuk mendukung ref forwarding
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component
 * Component input dengan styling yang konsisten dan aksesibilitas yang baik
 * 
 * @param className - Additional CSS classes untuk kustomisasi
 * @param type - Input type (text, email, password, etc.)
 * @param props - Additional input props
 * @param ref - Forwarded ref untuk input element
 * @returns JSX input element
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles untuk input dengan focus states dan responsive design
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
