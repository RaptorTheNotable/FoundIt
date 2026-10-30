'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  PlusCircle,
  FileCheck2,
  ShieldAlert,
  Menu,
  X,
  User,
  Compass,
} from 'lucide-react';
import { Container } from './Container';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Browse Items', href: '/items', icon: Compass },
  { name: 'Report Lost', href: '/items/report-lost', icon: PlusCircle },
  { name: 'Report Found', href: '/items/report-found', icon: PlusCircle },
  { name: 'My Claims', href: '/claims', icon: FileCheck2 },
  { name: 'Admin', href: '/admin', icon: ShieldAlert, badge: 'Staff' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  React.useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email || null);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email || null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // In SSR or unconfigured env
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-200 bg-brand-50/90 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Brand Wordmark & University Identity */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-brand-900 group transition-opacity hover:opacity-90"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-brand-50 shadow-xs">
                <Search className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-brand-900 font-display">
                  FoundIt
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-600 -mt-1">
                  Campus Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-200 text-brand-900 font-semibold'
                        : 'text-brand-800 hover:bg-brand-100 hover:text-brand-900'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-brand-600" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-1 rounded px-1.5 py-0.2 text-[10px] font-semibold bg-brand-700 text-brand-50">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action / Auth Button */}
          <div className="hidden sm:flex items-center gap-3">
            {userEmail ? (
              <Link href="/auth/profile">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <User className="h-3.5 w-3.5 text-brand-700" />
                  <span className="max-w-[120px] truncate">{userEmail.split('@')[0]}</span>
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <User className="h-3.5 w-3.5 text-brand-700" />
                  <span>Account Login</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-brand-700 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-brand-200 bg-brand-50 px-4 pt-3 pb-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium',
                  isActive
                    ? 'bg-brand-200 text-brand-900 font-semibold'
                    : 'text-brand-800 hover:bg-brand-100'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-brand-600" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-brand-700 text-brand-50">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-brand-200 mt-2">
            {userEmail ? (
              <Link href="/auth/profile" onClick={closeMobileMenu} className="block w-full">
                <Button variant="secondary" size="md" className="w-full justify-center">
                  My Profile ({userEmail})
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login" onClick={closeMobileMenu} className="block w-full">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Sign In / Student Account
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
