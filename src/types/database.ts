export type UserRole = 'student' | 'admin';

export type ItemType = 'lost' | 'found';

export type ItemStatus = 'reported' | 'claimed' | 'verified' | 'handed_over' | 'recovered';

export type CustodyStatus =
  | 'still_with_finder'
  | 'deposited_at_help_desk'
  | 'with_administrator'
  | 'handed_over';

export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';

export interface Profile {
  id: string; // references auth.users(id)
  email: string;
  full_name: string;
  roll_number?: string | null;
  department?: string | null;
  phone?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  slug: string;
  building_code: string;
  is_active: boolean;
  created_at?: string;
}

/**
 * Unified Items model for both lost and found belongings
 */
export interface Item {
  id: string;
  user_id: string; // reporter profile id
  item_type: ItemType; // 'lost' | 'found'
  title: string;
  category: string;
  brand?: string | null;
  colour: string;
  description: string;
  location_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  image_url?: string | null;
  custody_status?: CustodyStatus | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  // Joins
  location?: CampusLocation;
  user?: Profile;
}

/**
 * Sensitive ownership verification details stored separately.
 * Regular students cannot query this table.
 */
export interface PrivateIdentifier {
  id: string;
  item_id: string;
  secret_detail: string; // e.g. "Engraving on back says Alex 2024"
  prompt_question: string; // e.g. "What is inscribed on the back cover?"
  created_at: string;
}

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  proof_description: string;
  verification_answer?: string | null;
  status: ClaimStatus;
  admin_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  // Joins
  item?: Item;
  claimant?: Profile;
  reviewer?: Profile;
}

export interface HandoverRecord {
  id: string;
  claim_id: string;
  item_id: string;
  claimant_id: string;
  admin_id: string;
  handover_notes?: string | null;
  handed_over_at: string;
  claimant_confirmed: boolean;
  admin_confirmed: boolean;
  // Joins
  item?: Item;
  claimant?: Profile;
  admin?: Profile;
}

export interface AuditLog {
  id: string;
  action: 'claim_under_review' | 'claim_approved' | 'claim_rejected' | 'handover_completed';
  performed_by: string;
  target_type: 'claim' | 'item' | 'handover';
  target_id: string;
  details?: Record<string, unknown> | null;
  created_at: string;
  performer?: Profile;
}
