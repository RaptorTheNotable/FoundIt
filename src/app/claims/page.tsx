import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { getCollectionLocation, CAMPUS_OFFICE_DETAILS } from '@/lib/constants';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import type { Claim } from '@/types';

interface ClaimsPageProps {
  searchParams: Promise<{
    status?: string;
    submitted?: string;
  }>;
}

async function ClaimsDashboardContent({ searchParams }: ClaimsPageProps) {
  const { status: statusFilter, submitted } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectedFrom=/claims');
  }

  // Fetch claims submitted by this student with joined item details
  let query = supabase
    .from('claims')
    .select('*, item:items(*, location:campus_locations(*)), reviewer:profiles!reviewed_by(full_name)')
    .eq('claimant_id', user.id)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'pending') {
      query = query.in('status', ['pending', 'under_review']);
    } else {
      query = query.eq('status', statusFilter);
    }
  }

  const { data: claimsData, error } = await query;
  const claims = (claimsData || []) as unknown as Claim[];

  const collectionLocation = getCollectionLocation();

  return (
    <div className="space-y-6">
      {/* Submission Success Banner */}
      {submitted && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-status-success-bg text-status-success text-xs font-medium border border-[#A3C7B9]">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Claim Submitted Successfully!</p>
            <p className="text-status-success/80 mt-0.5">
              Your proof of ownership and verification answer are under queue for administrator review.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-200 pb-3">
        <Link href="/claims">
          <Button
            variant={!statusFilter || statusFilter === 'all' ? 'primary' : 'ghost'}
            size="sm"
          >
            All Claims
          </Button>
        </Link>
        <Link href="/claims?status=pending">
          <Button
            variant={statusFilter === 'pending' ? 'primary' : 'ghost'}
            size="sm"
          >
            Pending / In Review
          </Button>
        </Link>
        <Link href="/claims?status=approved">
          <Button
            variant={statusFilter === 'approved' ? 'primary' : 'ghost'}
            size="sm"
          >
            Approved
          </Button>
        </Link>
        <Link href="/claims?status=completed">
          <Button
            variant={statusFilter === 'completed' ? 'primary' : 'ghost'}
            size="sm"
          >
            Completed / Recovered
          </Button>
        </Link>
        <Link href="/claims?status=rejected">
          <Button
            variant={statusFilter === 'rejected' ? 'primary' : 'ghost'}
            size="sm"
          >
            Rejected
          </Button>
        </Link>
      </div>

      {/* Claims List */}
      {error ? (
        <div className="p-4 rounded-lg bg-status-danger-bg text-status-danger text-xs border border-[#E8BAC0]">
          Failed to load claims: {error.message}
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="h-6 w-6" />}
          title="No Claims Found"
          description={
            statusFilter
              ? `You do not have any claims with status "${statusFilter}".`
              : 'You have not submitted any ownership claims yet. Browse found items to claim your missing belongings.'
          }
          actionLabel="Browse Found Items"
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const isApproved = claim.status === 'approved';
            const isCompleted = claim.status === 'completed';
            const isRejected = claim.status === 'rejected';
            const isUnderReview = claim.status === 'under_review';

            return (
              <Card key={claim.id} className="bg-white border-brand-200 p-5 space-y-4">
                {/* Header: Item Title & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-brand-100">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-brand-500 uppercase">
                      Claim ID: {claim.id.slice(0, 8)}
                    </span>
                    <h3 className="text-base font-bold text-brand-900 font-display">
                      {claim.item?.title || 'Reported Belonging'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={claim.status} />
                  </div>
                </div>

                {/* Approved Handover Action Card */}
                {isApproved && (
                  <div className="p-4 rounded-lg bg-[#EBF3F0] border border-[#A3C7B9] space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-status-success font-bold text-sm">
                      <ShieldCheck className="w-5 h-5" />
                      <span>Claim Approved — Ready for Physical Handover</span>
                    </div>
                    <p className="text-status-success/90 leading-relaxed">
                      Please proceed to the <strong>Campus Lost & Found Desk</strong> at{' '}
                      <strong className="underline">{collectionLocation}</strong> during{' '}
                      <strong>{CAMPUS_OFFICE_DETAILS.operatingHours}</strong>.
                    </p>
                    <p className="text-[11px] text-status-success/80">
                      Bring your valid student identification card. A campus administrator will verify your ID and complete the physical handover.
                    </p>
                  </div>
                )}

                {/* Under Review Notice */}
                {isUnderReview && (
                  <div className="p-3 rounded-md bg-status-warning-bg border border-[#E0D0BE] flex items-center gap-2.5 text-xs text-status-warning font-medium">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Your claim evidence is currently under active review by an administrator.</span>
                  </div>
                )}

                {/* Rejected Notice */}
                {isRejected && (
                  <div className="p-3 rounded-md bg-status-danger-bg border border-[#E8BAC0] space-y-1 text-xs text-status-danger">
                    <div className="flex items-center gap-2 font-semibold">
                      <XCircle className="w-4 h-4" />
                      <span>Claim Rejected</span>
                    </div>
                    {claim.admin_notes && (
                      <p className="text-[11px] text-status-danger/90">
                        <strong>Administrator Feedback:</strong> &ldquo;{claim.admin_notes}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Completed Notice */}
                {isCompleted && (
                  <div className="p-3 rounded-md bg-stone-100 border border-stone-200 flex items-center gap-2 text-xs text-stone-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    <span>Physical handover completed. Belonging recovered.</span>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="font-semibold text-brand-800 block mb-1">
                      Your Submitted Proof Details
                    </span>
                    <p className="text-brand-600 bg-brand-50 p-2.5 rounded border border-brand-100 whitespace-pre-line">
                      {claim.proof_description}
                    </p>
                  </div>

                  {claim.verification_answer && (
                    <div>
                      <span className="font-semibold text-brand-800 block mb-1">
                        Your Verification Answer
                      </span>
                      <p className="text-brand-600 bg-brand-50 p-2.5 rounded border border-brand-100">
                        &ldquo;{claim.verification_answer}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-brand-100 text-[11px] text-brand-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-400" />
                      Submitted on {formatDate(claim.created_at)}
                    </span>
                    {claim.reviewed_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        Reviewed on {formatDate(claim.reviewed_at)}
                      </span>
                    )}
                  </div>
                  {claim.item && (
                    <Link
                      href={`/items/${claim.item.id}`}
                      className="text-brand-700 hover:text-brand-900 underline font-semibold"
                    >
                      View Item Catalog Entry
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function ClaimsPage({ searchParams }: ClaimsPageProps) {
  return (
    <div className="py-8 pb-16">
      <Container size="narrow">
        <PageHeader
          title="My Ownership Claims"
          description="Track the status of your claims, review administrator decisions, and coordinate physical handovers."
          action={
            <Link href="/items">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Browse Found Items</span>
              </Button>
            </Link>
          }
        />

        <Suspense fallback={<LoadingSpinner text="Loading student claims..." />}>
          <ClaimsDashboardContent searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}
