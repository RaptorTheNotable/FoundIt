'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Sign In with email and password
 */
export async function signInAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/items';

  if (!email || !password) {
    return { error: 'Please enter both your college email and password.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

/**
 * Register a new student account
 */
export async function signUpAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const fullName = formData.get('fullName') as string;
  const department = formData.get('department') as string;
  const rollNumber = formData.get('rollNumber') as string;

  if (!email || !password || !fullName) {
    return { error: 'Please complete all required fields.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match. Please verify and try again.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        department: department ? department.trim() : 'General',
        roll_number: rollNumber ? rollNumber.trim() : null,
        role: 'student',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/auth/login?registered=true');
}

/**
 * Sign out user and redirect to login
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

