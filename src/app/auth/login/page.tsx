'use client';

import * as React from 'react';
import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signInAction, type AuthActionResult } from '../actions';
import { Container } from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const redirectedFrom = searchParams.get('redirectedFrom') || '/items';

  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    signInAction,
    null
  );

  return (
    <div className="max-w-md mx-auto">
      {/* Header branding */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-brand-50 mb-1 shadow-xs">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900 font-display">
          Sign In to FoundIt
        </h1>
        <p className="text-xs text-brand-600">
          Access your college account to report items and submit ownership claims.
        </p>
      </div>

      <Card className="bg-white border-brand-200 shadow-xs">
        <CardHeader>
          <CardTitle>Account Credentials</CardTitle>
          <CardDescription>
            Use your registered institutional or student email.
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            {/* Registration success message */}
            {registered && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-status-success-bg text-status-success text-xs font-medium border border-[#A3C7B9]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Account created successfully! Please sign in with your password.</span>
              </div>
            )}

            {/* Error message banner */}
            {state?.error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-status-danger-bg text-status-danger text-xs font-medium border border-[#E8BAC0]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <input type="hidden" name="redirectTo" value={redirectedFrom} />

            <Input
              label="College Email Address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="student@college.edu"
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />

            <Button
              type="submit"
              size="md"
              className="w-full justify-center mt-2"
              isLoading={isPending}
            >
              {isPending ? 'Signing In...' : 'Sign In'}
            </Button>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-xs text-brand-600 text-center">
              Don&apos;t have an account yet?{' '}
              <Link
                href="/auth/register"
                className="font-semibold text-brand-800 hover:text-brand-950 underline underline-offset-4"
              >
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="py-12 md:py-16">
      <Container size="narrow">
        <Suspense fallback={<LoadingSpinner text="Loading authentication form..." />}>
          <LoginFormContent />
        </Suspense>
      </Container>
    </div>
  );
}
