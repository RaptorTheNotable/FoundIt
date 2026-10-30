import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { ItemCard } from '@/components/items/ItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS } from '@/lib/constants';
import type { Item } from '@/types';

interface ItemsPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    location?: string;
    q?: string;
  }>;
}

async function ItemsPageContent({ searchParams }: ItemsPageProps) {
  const params = await searchParams;
  const itemType = params.type || 'all';
  const category = params.category || '';
  const locationId = params.location || '';
  const query = params.q || '';

  const supabase = await createClient();

  // Conventional SQL search query with Supabase
  let dbQuery = supabase
    .from('items')
    .select('*, location:campus_locations(*)')
    .order('created_at', { ascending: false });

  if (itemType === 'lost' || itemType === 'found') {
    dbQuery = dbQuery.eq('item_type', itemType);
  }

  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  if (locationId) {
    dbQuery = dbQuery.eq('location_id', locationId);
  }

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`);
  }

  const { data: items, error } = await dbQuery;
  const typedItems = (items || []) as unknown as Item[];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...ITEM_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const locationOptions = [
    { value: '', label: 'All Campus Locations' },
    ...CAMPUS_LOCATIONS.map((l) => ({ value: l.id, label: l.name })),
  ];

  return (
    <div className="py-8 pb-16">
      <Container>
        <PageHeader
          title="Campus Lost & Found Catalog"
          description="Browse reported lost possessions and found items. Use conventional filters to locate your belongings."
          action={
            <div className="flex items-center gap-2">
              <Link href="/items/report-lost">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Report Lost</span>
                </Button>
              </Link>
              <Link href="/items/report-found">
                <Button size="sm" className="gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Report Found</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* Filter Toolbar */}
        <div className="mb-8 p-4 rounded-lg bg-white border border-brand-200 shadow-2xs space-y-3">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search items, brands, keywords..."
                className="pl-8"
              />
              <Search className="w-4 h-4 text-brand-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>

            {/* Type Filter */}
            <Select
              name="type"
              defaultValue={itemType}
              options={[
                { value: 'all', label: 'All Item Types' },
                { value: 'found', label: 'Found Belongings' },
                { value: 'lost', label: 'Lost Belongings' },
              ]}
            />

            {/* Category Filter */}
            <Select
              name="category"
              defaultValue={category}
              options={categoryOptions}
            />

            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <Select
                name="location"
                defaultValue={locationId}
                options={locationOptions}
                className="w-full"
              />
              <Button type="submit" variant="secondary" size="md" className="shrink-0">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
            </div>
          </form>

          {/* Active Filter Pills */}
          {(itemType !== 'all' || category || locationId || query) && (
            <div className="flex items-center gap-2 pt-2 border-t border-brand-100 text-xs text-brand-600">
              <span className="font-semibold text-brand-800">Active Filters:</span>
              {itemType !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-medium">
                  Type: {itemType}
                </span>
              )}
              {category && (
                <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-medium">
                  Category: {category}
                </span>
              )}
              {locationId && (
                <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-medium">
                  Location: {CAMPUS_LOCATIONS.find((l) => l.id === locationId)?.name || locationId}
                </span>
              )}
              {query && (
                <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-medium">
                  &ldquo;{query}&rdquo;
                </span>
              )}
              <Link href="/items" className="text-brand-700 hover:underline ml-auto font-medium">
                Reset filters
              </Link>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {error ? (
          <div className="p-6 rounded-lg bg-status-danger-bg text-status-danger border border-[#E8BAC0] text-sm">
            <p className="font-semibold">Unable to fetch campus items from database</p>
            <p className="text-xs mt-1">{error.message}</p>
          </div>
        ) : typedItems.length === 0 ? (
          <EmptyState
            title="No Items Found"
            description="No reported lost or found items match your current filter criteria. Try adjusting your search query or campus location."
            actionLabel="Reset All Filters"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {typedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

export default function ItemsPage({ searchParams }: ItemsPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading campus catalog..." />}>
      <ItemsPageContent searchParams={searchParams} />
    </Suspense>
  );
}
