import * as React from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { CAMPUS_OFFICE_DETAILS } from '@/lib/constants';
import { ShieldCheck, MapPin, Clock, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-200 bg-brand-100/60 text-brand-800 text-xs">
      <Container className="py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Institutional Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-700 text-brand-50">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-brand-900 font-display">
                FoundIt Campus
              </span>
            </div>
            <p className="text-brand-600 leading-relaxed">
              The official centralized platform for reporting, locating, and securely recovering lost
              belongings across university campus buildings.
            </p>
          </div>

          {/* Campus Desk Office Info */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-brand-900 text-xs uppercase tracking-wider">
              Campus Help Desk
            </h4>
            <div className="flex items-start gap-2 text-brand-700">
              <MapPin className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
              <span>{CAMPUS_OFFICE_DETAILS.deskLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-700">
              <Clock className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{CAMPUS_OFFICE_DETAILS.operatingHours}</span>
            </div>
          </div>

          {/* Assistance & Helpline */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-brand-900 text-xs uppercase tracking-wider">
              Student Assistance
            </h4>
            <div className="flex items-center gap-2 text-brand-700">
              <Phone className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{CAMPUS_OFFICE_DETAILS.helpline}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-700">
              <Mail className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{CAMPUS_OFFICE_DETAILS.supportEmail}</span>
            </div>
          </div>

          {/* Quick Links & Verification Policy */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-brand-900 text-xs uppercase tracking-wider">
              Platform Links
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/items" className="hover:text-brand-950 transition-colors">
                  Public Inventory Catalog
                </Link>
              </li>
              <li>
                <Link href="/items/report-lost" className="hover:text-brand-950 transition-colors">
                  Report a Lost Item
                </Link>
              </li>
              <li>
                <Link href="/items/report-found" className="hover:text-brand-950 transition-colors">
                  Submit a Found Belonging
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-brand-950 transition-colors">
                  Administrator Verification Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Privacy & Security Policy */}
        <div className="pt-6 border-t border-brand-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-brand-600">
          <p>
            &copy; 2026 FoundIt – University Campus Lost & Found Platform. All rights reserved.
          </p>
          <p className="text-[11px] text-brand-500">
            Ownership verification identifiers are private and visible only to campus verification officers.
          </p>
        </div>
      </Container>
    </footer>
  );
}
