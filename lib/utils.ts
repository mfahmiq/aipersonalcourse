/**
 * Utility functions untuk aplikasi
 * File ini berisi fungsi-fungsi helper yang digunakan di seluruh aplikasi
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Fungsi utility untuk menggabungkan class names dengan Tailwind CSS
 * Menggunakan clsx untuk conditional classes dan twMerge untuk menghindari konflik Tailwind
 * 
 * @param inputs - Array of class values (strings, objects, arrays, etc.)
 * @returns String class names yang sudah digabungkan dan dioptimasi
 * 
 * @example
 * cn("px-2 py-1", "bg-red-500", { "text-white": true, "text-black": false })
 * // Returns: "px-2 py-1 bg-red-500 text-white"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
