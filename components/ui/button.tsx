/**
 * Button Component
 * Komponen button yang dapat dikustomisasi dengan berbagai variant dan size
 * Menggunakan class-variance-authority untuk styling yang konsisten
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button variants menggunakan class-variance-authority
 * Mendefinisikan berbagai style button berdasarkan variant dan size
 */
const buttonVariants = cva(
  // Base styles untuk semua button
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Variant untuk berbagai jenis button
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",           // Button default dengan primary color
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90", // Button untuk aksi berbahaya
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground", // Button dengan outline
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",   // Button secondary
        ghost: "hover:bg-accent hover:text-accent-foreground",                       // Button transparan
        link: "text-primary underline-offset-4 hover:underline",                     // Button seperti link
      },
      // Size untuk berbagai ukuran button
      size: {
        default: "h-10 px-4 py-2",    // Ukuran default
        sm: "h-9 rounded-md px-3",    // Ukuran kecil
        lg: "h-11 rounded-md px-8",   // Ukuran besar
        icon: "h-10 w-10",            // Ukuran untuk icon button
      },
    },
    // Default variants
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Interface untuk Button props
 * Extends dari HTML button attributes dan variant props
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean  // Jika true, button akan menggunakan Slot component
}

/**
 * Button Component
 * Component button yang dapat dikustomisasi dengan berbagai variant dan size
 * 
 * @param className - Additional CSS classes
 * @param variant - Button variant (default, destructive, outline, etc.)
 * @param size - Button size (default, sm, lg, icon)
 * @param asChild - Jika true, button akan menggunakan Slot component
 * @param props - Additional button props
 * @param ref - Forwarded ref
 * @returns JSX button element
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Menggunakan Slot component jika asChild true, otherwise menggunakan button element
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
