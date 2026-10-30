import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ReportFoundForm } from '@/components/forms/ReportFoundForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

async function ReportFoundContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectedFrom=/items/report-found');
  }

  return (
    <div className="space-y-6">
      {/* Privacy Protocol Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-100/60 border border-brand-200 text-xs text-brand-800">
        <ShieldAlert className="w-4 h-4 shrink-0 text-brand-700 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Campus Privacy Protocol:</strong> Never publish private lock combinations, serial numbers, or confidential documents. Use the Private Ownership Verification challenge to protect against fraudulent claims.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Found Item Details</CardTitle>
          <CardDescription>
            Fields marked with an asterisk (*) are mandatory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFoundForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportFoundPage() {
  return (
    <div className="py-8 pb-16">
      <Container size="narrow">
        <PageHeader
          title="Report a Found Item"
          description="Register an item found on campus. You can keep custody until claimed or deposit it at the Campus Lost & Found Desk."
        />

        <Suspense fallback={<LoadingSpinner text="Preparing reporting form..." />}>
          <ReportFoundContent />
        </Suspense>
      </Container>
    </div>
  );
}
