import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  Search,
  PlusCircle,
  ShieldCheck,
  FileText,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { CAMPUS_OFFICE_DETAILS } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="flex flex-col space-y-12 pb-16">
      {/* Hero Section */}
      <section className="border-b border-brand-200 bg-linear-to-b from-brand-100/50 to-brand-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-white px-3 py-1 text-xs font-semibold text-brand-800 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-status-success" />
              Official Campus Student & Staff Platform
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-brand-900 font-display">
              Recover lost campus belongings with transparency & security.
            </h1>

            <p className="text-base sm:text-lg text-brand-700 leading-relaxed max-w-2xl">
              FoundIt centralizes lost-and-found reports across all university departments. Report
              lost possessions, register items you have found, and recover belongings through our
              official administrator verification process.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/items">
                <Button size="lg" className="gap-2">
                  <Search className="w-4 h-4" />
                  <span>Browse Campus Items</span>
                </Button>
              </Link>

              <Link href="/items/report-lost">
                <Button variant="secondary" size="lg" className="gap-2">
                  <PlusCircle className="w-4 h-4 text-brand-700" />
                  <span>Report Lost Item</span>
                </Button>
              </Link>

              <Link href="/items/report-found">
                <Button variant="outline" size="lg" className="gap-2">
                  <span>I Found an Item</span>
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Quick Action Cards */}
      <section>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:border-brand-400 transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-md bg-brand-100 flex items-center justify-center text-brand-800 mb-2">
                  <Search className="h-5 w-5" />
                </div>
                <CardTitle>Browse Public Inventory</CardTitle>
                <CardDescription>
                  Search reported items by campus building, category, and date.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/items"
                  className="inline-flex items-center text-xs font-semibold text-brand-800 hover:text-brand-950 gap-1.5"
                >
                  <span>Explore listings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-brand-400 transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-md bg-brand-100 flex items-center justify-center text-brand-800 mb-2">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle>Submit Ownership Claim</CardTitle>
                <CardDescription>
                  Found your missing item in the catalog? Submit a claim with proof of ownership.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/claims"
                  className="inline-flex items-center text-xs font-semibold text-brand-800 hover:text-brand-950 gap-1.5"
                >
                  <span>Check claim status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-brand-400 transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-md bg-brand-100 flex items-center justify-center text-brand-800 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle>Administrator Verification</CardTitle>
                <CardDescription>
                  Claims are verified against private identifiers before physical handover at the desk.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/admin"
                  className="inline-flex items-center text-xs font-semibold text-brand-800 hover:text-brand-950 gap-1.5"
                >
                  <span>Admin management</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-8 bg-brand-100/40 border-y border-brand-200">
        <Container>
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-900 font-display">
              The 3-Step Campus Recovery Process
            </h2>
            <p className="text-sm text-brand-600 mt-1">
              Engineered to protect student privacy and prevent fraudulent claims.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg border border-brand-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-brand-50 text-xs font-bold">
                  1
                </span>
                <h3 className="font-semibold text-sm text-brand-900">Report & Catalog</h3>
              </div>
              <p className="text-xs text-brand-600 leading-relaxed">
                Log the item with the exact campus location, time, and visible details. Private identifiers
                (passcodes, serial digits, internal contents) are stored separately and kept confidential.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-brand-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-brand-50 text-xs font-bold">
                  2
                </span>
                <h3 className="font-semibold text-sm text-brand-900">Search & Submit Claim</h3>
              </div>
              <p className="text-xs text-brand-600 leading-relaxed">
                Browse through items using category, location, and date filters. If an item matches your
                lost belonging, submit a claim answering verification questions.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-brand-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-brand-50 text-xs font-bold">
                  3
                </span>
                <h3 className="font-semibold text-sm text-brand-900">Admin Review & Handover</h3>
              </div>
              <p className="text-xs text-brand-600 leading-relaxed">
                Campus administrators compare the claim against the stored private details. Upon approval,
                both student and admin confirm the physical handover at the help desk.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Campus Help Desk Information */}
      <section>
        <Container>
          <div className="rounded-lg border border-brand-300 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700">
                <MapPin className="h-4 w-4 text-brand-600" />
                <span>Physical Custody & Verification Center</span>
              </div>
              <h3 className="text-lg font-bold text-brand-900 font-display">
                Need in-person assistance with a high-value item?
              </h3>
              <p className="text-xs text-brand-600 leading-relaxed">
                Found items can be safely surrendered to the Campus Lost & Found Desk located at{' '}
                <strong className="text-brand-800">{CAMPUS_OFFICE_DETAILS.deskLocation}</strong> during{' '}
                <strong className="text-brand-800">{CAMPUS_OFFICE_DETAILS.operatingHours}</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link href="/items/report-found" className="w-full sm:w-auto">
                <Button size="md" className="w-full sm:w-auto">
                  Log Found Belonging
                </Button>
              </Link>
              <Link href="/items" className="w-full sm:w-auto">
                <Button variant="secondary" size="md" className="w-full sm:w-auto">
                  Search Inventory
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
