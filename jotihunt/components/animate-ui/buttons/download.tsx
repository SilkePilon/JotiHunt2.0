'use client';

import * as React from 'react';
import { AnimatePresence, HTMLMotionProps, motion } from 'motion/react';
import { CheckIcon, DownloadIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center cursor-pointer rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary',
        muted: 'bg-muted text-muted-foreground',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent',
      },
      size: {
        default: 'size-8 rounded-lg [&_svg]:size-4',
        sm: 'size-6 [&_svg]:size-3',
        md: 'size-10 rounded-lg [&_svg]:size-5',
        lg: 'size-12 rounded-xl [&_svg]:size-6',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default',
    },
  },
);

type DownloadButtonProps = Omit<HTMLMotionProps<'button'>, 'children' | 'onDownload'> &
  VariantProps<typeof buttonVariants> & {
    url?: string;
    filename?: string;
    delay?: number;
    onDownload?: (url: string) => void;
    isDownloaded?: boolean;
    onDownloadChange?: (isDownloaded: boolean) => void;
  };

function DownloadButton({
  url,
  filename,
  className,
  size,
  variant,
  delay = 2000,
  onClick,
  onDownload,
  isDownloaded,
  onDownloadChange,
  ...props
}: DownloadButtonProps) {
  const [localIsDownloaded, setLocalIsDownloaded] = React.useState(isDownloaded ?? false);
  const Icon = localIsDownloaded ? CheckIcon : DownloadIcon;

  React.useEffect(() => {
    setLocalIsDownloaded(isDownloaded ?? false);
  }, [isDownloaded]);

  const handleIsDownloaded = React.useCallback(
    (isDownloaded: boolean) => {
      setLocalIsDownloaded(isDownloaded);
      onDownloadChange?.(isDownloaded);
    },
    [onDownloadChange],
  );

  const handleDownload = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isDownloaded || !url) return;
      
      try {
        // Fetch the image as a blob to handle CORS and external URLs
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
          // If CORS fails, try to open in new tab as fallback
          window.open(url, '_blank');
          handleIsDownloaded(true);
          setTimeout(() => handleIsDownloaded(false), delay);
          onDownload?.(url);
          return;
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || url.split('/').pop() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        handleIsDownloaded(true);
        setTimeout(() => handleIsDownloaded(false), delay);
        onDownload?.(url);
      } catch (error) {
        console.error('Error downloading file', error);
        // Fallback: open in new tab if download fails
        window.open(url, '_blank');
        handleIsDownloaded(true);
        setTimeout(() => handleIsDownloaded(false), delay);
        onDownload?.(url);
      }
      
      onClick?.(e);
    },
    [isDownloaded, url, filename, delay, onClick, onDownload, handleIsDownloaded],
  );

  return (
    <motion.button
      data-slot="download-button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={handleDownload}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={localIsDownloaded ? 'check' : 'download'}
          data-slot="download-button-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export { DownloadButton, buttonVariants, type DownloadButtonProps };
