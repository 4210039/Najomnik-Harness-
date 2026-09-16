import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve conflicting Tailwind utilities.
 * Standard helper used by every component in this project.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}