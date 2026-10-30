import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({
  size = 'md',
  text,
  className,
  ...props
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn('flex flex-col items-center justify-center p-6 gap-2 text-brand-600', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-brand-700', sizeMap[size])} />
      {text && <p className="text-xs text-brand-600 font-medium">{text}</p>}
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="rounded-lg border border-brand-200 bg-white p-4 space-y-3 animate-pulse">
      <div className="h-40 bg-brand-100 rounded-md w-full" />
      <div className="h-4 bg-brand-200 rounded w-3/4" />
      <div className="h-3 bg-brand-100 rounded w-1/2" />
      <div className="flex justify-between items-center pt-2 border-t border-brand-100">
        <div className="h-4 bg-brand-100 rounded w-1/3" />
        <div className="h-6 bg-brand-100 rounded w-16" />
      </div>
    </div>
  );
}

