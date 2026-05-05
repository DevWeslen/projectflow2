import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('/uploads/')) {
    return url.replace('/uploads/', '/api/files/')
  }
  return url
}
