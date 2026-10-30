import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6 border-b border-brand-200 mb-6',
        className
      )}
      {...props}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900 font-display">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-brand-600">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

