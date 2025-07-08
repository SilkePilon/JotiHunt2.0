'use client';

import * as React from 'react';
import { AnimatePresence, HTMLMotionProps, motion } from 'motion/react';
import { CheckIcon, ExternalLinkIcon } from 'lucide-react';
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
      variant: 'outline',
      size: 'default',
    },
  },
);

type OpenButtonProps = Omit<HTMLMotionProps<'button'>, 'children' | 'onOpen'> &
  VariantProps<typeof buttonVariants> & {
    url?: string;
    delay?: number;
    onOpen?: (url: string) => void;
    isOpened?: boolean;
    onOpenChange?: (isOpened: boolean) => void;
  };

function OpenButton({
  url,
  className,
  size,
  variant,
  delay = 1000,
  onClick,
  onOpen,
  isOpened,
  onOpenChange,
  ...props
}: OpenButtonProps) {
  const [localIsOpened, setLocalIsOpened] = React.useState(isOpened ?? false);
  const Icon = localIsOpened ? CheckIcon : ExternalLinkIcon;

  React.useEffect(() => {
    setLocalIsOpened(isOpened ?? false);
  }, [isOpened]);

  const handleIsOpened = React.useCallback(
    (isOpened: boolean) => {
      setLocalIsOpened(isOpened);
      onOpenChange?.(isOpened);
    },
    [onOpenChange],
  );

  const handleOpen = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isOpened || !url) return;
      
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
        
        handleIsOpened(true);
        setTimeout(() => handleIsOpened(false), delay);
        onOpen?.(url);
      } catch (error) {
        console.error('Error opening image', error);
      }
      
      onClick?.(e);
    },
    [isOpened, url, delay, onClick, onOpen, handleIsOpened],
  );

  return (
    <motion.button
      data-slot="open-button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={handleOpen}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={localIsOpened ? 'check' : 'open'}
          data-slot="open-button-icon"
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

export { OpenButton, buttonVariants, type OpenButtonProps };
