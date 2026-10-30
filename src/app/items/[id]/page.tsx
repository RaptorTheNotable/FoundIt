import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import {
  Tag,
  ShieldCheck,
  ArrowLeft,
  Lock,
  FileCheck2,
} from 'lucide-react';
import type { Item, PrivateIdentifier } from '@/types';

interface ItemDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function ItemDetailContent({ params }: ItemDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Query item data with joins (STRICT: never query secret_detail from private_identifiers here!)
  const { data: itemData, error } = await supabase
    .from('items')
    .select('*, location:campus_locations(*), user:profiles(id, full_name, email, department, role)')
    .eq('id', id)
    .single();

  if (error || !itemData) {
    notFound();
  }

  const item = itemData as unknown as Item;
  const isOwner = user?.id === item.user_id;
  const isFound = item.item_type === 'found';
  const isClosed = item.status === 'recovered' || item.status === 'handed_over';

  // 3. If it's a found item, check if there is a prompt question for claimants
  // Query only prompt_question via secure RPC, View, or direct query (NEVER secret_detail)
  let promptQuestion: string | null = null;
  if (isFound) {
    try {
      const { data: rpcQuestion } = await supabase.rpc('get_item_prompt_question', {
        p_item_id: item.id,
      });
      if (rpcQuestion) {
        promptQuestion = rpcQuestion;
      }
    } catch {
      // RPC fallback
    }

    if (!promptQuestion) {
      try {
        const { data: viewData } = await supabase
          .from('item_prompt_questions')
          .select('prompt_question')
          .eq('item_id', item.id)
          .maybeSingle();

        if (viewData?.prompt_question) {
          promptQuestion = viewData.prompt_question;
        }
      } catch {
        // View fallback
      }
    }

    if (!promptQuestion) {
      const { data: privData } = await supabase
        .from('private_identifiers')
        .select('prompt_question')
        .eq('item_id', item.id)
        .maybeSingle<Pick<PrivateIdentifier, 'prompt_question'>>();

      promptQuestion = privData?.prompt_question || null;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column: Photograph or Category Fallback */}
      <div className="md:col-span-1 space-y-4">
        <Card className="p-0 overflow-hidden bg-white border border-brand-200">
          <div className="relative h-64 w-full bg-brand-100 flex items-center justify-center">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-brand-400 gap-2 p-6 text-center">
                <Tag className="w-12 h-12 text-brand-500/70" />
                <span className="text-xs font-medium text-brand-600">
                  No photograph provided
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Reporter Information */}
        <Card className="bg-white p-4 space-y-2.5">
          <h4 className="text-xs font-bold text-brand-800 uppercase tracking-wider">
            Reported By
          </h4>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center font-bold text-xs">
              {item.user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-900">
                {item.user?.full_name || 'Campus Student'}
              </p>
              <p className="text-[11px] text-brand-500">
                {item.user?.department || 'Department Member'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column: Item Information & Actions */}
      <div className="md:col-span-2 space-y-6">
        <Card className="bg-white p-6 space-y-5">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold tracking-wide uppercase ${
                  isFound ? 'bg-brand-800 text-brand-50' : 'bg-brand-600 text-brand-50'
                }`}
              >
                {isFound ? 'Found Belonging' : 'Lost Item'}
              </span>
              <Badge status={item.status} />
              {isOwner && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-800 border border-brand-200">
                  Your Report
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-brand-900 font-display tracking-tight">
              {item.title}
            </h1>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-brand-100 text-xs">
            <div>
              <span className="text-brand-500 block">Category</span>
              <span className="font-semibold text-brand-900">{item.category}</span>
            </div>
            <div>
              <span className="text-brand-500 block">Primary Colour</span>
              <span className="font-semibold text-brand-900">{item.colour}</span>
            </div>
            <div>
              <span className="text-brand-500 block">Brand / Model</span>
              <span className="font-semibold text-brand-900">{item.brand || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-brand-500 block">Date Reported</span>
              <span className="font-semibold text-brand-900">{formatDate(item.date)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-brand-500 block">Campus Location</span>
              <span className="font-semibold text-brand-900">
                {item.location?.name || 'General Campus'}
              </span>
            </div>
            {isFound && item.custody_status && (
              <div className="col-span-2 pt-1 border-t border-brand-100">
                <span className="text-brand-500 block">Physical Custody</span>
                <span className="font-semibold text-brand-900">
                  {item.custody_status === 'deposited_at_help_desk'
                    ? 'Deposited at Campus Lost & Found Desk (SAC Room G-04)'
                    : 'Currently in custody with the finder'}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-brand-800">Item Description</h4>
            <p className="text-xs text-brand-700 leading-relaxed whitespace-pre-line bg-brand-50/60 p-3 rounded-md border border-brand-100">
              {item.description}
            </p>
          </div>

          {/* Action Banner: Ownership Claim or Recovery Status */}
          <div className="pt-3 border-t border-brand-200">
            {isClosed ? (
              <div className="flex items-center gap-2.5 p-3.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200">
                <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
                <span>
                  This item has been officially recovered and handed over to its verified owner. Claims are closed.
                </span>
              </div>
            ) : isOwner ? (
              <div className="p-3.5 rounded-md bg-brand-50 text-brand-800 text-xs border border-brand-200 flex items-center justify-between">
                <span>You are the reporter of this item.</span>
                <Link href="/auth/profile">
                  <Button variant="outline" size="sm">
                    View in Profile
                  </Button>
                </Link>
              </div>
            ) : isFound ? (
              <div className="space-y-3">
                {promptQuestion && (
                  <div className="p-3 rounded-md bg-brand-50 border border-brand-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-brand-900">
                      <Lock className="w-3.5 h-3.5 text-brand-700" />
                      <span>Ownership Verification Challenge</span>
                    </div>
                    <p className="text-brand-600">
                      To claim this item, you will be required to answer:
                    </p>
                    <p className="font-medium text-brand-800 italic">
                      &ldquo;{promptQuestion}&rdquo;
                    </p>
                  </div>
                )}

                {user ? (
                  <Link href={`/claims/submit?itemId=${item.id}`}>
                    <Button size="md" className="w-full justify-center gap-2">
                      <FileCheck2 className="w-4 h-4" />
                      <span>Submit Ownership Claim</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/auth/login?redirectedFrom=/items/${item.id}`}>
                    <Button size="md" className="w-full justify-center">
                      Sign In to Submit Claim
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-md bg-brand-50 text-brand-700 text-xs border border-brand-200">
                Have you found this item? Contact the campus help desk or report it as found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
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

        <Suspense fallback={<LoadingSpinner text="Loading item details..." />}>
          <ItemDetailContent params={params} />
        </Suspense>
      </Container>
    </div>
  );
}
