import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { signOutAction } from '../actions';
import { User, Mail, GraduationCap, Hash, LogOut, PackageSearch, FileCheck } from 'lucide-react';
import type { Profile, Item } from '@/types';

async function ProfileContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectedFrom=/auth/profile');
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  // Fetch count of items reported by this user
  const { data: userItems } = await supabase
    .from('items')
    .select('id, item_type, status')
    .eq('user_id', user.id);

  const typedItems = (userItems || []) as unknown as Pick<Item, 'id' | 'item_type' | 'status'>[];
  const lostCount = typedItems.filter((i) => i.item_type === 'lost').length;
  const foundCount = typedItems.filter((i) => i.item_type === 'found').length;

  // Fetch count of claims submitted by this user
  const { count: claimsCount } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('claimant_id', user.id);

  const studentName = profile?.full_name || user.user_metadata?.full_name || 'Campus Member';
  const role = profile?.role || 'student';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-brand-200">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-brand-700 text-brand-50 flex items-center justify-center font-display text-xl font-bold">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-brand-900 font-display">
                {studentName}
              </h1>
              <Badge variant={role === 'admin' ? 'brand' : 'neutral'}>
                {role === 'admin' ? 'Administrator' : 'Student'}
              </Badge>
            </div>
            <p className="text-xs text-brand-600">{user.email}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <Button variant="outline" size="sm" type="submit" className="gap-1.5">
            <LogOut className="w-3.5 h-3.5 text-status-danger" />
            <span>Sign Out</span>
          </Button>
        </form>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-600 font-medium">Lost Items Reported</p>
              <p className="text-2xl font-bold text-brand-900 mt-1 tabular-nums">{lostCount}</p>
            </div>
            <div className="h-10 w-10 rounded-md bg-brand-100 flex items-center justify-center text-brand-700">
              <PackageSearch className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-600 font-medium">Found Items Reported</p>
              <p className="text-2xl font-bold text-brand-900 mt-1 tabular-nums">{foundCount}</p>
            </div>
            <div className="h-10 w-10 rounded-md bg-brand-100 flex items-center justify-center text-brand-700">
              <PackageSearch className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-600 font-medium">Active Claims</p>
              <p className="text-2xl font-bold text-brand-900 mt-1 tabular-nums">
                {claimsCount || 0}
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-brand-100 flex items-center justify-center text-brand-700">
              <FileCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Institutional Details</CardTitle>
          <CardDescription>
            Information verified by the campus registrar for ownership validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-brand-50 border border-brand-200">
              <Mail className="w-4 h-4 text-brand-600 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-800 block">Email Address</span>
                <span className="text-brand-600">{user.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-md bg-brand-50 border border-brand-200">
              <GraduationCap className="w-4 h-4 text-brand-600 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-800 block">Academic Department</span>
                <span className="text-brand-600">
                  {profile?.department || 'Not specified'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-md bg-brand-50 border border-brand-200">
              <Hash className="w-4 h-4 text-brand-600 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-800 block">Roll / Student ID</span>
                <span className="text-brand-600">
                  {profile?.roll_number || 'Not recorded'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-md bg-brand-50 border border-brand-200">
              <User className="w-4 h-4 text-brand-600 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-800 block">System Role</span>
                <span className="text-brand-600 capitalize">{role}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link href="/items/report-lost">
          <Button size="sm">Report a Lost Item</Button>
        </Link>
        <Link href="/items/report-found">
          <Button variant="secondary" size="sm">
            Report a Found Item
          </Button>
        </Link>
        <Link href="/items">
          <Button variant="outline" size="sm">
            Browse Campus Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="py-10">
      <Container size="narrow">
        <Suspense fallback={<LoadingSpinner text="Loading student profile..." />}>
          <ProfileContent />
        </Suspense>
      </Container>
    </div>
  );
}
