import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ClaimSubmitForm } from '@/components/forms/ClaimSubmitForm';
import { formatDate } from '@/lib/utils';
import { Tag, MapPin, Calendar, ArrowLeft, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import type { Item, PrivateIdentifier } from '@/types';

interface ClaimSubmitPageProps {
  searchParams: Promise<{
    itemId?: string;
  }>;
}

async function ClaimSubmitContent({ searchParams }: ClaimSubmitPageProps) {
  const { itemId } = await searchParams;

  if (!itemId) {
    redirect('/items');
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectedFrom=/claims/submit?itemId=${itemId}`);
  }

  // Fetch found item
  const { data: itemData, error } = await supabase
    .from('items')
    .select('*, location:campus_locations(*)')
    .eq('id', itemId)
    .single();

  if (error || !itemData) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-brand-200 space-y-3">
        <AlertTriangle className="w-8 h-8 text-status-danger mx-auto" />
        <h3 className="text-base font-semibold text-brand-900">Item Not Found</h3>
        <p className="text-xs text-brand-600">The requested item could not be retrieved.</p>
        <Link href="/items">
          <span className="text-xs text-brand-800 underline font-medium">Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const item = itemData as unknown as Item;

  if (item.item_type !== 'found') {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-brand-200 space-y-3">
        <AlertTriangle className="w-8 h-8 text-status-warning mx-auto" />
        <h3 className="text-base font-semibold text-brand-900">Invalid Claim Target</h3>
        <p className="text-xs text-brand-600">Claims can only be filed against found campus belongings.</p>
        <Link href="/items">
          <span className="text-xs text-brand-800 underline font-medium">Return to Catalog</span>
        </Link>
      </div>
    );
  }

  if (item.status === 'recovered' || item.status === 'handed_over') {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-brand-200 space-y-3">
        <ShieldCheck className="w-8 h-8 text-status-success mx-auto" />
        <h3 className="text-base font-semibold text-brand-900">Item Already Recovered</h3>
        <p className="text-xs text-brand-600">
          This item has been officially returned to its verified owner. Claims are closed.
        </p>
        <Link href="/items">
          <span className="text-xs text-brand-800 underline font-medium">Return to Catalog</span>
        </Link>
      </div>
    );
  }

  if (item.user_id === user.id) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-brand-200 space-y-3">
        <AlertTriangle className="w-8 h-8 text-status-warning mx-auto" />
        <h3 className="text-base font-semibold text-brand-900">You Reported This Item</h3>
        <p className="text-xs text-brand-600">
          You are the finder who registered this item. You cannot submit an ownership claim on it.
        </p>
        <Link href={`/items/${item.id}`}>
          <span className="text-xs text-brand-800 underline font-medium">View Item Details</span>
        </Link>
      </div>
    );
  }

  // Check if student already submitted a claim
  const { data: existingClaim } = await supabase
    .from('claims')
    .select('id, status')
    .eq('item_id', item.id)
    .eq('claimant_id', user.id)
    .maybeSingle();

  if (existingClaim) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-brand-200 space-y-3">
        <ShieldCheck className="w-8 h-8 text-brand-700 mx-auto" />
        <h3 className="text-base font-semibold text-brand-900">Claim Already Submitted</h3>
        <p className="text-xs text-brand-600">
          You have already submitted a claim for this item. Your current claim status is{' '}
          <strong className="text-brand-900 uppercase">{existingClaim.status}</strong>.
        </p>
        <Link href="/claims">
          <span className="text-xs text-brand-800 underline font-medium">
            View in Claims Dashboard
          </span>
        </Link>
      </div>
    );
  }

  // Fetch only prompt question (NEVER secret_detail)
  const { data: privData } = await supabase
    .from('private_identifiers')
    .select('prompt_question')
    .eq('item_id', item.id)
    .maybeSingle<Pick<PrivateIdentifier, 'prompt_question'>>();

  const promptQuestion = privData?.prompt_question || null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Item Summary Preview */}
      <div className="md:col-span-1 space-y-4">
        <Card className="bg-white overflow-hidden p-0 border-brand-200">
          <div className="relative h-44 w-full bg-brand-100 flex items-center justify-center">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-brand-400 gap-1.5 p-4 text-center">
                <Tag className="w-8 h-8 text-brand-500/70" />
                <span className="text-xs font-medium text-brand-600">{item.category}</span>
              </div>
            )}
          </div>
          <div className="p-4 space-y-2 text-xs">
            <h3 className="font-semibold text-brand-900 text-sm">{item.title}</h3>
            <div className="space-y-1 text-brand-600 pt-1 border-t border-brand-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                <span>{item.location?.name || 'Campus Location'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span>Found on {formatDate(item.date)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="p-3.5 rounded-lg bg-brand-100/60 border border-brand-200 text-xs text-brand-800 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-brand-900">
            <Lock className="w-3.5 h-3.5 text-brand-700" />
            <span>Campus Verification Guarantee</span>
          </div>
          <p className="text-brand-600 leading-relaxed">
            Your verification answer is transmitted securely and compared by campus verification officers before authorization.
          </p>
        </div>
      </div>

      {/* Claim Form */}
      <div className="md:col-span-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Ownership Claim Form</CardTitle>
            <CardDescription>
              Provide sufficient evidence to demonstrate that this belonging belongs to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClaimSubmitForm
              itemId={item.id}
              promptQuestion={promptQuestion}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function ClaimSubmitPage({ searchParams }: ClaimSubmitPageProps) {
  return (
    <div className="py-8 pb-16">
      <Container size="narrow">
        <div className="mb-6">
          <Link
            href="/items"
            className="inline-flex items-center text-xs font-semibold text-brand-700 hover:text-brand-950 gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Campus Catalog</span>
          </Link>
        </div>

        <PageHeader
          title="Submit Ownership Claim"
          description="Answer the security verification question and describe ownership proof for administrator review."
        />

        <Suspense fallback={<LoadingSpinner text="Preparing claim submission form..." />}>
          <ClaimSubmitContent searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

