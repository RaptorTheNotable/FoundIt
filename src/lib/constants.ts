export const ITEM_CATEGORIES = [
  'Electronics & Audio',
  'Phones & Laptops',
  'Cards & Student IDs',
  'Keys & Badges',
  'Wallets & Purses',
  'Bags & Backpacks',
  'Books & Stationery',
  'Bottles & Tumblers',
  'Clothing & Accessories',
  'Spectacles & Eyewear',
  'Other',
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];

export const CAMPUS_LOCATIONS = [
  { id: 'central-library', name: 'Central Library (1st & 2nd Floor)' },
  { id: 'auditorium-complex', name: 'Main Auditorium Complex' },
  { id: 'engineering-block-a', name: 'Engineering Block A (Labs & Classrooms)' },
  { id: 'engineering-block-b', name: 'Engineering Block B (Workshops)' },
  { id: 'student-center', name: 'Student Center & Food Court' },
  { id: 'sports-arena', name: 'Sports Arena & Gymnasium' },
  { id: 'science-complex', name: 'Science & Research Complex' },
  { id: 'administrative-block', name: 'Administrative Block' },
  { id: 'hostel-block-boys', name: 'Hostel Quadrangle (Boys)' },
  { id: 'hostel-block-girls', name: 'Hostel Quadrangle (Girls)' },
  { id: 'campus-shuttle-stops', name: 'North & South Shuttle Terminals' },
] as const;

export const CUSTODY_STATUSES = [
  { value: 'still_with_finder', label: 'Still with Finder' },
  { value: 'deposited_at_help_desk', label: 'Deposited at Campus Lost & Found Desk' },
  { value: 'with_administrator', label: 'In Safe Custody with Admin' },
  { value: 'handed_over', label: 'Returned to Verified Owner' },
] as const;

export const ITEM_STATUSES = [
  { value: 'reported', label: 'Reported', color: 'brand' },
  { value: 'claimed', label: 'Claim Pending', color: 'warning' },
  { value: 'verified', label: 'Claim Approved', color: 'success' },
  { value: 'handed_over', label: 'Handed Over', color: 'success' },
  { value: 'recovered', label: 'Closed / Recovered', color: 'brand' },
] as const;

export const DEFAULT_COLLECTION_LOCATION = 'Student Activity Center, Ground Floor, Room G-04';

export function getCollectionLocation(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_COLLECTION_LOCATION) {
    return process.env.NEXT_PUBLIC_COLLECTION_LOCATION;
  }
  return DEFAULT_COLLECTION_LOCATION;
}

export const CAMPUS_OFFICE_DETAILS = {
  get deskLocation() {
    return getCollectionLocation();
  },
  operatingHours: 'Monday – Friday: 9:00 AM – 5:00 PM',
  helpline: '+1 (555) 234-5678',
  supportEmail: 'lostandfound@campus.edu',
};
