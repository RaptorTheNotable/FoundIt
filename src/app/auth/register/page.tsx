'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { signUpAction, type AuthActionResult } from '../actions';
import { Container } from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserPlus, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    signUpAction,
    null
  );

  return (
    <div className="py-12 md:py-16">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          {/* Header branding */}
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-brand-50 mb-1 shadow-xs">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-900 font-display">
              Create Student Account
            </h1>
            <p className="text-xs text-brand-600">
              Register with your campus email to track lost belongings and recover found items.
            </p>
          </div>

          <Card className="bg-white border-brand-200 shadow-xs">
            <CardHeader>
              <CardTitle>Student Profile Details</CardTitle>
              <CardDescription>
                Your department and roll number help verify ownership during recovery.
              </CardDescription>
            </CardHeader>

            <form action={formAction}>
              <CardContent className="space-y-4">
                {/* Error message banner */}
                {state?.error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-status-danger-bg text-status-danger text-xs font-medium border border-[#E8BAC0]">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{state.error}</span>
                  </div>
                )}

                <Input
                  label="Full Name"
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Sahil George"
                />

                <Input
                  label="Campus Email Address"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@college.edu"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Department"
                    id="department"
                    name="department"
                    type="text"
                    placeholder="e.g. Computer Science"
                  />
                  <Input
                    label="Roll / Student ID"
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    placeholder="e.g. CS-2024-042"
                  />
                </div>

                <Input
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="At least 6 characters"
                />

                <Input
                  label="Confirm Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Repeat your password"
                />

                <Button
                  type="submit"
                  size="md"
                  className="w-full justify-center mt-2"
                  isLoading={isPending}
                >
                  {isPending ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              </CardContent>

              <CardFooter className="justify-center">
                <p className="text-xs text-brand-600 text-center">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-brand-800 hover:text-brand-950 underline underline-offset-4"
                  >
                    Sign In
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </Container>
    </div>
  );
}

