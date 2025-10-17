import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getInitials = (name: string) => {
  if (!name) return "CN"
  const names = name.split(' ')
  if (names.length > 1) {
    return names[0][0] + names[1][0]
  } else {
    return names[0][0] + names[0][1]
  }
};