import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return ''
  try {
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate)
  } catch {
    return ''
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function truncateKey(key: string): string {
  if (key.length <= 8) return key
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
