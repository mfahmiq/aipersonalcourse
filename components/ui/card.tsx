/**
 * Card Components
 * Kumpulan komponen untuk membuat card layout yang konsisten
 * Termasuk Card, CardHeader, CardTitle, CardDescription, CardContent, dan CardFooter
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card Component
 * Container utama untuk card dengan styling yang konsisten
 * 
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @param ref - Forwarded ref
 * @returns JSX div element dengan card styling
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * CardHeader Component
 * Header section untuk card dengan padding dan spacing yang konsisten
 * 
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @param ref - Forwarded ref
 * @returns JSX div element untuk card header
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * CardTitle Component
 * Title untuk card dengan typography yang konsisten
 * 
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @param ref - Forwarded ref
 * @returns JSX div element untuk card title
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * CardDescription Component
 * Description untuk card dengan styling muted text
 * 
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @param ref - Forwarded ref
 * @returns JSX div element untuk card description
 */
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * CardContent Component
 * Content section untuk card dengan padding yang konsisten
 * 
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @param ref - Forwarded ref
 * @returns JSX div element untuk card content
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * CardFooter Component
 * Footer section untuk card dengan flex layout dan padding
 * 
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @param ref - Forwarded ref
 * @returns JSX div element untuk card footer
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
