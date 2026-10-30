import * as React from 'react';
import { cn } from '@/lib/utils';
import { ItemStatus, ClaimStatus } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  status?: ItemStatus | ClaimStatus;
}

export function Badge({
  className,
  variant = 'brand',
  status,
  children,
  ...props
}: BadgeProps) {
  // If status is supplied, automatically determine corresponding variant & label
  let appliedVariant = variant;
  let statusText = children;

  if (status) {
    switch (status) {
      case 'reported':
        appliedVariant = 'brand';
        statusText = statusText || 'Reported';
        break;
      case 'claimed':
      case 'pending':
        appliedVariant = 'warning';
        statusText = statusText || 'Claim Pending';
        break;
      case 'under_review':
        appliedVariant = 'warning';
        statusText = statusText || 'Under Review';
        break;
      case 'verified':
      case 'approved':
        appliedVariant = 'success';
        statusText = statusText || 'Verified';
        break;
      case 'handed_over':
      case 'completed':
        appliedVariant = 'success';
        statusText = statusText || 'Handed Over';
        break;
      case 'recovered':
        appliedVariant = 'neutral';
        statusText = statusText || 'Recovered';
        break;
      case 'rejected':
        appliedVariant = 'danger';
        statusText = statusText || 'Rejected';
        break;
    }
  }

  const variantStyles = {
    brand: 'bg-brand-100 text-brand-800 border-brand-200',
    success: 'bg-status-success-bg text-status-success border-[#A3C7B9]',
    warning: 'bg-status-warning-bg text-status-warning border-[#E0D0BE]',
    danger: 'bg-status-danger-bg text-status-danger border-[#E8BAC0]',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide tabular-nums',
        variantStyles[appliedVariant],
        className
      )}
      {...props}
    >
      {statusText}
    </span>
  );
}

