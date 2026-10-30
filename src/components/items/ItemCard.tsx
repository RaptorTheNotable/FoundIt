import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { MapPin, Calendar, Tag } from 'lucide-react';
import type { Item } from '@/types';

export interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const isFound = item.item_type === 'found';

  return (
    <Card className="flex flex-col h-full overflow-hidden p-0 bg-white border border-brand-200 hover:border-brand-300 transition-all shadow-xs group">
      {/* Image Preview / Category Fallback */}
      <div className="relative h-48 w-full bg-brand-100 flex items-center justify-center overflow-hidden border-b border-brand-100">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-brand-400 gap-1.5 p-4 text-center">
            <Tag className="w-8 h-8 text-brand-500/70" />
            <span className="text-xs font-medium text-brand-600">{item.category}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
              isFound ? 'bg-brand-800 text-brand-50' : 'bg-brand-600 text-brand-50'
            }`}
          >
            {isFound ? 'Found Belonging' : 'Lost Item'}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5">
          <Badge status={item.status} />
        </div>
      </div>

      {/* Content Details */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-brand-900 text-sm line-clamp-1 mb-1 group-hover:text-brand-700 transition-colors">
          {item.title}
        </h3>

        <p className="text-xs text-brand-600 line-clamp-2 mb-3 leading-relaxed">
          {item.description}
        </p>

        {/* Metadata Badges */}
        <div className="space-y-1.5 text-xs text-brand-700 mt-auto pt-2 border-t border-brand-100">
          <div className="flex items-center gap-1.5 text-brand-600">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-500" />
            <span className="truncate">{item.location?.name || 'Campus Location'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-600">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-brand-500" />
            <span>{formatDate(item.date)}</span>
          </div>
          {item.brand && (
            <div className="flex items-center gap-1.5 text-brand-600">
              <span className="font-medium text-brand-800">Brand:</span>
              <span>{item.brand}</span>
              {item.colour && <span className="text-brand-400">· {item.colour}</span>}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-brand-100 flex items-center justify-between">
          <Link
            href={`/items/${item.id}`}
            className="w-full text-center text-xs font-semibold py-2 px-3 rounded-md bg-brand-100 hover:bg-brand-200 text-brand-900 transition-colors"
          >
            {isFound ? 'View & Submit Claim' : 'View Lost Report'}
          </Link>
        </div>
      </div>
    </Card>
  );
}
