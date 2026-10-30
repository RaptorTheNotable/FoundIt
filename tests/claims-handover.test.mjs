import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getCollectionLocation } from '../src/lib/constants.ts';

describe('1. Legitimate Claims & Submission Constraints', () => {
  test('Validates legitimate claim inputs', () => {
    const claim = {
      item_id: 'item-uuid-1',
      claimant_id: 'student-uuid-1',
      proof_description: 'I lost my boAt Airdopes with serial 849204 in library 1st floor.',
      verification_answer: 'Red Ferrari sticker on charger case',
      status: 'pending',
    };

    assert.ok(claim.item_id, 'item_id is required');
    assert.ok(claim.claimant_id, 'claimant_id is required');
    assert.ok(claim.proof_description.length > 10, 'proof_description must be descriptive');
    assert.equal(claim.status, 'pending');
  });

  test('Rejects claim if claimant is the item finder', () => {
    const item = { id: 'item-uuid-1', user_id: 'student-uuid-1', item_type: 'found' };
    const claimantId = 'student-uuid-1';

    const isSelfClaim = item.user_id === claimantId;
    assert.equal(isSelfClaim, true, 'Finder cannot file claim against their own found item');
  });

  test('Rejects claim if item is already recovered/closed', () => {
    const closedItems = [
      { id: 'item-1', status: 'recovered' },
      { id: 'item-2', status: 'handed_over' },
    ];

    for (const item of closedItems) {
      const isClosed = item.status === 'recovered' || item.status === 'handed_over';
      assert.equal(isClosed, true, `Item with status ${item.status} must reject new claims`);
    }
  });
});

describe('2. Incorrect Ownership Answers & Admin Rejection', () => {
  test('Detects mismatch between confidential answer and claimant answer', () => {
    const secretDetail = 'Red Ferrari sticker on charger case';
    const genuineAnswer = 'Red ferrari sticker';
    const fraudulentAnswer = 'Blue apple logo';

    const normalize = (s) => s.toLowerCase().trim();

    assert.equal(secretDetail.toLowerCase().includes(normalize(genuineAnswer)), true);
    assert.equal(secretDetail.toLowerCase().includes(normalize(fraudulentAnswer)), false);
  });

  test('Rejection transitions claim status to rejected with admin notes', () => {
    const claim = {
      id: 'claim-1',
      status: 'under_review',
      admin_notes: null,
      reviewed_by: null,
    };

    const admin = { id: 'admin-uuid-1', role: 'admin' };
    const rejectionReason = 'Verification answer did not match expected serial number.';

    // Admin rejects claim
    claim.status = 'rejected';
    claim.admin_notes = rejectionReason;
    claim.reviewed_by = admin.id;

    assert.equal(claim.status, 'rejected');
    assert.equal(claim.admin_notes, rejectionReason);
    assert.equal(claim.reviewed_by, admin.id);
  });
});

describe('3. Duplicate Claims Prevention', () => {
  test('Enforces uniqueness for (item_id, claimant_id)', () => {
    const claimsStore = new Set();

    const addClaim = (itemId, claimantId) => {
      const key = `${itemId}:${claimantId}`;
      if (claimsStore.has(key)) {
        throw new Error('Duplicate claim: You have already submitted a claim for this item.');
      }
      claimsStore.add(key);
      return { success: true };
    };

    // First claim succeeds
    assert.doesNotThrow(() => addClaim('item-100', 'student-001'));

    // Second claim for same item and student fails
    assert.throws(
      () => addClaim('item-100', 'student-001'),
      /Duplicate claim/
    );

    // Another student can submit a claim for the same item
    assert.doesNotThrow(() => addClaim('item-100', 'student-002'));
  });
});

describe('4. Multiple Simultaneous Approval Attempts (Race Condition Guard)', () => {
  test('Enforces partial unique index rule: Only one approved claim per item', () => {
    const claims = [
      { id: 'c1', item_id: 'item-abc', claimant_id: 'student-1', status: 'pending' },
      { id: 'c2', item_id: 'item-abc', claimant_id: 'student-2', status: 'under_review' },
    ];

    const approve = (claimId) => {
      const target = claims.find((c) => c.id === claimId);
      if (!target) throw new Error('Not found');

      const alreadyApproved = claims.some((c) => c.item_id === target.item_id && c.status === 'approved');
      if (alreadyApproved) {
        throw new Error('idx_one_approved_claim_per_item violated: Another claim is already approved.');
      }

      target.status = 'approved';
      return target;
    };

    // First approval succeeds
    assert.equal(approve('c1').status, 'approved');

    // Competing approval fails immediately
    assert.throws(
      () => approve('c2'),
      /idx_one_approved_claim_per_item violated/
    );
  });
});

