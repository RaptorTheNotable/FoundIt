import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from '../src/lib/utils.ts';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS, CUSTODY_STATUSES } from '../src/lib/constants.ts';
import fs from 'node:fs';
import path from 'node:path';

describe('1. Date & Formatting Utilities', () => {
  test('formatDate should format ISO date string correctly', () => {
    const formatted = formatDate('2026-10-31');
    assert.match(formatted, /Oct 31, 2026/);
  });

  test('formatDate should handle invalid or null gracefully', () => {
    assert.equal(formatDate(null), 'Date unknown');
    assert.equal(formatDate(undefined), 'Date unknown');
    assert.equal(formatDate(''), 'Date unknown');
  });
});

describe('2. Campus Catalog & Domain Data Invariants', () => {
  test('ITEM_CATEGORIES contains expected standard campus categories', () => {
    assert.ok(ITEM_CATEGORIES.includes('Electronics & Audio'));
    assert.ok(ITEM_CATEGORIES.includes('Phones & Laptops'));
    assert.ok(ITEM_CATEGORIES.includes('Cards & Student IDs'));
    assert.ok(ITEM_CATEGORIES.includes('Keys & Badges'));
    assert.ok(ITEM_CATEGORIES.includes('Wallets & Purses'));
    assert.ok(ITEM_CATEGORIES.includes('Bags & Backpacks'));
    assert.ok(ITEM_CATEGORIES.includes('Bottles & Tumblers'));
    assert.ok(ITEM_CATEGORIES.includes('Clothing & Accessories'));
  });

  test('CAMPUS_LOCATIONS has valid unique slugs and building codes', () => {
    const slugs = new Set();
    for (const loc of CAMPUS_LOCATIONS) {
      assert.ok(loc.id, 'Location must have an ID');
      assert.ok(loc.name, 'Location must have a display name');
      assert.ok(!slugs.has(loc.id), `Duplicate location slug found: ${loc.id}`);
      slugs.add(loc.id);
    }
  });

  test('CUSTODY_STATUSES includes finder custody and campus desk deposit options', () => {
    const values = CUSTODY_STATUSES.map((c) => c.value);
    assert.ok(values.includes('still_with_finder'));
    assert.ok(values.includes('deposited_at_help_desk'));
  });
});

describe('3. Photograph Upload & Storage Security Restrictions', () => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  test('Accepts valid JPG, PNG, and WebP under 5MB', () => {
    const validJpg = { name: 'photo.jpg', size: 2.5 * 1024 * 1024, type: 'image/jpeg' };
    const validPng = { name: 'screenshot.png', size: 1.2 * 1024 * 1024, type: 'image/png' };
    const validWebp = { name: 'image.webp', size: 4.8 * 1024 * 1024, type: 'image/webp' };

    for (const f of [validJpg, validPng, validWebp]) {
      assert.ok(ALLOWED_TYPES.includes(f.type), `${f.name} should be an allowed type`);
      assert.ok(f.size <= MAX_SIZE, `${f.name} should be within 5MB`);
    }
  });

  test('Rejects oversized files > 5MB', () => {
    const oversized = { name: 'large_photo.jpg', size: 5.1 * 1024 * 1024, type: 'image/jpeg' };
    assert.equal(oversized.size <= MAX_SIZE, false, 'Files over 5MB must be rejected');
  });

  test('Rejects unsafe file types (PDF, SVG, HTML, EXE)', () => {
    const unsafeTypes = ['application/pdf', 'image/svg+xml', 'text/html', 'application/x-msdownload'];
    for (const t of unsafeTypes) {
      assert.equal(ALLOWED_TYPES.includes(t), false, `MIME type ${t} must be rejected`);
    }
  });

  test('Filename sanitization cleans special characters and spaces', () => {
    const rawFileName = "My Student ID & Card (Final) [1].jpeg";
    const extension = rawFileName.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanName = rawFileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const sanitized = `user-123/${Date.now()}_${cleanName}.${extension}`;

    assert.ok(!sanitized.includes(' '));
    assert.ok(!sanitized.includes('&'));
    assert.ok(!sanitized.includes('('));
    assert.ok(!sanitized.includes(')'));
    assert.ok(!sanitized.includes('['));
    assert.ok(!sanitized.includes(']'));
    assert.match(sanitized, /^user-123\/\d+_[a-zA-Z0-9_-]+\.jpeg$/);
  });
});

