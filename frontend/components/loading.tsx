"use client"

import { LoaderIcon } from "lucide-react"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  text?: string
}

export function Loading({ size = "md", text }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <LoaderIcon className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  )
}
