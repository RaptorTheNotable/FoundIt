import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AdminClaimsTable } from '@/components/admin/AdminClaimsTable';
import { getCollectionLocation } from '@/lib/constants';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import type { Claim, AuditLog, PrivateIdentifier } from '@/types';

interface ExtendedClaim extends Claim {
  private_identifier?: Pick<PrivateIdentifier, 'prompt_question' | 'secret_detail'> | null;
}

async function AdminDashboardContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectedFrom=/admin');
  }

  // 1. Verify user profile and enforce server-side admin role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-brand-200 rounded-xl text-center space-y-4 shadow-xs">
        <div className="h-12 w-12 rounded-full bg-status-danger-bg text-status-danger flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-brand-900 font-display">
          Administrator Privileges Required
        </h2>
        <p className="text-xs text-brand-600 leading-relaxed">
          Access to the Verification Desk and Physical Handover Terminal is restricted to authorized campus lost-and-found officers.
        </p>
        <p className="text-[11px] text-brand-500">
          Logged in as: <strong>{user.email}</strong> (Role: {profile?.role || 'student'})
        </p>
        <div className="pt-2">
          <Link href="/items">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Catalog</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fetch all claims with joins (as admin)
  const { data: claimsData } = await supabase
    .from('claims')
    .select('*, item:items(*, location:campus_locations(*)), claimant:profiles!claimant_id(*)')
    .order('created_at', { ascending: false });

  const rawClaims = (claimsData || []) as unknown as Claim[];

  // 3. For each claim, fetch the corresponding private identifier (Admin RLS authorized)
  const extendedClaims: ExtendedClaim[] = await Promise.all(
    rawClaims.map(async (claim) => {
      const { data: privData } = await supabase
        .from('private_identifiers')
        .select('prompt_question, secret_detail')
        .eq('item_id', claim.item_id)
        .maybeSingle<Pick<PrivateIdentifier, 'prompt_question' | 'secret_detail'>>();

      return {
        ...claim,
        private_identifier: privData || null,
      };
    })
  );

  // 4. Fetch recent audit logs
  const { data: logsData } = await supabase
    .from('audit_logs')
    .select('*, performer:profiles!performed_by(full_name)')
    .order('created_at', { ascending: false })
    .limit(25);

  const auditLogs = (logsData || []) as unknown as AuditLog[];
  const collectionLocation = getCollectionLocation();

  return (
    <AdminClaimsTable
      initialClaims={extendedClaims}
      auditLogs={auditLogs}
      collectionLocation={collectionLocation}
    />
  );
}

export default async function AdminPage() {
  return (
    <div className="py-8 pb-16">
      <Container>
        <PageHeader
          title="Administrator Verification Desk"
          description="Examine ownership claims, compare submitted proof with private identifiers, and authorize physical handovers."
          action={
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-brand-800 text-brand-50 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Authorized Officer Session</span>
              </span>
            </div>
          }
        />

        <Suspense fallback={<LoadingSpinner text="Authenticating administrator session..." />}>
          <AdminDashboardContent />
        </Suspense>
      </Container>
    </div>
  );
}