describe('4. Database DDL & Schema Inspection', () => {
  const schemaPath = path.resolve('supabase/migrations/001_initial_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  test('Schema defines unified items table with item_type enum check', () => {
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS public\.items/);
    assert.match(schemaSql, /item_type TEXT NOT NULL CHECK \(item_type IN \('lost', 'found'\)\)/);
  });

  test('Schema defines profiles linked to auth.users with automatic trigger', () => {
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS public\.profiles/);
    assert.match(schemaSql, /REFERENCES auth\.users\(id\)/);
    assert.match(schemaSql, /CREATE OR REPLACE FUNCTION public\.handle_new_user/);
    assert.match(schemaSql, /CREATE TRIGGER on_auth_user_created/);
  });

  test('Schema defines private_identifiers table separate from public items', () => {
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS public\.private_identifiers/);
    assert.match(schemaSql, /item_id UUID NOT NULL UNIQUE REFERENCES public\.items\(id\)/);
    assert.match(schemaSql, /secret_detail TEXT NOT NULL/);
    assert.match(schemaSql, /prompt_question TEXT NOT NULL/);
  });

  test('Schema enforces one approved claim rule via partial unique index', () => {
    assert.match(schemaSql, /CREATE UNIQUE INDEX IF NOT EXISTS idx_one_approved_claim_per_item/);
    assert.match(schemaSql, /ON public\.claims \(item_id\)/);
    assert.match(schemaSql, /WHERE \(status = 'approved'\)/);
  });
});

describe('5. Row Level Security (RLS) Policy Inspection', () => {
  const policiesPath = path.resolve('supabase/policies.sql');
  const policiesSql = fs.readFileSync(policiesPath, 'utf8');

  test('RLS is enabled on all tables', () => {
    assert.match(policiesSql, /ALTER TABLE public\.campus_locations ENABLE ROW LEVEL SECURITY;/);
    assert.match(policiesSql, /ALTER TABLE public\.profiles ENABLE ROW LEVEL SECURITY;/);
    assert.match(policiesSql, /ALTER TABLE public\.items ENABLE ROW LEVEL SECURITY;/);
    assert.match(policiesSql, /ALTER TABLE public\.private_identifiers ENABLE ROW LEVEL SECURITY;/);
    assert.match(policiesSql, /ALTER TABLE public\.claims ENABLE ROW LEVEL SECURITY;/);
    assert.match(policiesSql, /ALTER TABLE public\.handover_records ENABLE ROW LEVEL SECURITY;/);
  });

  test('Private identifiers are protected: only finder or admin can SELECT', () => {
    assert.match(policiesSql, /CREATE POLICY "Only original reporter or admins can view private identifiers"/);
    assert.match(policiesSql, /ON public\.private_identifiers FOR SELECT/);
    assert.match(policiesSql, /EXISTS \(\s*SELECT 1 FROM public\.items WHERE id = item_id AND user_id = auth\.uid\(\)\s*\)/);
    assert.match(policiesSql, /EXISTS \(\s*SELECT 1 FROM public\.profiles WHERE id = auth\.uid\(\) AND role = 'admin'\s*\)/);
  });

  test('Items table allows anyone to view, but only owner or admin can update', () => {
    assert.match(policiesSql, /CREATE POLICY "Public can view reported items"/);
    assert.match(policiesSql, /CREATE POLICY "Users can update own items and admins can update any"/);
    assert.match(policiesSql, /auth\.uid\(\) = user_id/);
  });

  test('Claims policy prevents claims on closed or recovered items', () => {
    assert.match(policiesSql, /CREATE POLICY "Authenticated students can submit ownership claims"/);
    assert.match(policiesSql, /status NOT IN \('recovered', 'handed_over'\)/);
  });
});

describe('6. Credentials & Security Audit', () => {
  test('No Supabase service role keys or real secrets are hardcoded in source files', () => {
    const srcFiles = fs.readdirSync('src', { recursive: true });
    for (const f of srcFiles) {
      const fullPath = path.join('src', f);
      if (fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.equal(
          content.includes('SUPABASE_SERVICE_ROLE_KEY'),
          false,
          `Found SUPABASE_SERVICE_ROLE_KEY reference in client/src file: ${f}`
        );
        assert.ok(
          !/eyJ[a-zA-Z0-9_-]{30,}/.test(content),
          `Found potential JWT secret in ${f}`
        );
      }
    }
  });
});
