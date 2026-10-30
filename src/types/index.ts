export * from './database';

export interface FilterOptions {
  query?: string;
  category?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  type?: 'all' | 'lost' | 'found';
}

