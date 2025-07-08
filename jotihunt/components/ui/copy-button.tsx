"use client"

import * as React from "react"
import { Check, Copy, Download } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  content?: string
  onCopy?: (content: string) => void
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  delay?: number
  className?: string
}

export function CopyButton({
  content = "",
  onCopy,
  variant = "default",
  size = "default",
  delay = 3000,
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      onCopy?.(content)
      toast.success("Copied to clipboard")
      
      setTimeout(() => setCopied(false), delay)
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("transition-all duration-200", className)}
      onClick={handleCopy}
      {...props}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500 animate-in zoom-in-50 duration-200" />
      ) : (
        <Copy className="h-4 w-4 transition-transform hover:scale-110" />
      )}
    </Button>
  )
}

interface DownloadButtonProps {
  url?: string
  filename?: string
  onDownload?: (url: string) => void
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function DownloadButton({
  url = "",
  filename,
  onDownload,
  variant = "secondary",
  size = "default",
  className,
  ...props
}: DownloadButtonProps) {
  const [downloading, setDownloading] = React.useState(false)

  const handleDownload = async () => {
    if (!url) return

    try {
      setDownloading(true)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || url.split('/').pop() || 'download'
      link.target = '_blank'
      link.click()
      
      onDownload?.(url)
      toast.success("Download started")
      
      setTimeout(() => setDownloading(false), 1000)
    } catch (error) {
      toast.error("Failed to download")
      setDownloading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("transition-all duration-200", className)}
      onClick={handleDownload}
      disabled={downloading}
      {...props}
    >
      <Download 
        className={cn(
          "h-4 w-4 transition-transform hover:scale-110",
          downloading && "animate-bounce"
        )} 
      />
    </Button>
  )
}