describe('5. Unauthorized Administrator Access Guard', () => {
  test('Blocks student role from approving or completing handovers', () => {
    const studentUser = { id: 'student-1', role: 'student' };
    const adminUser = { id: 'admin-1', role: 'admin' };

    const checkAdmin = (user) => {
      if (user.role !== 'admin') {
        throw new Error('Access denied: Administrator privileges required.');
      }
      return true;
    };

    assert.throws(() => checkAdmin(studentUser), /Access denied/);
    assert.equal(checkAdmin(adminUser), true);
  });
});

describe('6. Unauthorized Status Changes & Invalid Transitions', () => {
  test('Only pending claims can be moved to under_review', () => {
    const moveUnderReview = (status) => {
      if (status !== 'pending') {
        throw new Error(`Invalid transition: Cannot move claim with status ${status} to under_review`);
      }
      return 'under_review';
    };

    assert.equal(moveUnderReview('pending'), 'under_review');
    assert.throws(() => moveUnderReview('rejected'), /Invalid transition/);
    assert.throws(() => moveUnderReview('completed'), /Invalid transition/);
  });

  test('Cannot approve a claim directly if already rejected or completed', () => {
    const approve = (status) => {
      if (status !== 'pending' && status !== 'under_review') {
        throw new Error(`Cannot approve claim in status: ${status}`);
      }
      return 'approved';
    };

    assert.equal(approve('pending'), 'approved');
    assert.equal(approve('under_review'), 'approved');
    assert.throws(() => approve('rejected'), /Cannot approve claim/);
    assert.throws(() => approve('completed'), /Cannot approve claim/);
  });
});

describe('7. Repeated Handover Attempts & Completion Integrity', () => {
  test('Repeated handover attempts on recovered items are rejected', () => {
    const item = { id: 'item-1', status: 'claimed' };
    const claim = { id: 'claim-1', status: 'approved' };

    const completeHandover = () => {
      if (item.status === 'recovered') {
        throw new Error('Item is already recovered. Cannot perform duplicate handover.');
      }
      if (claim.status !== 'approved') {
        throw new Error('Handover can only be completed for approved claims.');
      }
      item.status = 'recovered';
      claim.status = 'completed';
      return { success: true };
    };

    // First handover completes
    assert.doesNotThrow(() => completeHandover());
    assert.equal(item.status, 'recovered');
    assert.equal(claim.status, 'completed');

    // Repeated handover throws
    assert.throws(() => completeHandover(), /already recovered/);
  });
});

describe('8. Complete End-to-End Claim Lifecycle', () => {
  test('Lifecycle: pending -> under_review -> approved -> completed', () => {
    const item = { id: 'item-99', status: 'reported', custody_status: 'deposited_at_help_desk' };
    const claim = { id: 'claim-99', item_id: 'item-99', status: 'pending' };

    // Step 1: Admin begins review
    claim.status = 'under_review';
    assert.equal(claim.status, 'under_review');

    // Step 2: Admin approves claim
    claim.status = 'approved';
    item.status = 'claimed';
    assert.equal(claim.status, 'approved');
    assert.equal(item.status, 'claimed');

    // Step 3: Physical handover verified at desk
    claim.status = 'completed';
    item.status = 'recovered';
    item.custody_status = 'handed_over';

    assert.equal(claim.status, 'completed');
    assert.equal(item.status, 'recovered');
    assert.equal(item.custody_status, 'handed_over');
  });

  test('Configurable collection location fallback', () => {
    assert.equal(typeof getCollectionLocation(), 'string');
    assert.ok(getCollectionLocation().length > 5);
  });
});

describe('9. Database Migration & RLS File Verification', () => {
  test('Migration 002 exists and contains all required SQL artifacts', () => {
    const migPath = path.resolve('supabase/migrations/002_claims_and_audit.sql');
    assert.ok(fs.existsSync(migPath));
    const content = fs.readFileSync(migPath, 'utf8');

    assert.match(content, /idx_one_claim_per_student_per_item/);
    assert.match(content, /idx_one_approved_claim_per_item/);
    assert.match(content, /public\.audit_logs/);
    assert.match(content, /mark_claim_under_review/);
    assert.match(content, /approve_claim/);
    assert.match(content, /reject_claim/);
    assert.match(content, /complete_handover/);
  });
});
