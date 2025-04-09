"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Wheat } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-black/70 backdrop-blur-md">
      <div className="container flex h-14 items-center">
        <div className="flex items-center mr-4">
          <Wheat className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span className="ml-2 font-bold text-emerald-800 dark:text-emerald-300">Angata Sugar Mills</span>
        </div>
        <div className="flex gap-6 text-sm">
          <Link
            href="/"
            className={cn(
              "transition-colors hover:text-emerald-700 dark:hover:text-emerald-300",
              pathname === "/" 
                ? "text-emerald-800 dark:text-emerald-300 font-medium" 
                : "text-emerald-600/70 dark:text-emerald-400/70"
            )}
          >
            Talk to AI
          </Link>
          <Link
            href="/history"
            className={cn(
              "transition-colors hover:text-emerald-700 dark:hover:text-emerald-300",
              pathname === "/history" 
                ? "text-emerald-800 dark:text-emerald-300 font-medium" 
                : "text-emerald-600/70 dark:text-emerald-400/70"
            )}
          >
            Call History
          </Link>
          <Link
            href="/analytics"
            className={cn(
              "transition-colors hover:text-emerald-700 dark:hover:text-emerald-300",
              pathname === "/analytics" 
                ? "text-emerald-800 dark:text-emerald-300 font-medium" 
                : "text-emerald-600/70 dark:text-emerald-400/70"
            )}
          >
            Analytics
          </Link>
        </div>
      </div>
    </nav>
  )
} 