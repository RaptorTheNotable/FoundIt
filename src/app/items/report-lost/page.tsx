import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ReportLostForm } from '@/components/forms/ReportLostForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

async function ReportLostContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectedFrom=/items/report-lost');
  }

  return (
    <div className="space-y-6">
      {/* Safety Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-100/60 border border-brand-200 text-xs text-brand-800">
        <AlertCircle className="w-4 h-4 shrink-0 text-brand-600 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Tip:</strong> Do not post sensitive personal credentials (passwords, PINs, or confidential card CVVs) in public descriptions.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Lost Belonging Details</CardTitle>
          <CardDescription>
            Items marked with an asterisk (*) are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportLostForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportLostPage() {
  return (
    <div className="py-8 pb-16">
      <Container size="narrow">
        <PageHeader
          title="Report a Lost Item"
          description="Log details of your missing possession so fellow campus members and help desk staff can identify and notify you."
        />

        <Suspense fallback={<LoadingSpinner text="Preparing reporting form..." />}>
          <ReportLostContent />
        </Suspense>
      </Container>
    </div>
  );
}
