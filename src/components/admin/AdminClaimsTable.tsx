'use client';

import * as React from 'react';
import {
  markUnderReviewAction,
  approveClaimAction,
  rejectClaimAction,
  completeHandoverAction,
} from '@/app/admin/actions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
  Lock,
  FileCheck2,
  AlertTriangle,
  History,
} from 'lucide-react';
import type { Claim, AuditLog, PrivateIdentifier } from '@/types';

interface ExtendedClaim extends Claim {
  private_identifier?: Pick<PrivateIdentifier, 'prompt_question' | 'secret_detail'> | null;
}

interface AdminClaimsTableProps {
  initialClaims: ExtendedClaim[];
  auditLogs: AuditLog[];
  collectionLocation: string;
}

export function AdminClaimsTable({
  initialClaims,
  auditLogs,
  collectionLocation,
}: AdminClaimsTableProps) {
  const [activeTab, setActiveTab] = React.useState<'pending' | 'approved' | 'history' | 'audit'>('pending');
  const [selectedClaim, setSelectedClaim] = React.useState<ExtendedClaim | null>(null);

  // Action states
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [adminNotes, setAdminNotes] = React.useState('');
  const [handoverNotes, setHandoverNotes] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<{ text: string; error?: boolean } | null>(null);

  const pendingClaims = initialClaims.filter(
    (c) => c.status === 'pending' || c.status === 'under_review'
  );
  const approvedClaims = initialClaims.filter((c) => c.status === 'approved');
  const historyClaims = initialClaims.filter(
    (c) => c.status === 'completed' || c.status === 'rejected'
  );

  const handleMarkUnderReview = async (claimId: string) => {
    setIsProcessing(true);
    setActionFeedback(null);
    const res = await markUnderReviewAction(claimId);
    setIsProcessing(false);
    if (res.error) {
      setActionFeedback({ text: res.error, error: true });
    } else {
      setActionFeedback({ text: 'Claim moved to Under Review.' });
    }
  };

  const handleApprove = async (claimId: string) => {
    setIsProcessing(true);
    setActionFeedback(null);
    const res = await approveClaimAction(claimId, adminNotes);
    setIsProcessing(false);
    if (res.error) {
      setActionFeedback({ text: res.error, error: true });
    } else {
      setActionFeedback({ text: 'Claim approved successfully. Proceed to physical handover.' });
      setSelectedClaim(null);
      setAdminNotes('');
    }
  };

  const handleReject = async (claimId: string) => {
    setIsProcessing(true);
    setActionFeedback(null);
    const res = await rejectClaimAction(claimId, rejectionReason);
    setIsProcessing(false);
    if (res.error) {
      setActionFeedback({ text: res.error, error: true });
    } else {
      setActionFeedback({ text: 'Claim rejected.' });
      setSelectedClaim(null);
      setRejectionReason('');
    }
  };

  const handleHandover = async (claimId: string) => {
    if (!window.confirm('Confirm that physical custody of the item was handed to the verified student?')) {
      return;
    }
    setIsProcessing(true);
    setActionFeedback(null);
    const res = await completeHandoverAction(claimId, handoverNotes);
    setIsProcessing(false);
    if (res.error) {
      setActionFeedback({ text: res.error, error: true });
    } else {
      setActionFeedback({ text: 'Handover confirmed and item marked as recovered.' });
      setSelectedClaim(null);
      setHandoverNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-md text-xs font-medium border flex items-center gap-2 ${
            actionFeedback.error
              ? 'bg-status-danger-bg text-status-danger border-[#E8BAC0]'
              : 'bg-status-success-bg text-status-success border-[#A3C7B9]'
          }`}
        >
          {actionFeedback.error ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-200 pb-3">
        <Button
          variant={activeTab === 'pending' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveTab('pending');
            setSelectedClaim(null);
          }}
          className="gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Claims ({pendingClaims.length})</span>
        </Button>

        <Button
          variant={activeTab === 'approved' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveTab('approved');
            setSelectedClaim(null);
          }}
          className="gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ready for Handover ({approvedClaims.length})</span>
        </Button>

        <Button
          variant={activeTab === 'history' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveTab('history');
            setSelectedClaim(null);
          }}
          className="gap-1.5"
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>History & Resolved ({historyClaims.length})</span>
        </Button>

        <Button
          variant={activeTab === 'audit' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveTab('audit');
            setSelectedClaim(null);
          }}
          className="gap-1.5 ml-auto"
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log ({auditLogs.length})</span>
        </Button>
      </div>

      {/* Main View Area */}
      {activeTab === 'audit' ? (
        /* Audit Log Table */
        <Card className="bg-white border-brand-200 p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-100 bg-brand-50 flex items-center justify-between">
            <h3 className="font-semibold text-xs text-brand-900 uppercase tracking-wider">
              Administrator Decision Audit Trail
            </h3>
            <span className="text-[11px] text-brand-500">Immutable PostgreSQL record</span>
          </div>
          {auditLogs.length === 0 ? (
            <p className="p-8 text-center text-xs text-brand-500">No audit logs recorded yet.</p>
          ) : (
            <div className="divide-y divide-brand-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-900 uppercase tracking-wider text-[11px]">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-brand-400">·</span>
                      <span className="text-brand-600">
                        Admin: {log.performer?.full_name || log.performed_by.slice(0, 8)}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-brand-500 font-mono">
                        Target: {log.target_type} ({log.target_id.slice(0, 8)})
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-brand-400 shrink-0">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        /* Claims Queue / Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Claims List Column */}
          <div className="lg:col-span-1 space-y-3">
            {((activeTab === 'pending' ? pendingClaims : activeTab === 'approved' ? approvedClaims : historyClaims).length === 0) ? (
              <p className="p-8 text-center text-xs text-brand-500 bg-white rounded-lg border border-brand-200">
                No claims in this category.
              </p>
            ) : (
              (activeTab === 'pending' ? pendingClaims : activeTab === 'approved' ? approvedClaims : historyClaims).map((claim) => {
                const isSelected = selectedClaim?.id === claim.id;

                return (
                  <Card
                    key={claim.id}
                    onClick={() => setSelectedClaim(claim)}
                    className={`p-4 cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-brand-700 bg-brand-50/80 shadow-xs ring-1 ring-brand-700'
                        : 'border-brand-200 bg-white hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-brand-500 uppercase">
                        {claim.id.slice(0, 8)}
                      </span>
                      <Badge status={claim.status} />
                    </div>

                    <h4 className="font-bold text-sm text-brand-900 line-clamp-1 mb-1">
                      {claim.item?.title || 'Reported Belonging'}
                    </h4>

                    <div className="text-xs text-brand-600 space-y-0.5">
                      <p className="truncate">
                        Claimant: <strong className="text-brand-800">{claim.claimant?.full_name || 'Student'}</strong>
                      </p>
                      <p className="text-[11px] text-brand-500">
                        Submitted: {formatDate(claim.created_at)}
                      </p>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Verification Detail & Comparison Panel */}
          <div className="lg:col-span-2">
            {selectedClaim ? (
              <Card className="bg-white border-brand-200 p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-brand-100">
                  <div>
                    <span className="text-xs font-semibold text-brand-500 uppercase tracking-wide">
                      Reviewing Claim #{selectedClaim.id.slice(0, 8)}
                    </span>
                    <h2 className="text-xl font-bold text-brand-900 font-display">
                      {selectedClaim.item?.title}
                    </h2>
                  </div>
                  <Badge status={selectedClaim.status} />
                </div>

                {/* Claimant & Item Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-brand-50 border border-brand-200 space-y-1.5">
                    <span className="font-bold text-brand-900 block flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-700" />
                      Claimant Identity
                    </span>
                    <p className="text-brand-800 font-medium">{selectedClaim.claimant?.full_name}</p>
                    <p className="text-brand-600">{selectedClaim.claimant?.email}</p>
                    <p className="text-[11px] text-brand-500">
                      Dept: {selectedClaim.claimant?.department || 'N/A'} · Roll: {selectedClaim.claimant?.roll_number || 'N/A'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-brand-50 border border-brand-200 space-y-1.5">
                    <span className="font-bold text-brand-900 block flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-700" />
                      Found Item Record
                    </span>
                    <p className="text-brand-800 font-medium">Category: {selectedClaim.item?.category}</p>
                    <p className="text-brand-600">Location: {selectedClaim.item?.location?.name || 'Campus'}</p>
                    <p className="text-[11px] text-brand-500">
                      Found Date: {formatDate(selectedClaim.item?.date)}
                    </p>
                  </div>
                </div>

                {/* Side-by-Side Ownership Verification Evidence */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-700" />
                    <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                      Ownership Verification Evidence Comparison
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Expected Secret Answer (Confidential to Admins) */}
                    <div className="p-4 rounded-lg bg-[#F6EFE6] border border-[#E0D0BE] space-y-1.5 text-xs">
                      <span className="font-bold text-status-warning block uppercase text-[10px] tracking-wider">
                        Original Confidential Identifier (Admin Only)
                      </span>
                      {selectedClaim.private_identifier ? (
                        <>
                          <p className="text-brand-700">
                            <strong>Question:</strong> &ldquo;{selectedClaim.private_identifier.prompt_question}&rdquo;
                          </p>
                          <div className="mt-2 pt-2 border-t border-[#E0D0BE]">
                            <span className="font-semibold text-brand-900 block">Expected Answer:</span>
                            <p className="text-brand-800 font-mono text-sm bg-white/70 p-2 rounded mt-1">
                              {selectedClaim.private_identifier.secret_detail}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-brand-600 italic">No private identifier challenge registered for this item.</p>
                      )}
                    </div>

                    {/* Claimant's Answer */}
                    <div className="p-4 rounded-lg bg-white border border-brand-200 space-y-1.5 text-xs">
                      <span className="font-bold text-brand-800 block uppercase text-[10px] tracking-wider">
                        Student&apos;s Submitted Answer
                      </span>
                      <div className="mt-1">
                        <span className="font-semibold text-brand-900 block">Answer Provided:</span>
                        <p className="text-brand-800 font-mono text-sm bg-brand-50 p-2 rounded mt-1 border border-brand-100">
                          {selectedClaim.verification_answer || '(No answer provided)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Claimant's General Proof Description */}
                  <div className="space-y-1 text-xs pt-1">
                    <span className="font-semibold text-brand-800 block">
                      Claimant&apos;s Detailed Proof of Ownership:
                    </span>
                    <p className="text-brand-700 bg-brand-50 p-3 rounded border border-brand-100 whitespace-pre-line">
                      {selectedClaim.proof_description}
                    </p>
                  </div>
                </div>

                {/* Administrator Action Panel */}
                <div className="pt-4 border-t border-brand-200 space-y-4">
                  {selectedClaim.status === 'pending' && (
                    <div className="flex items-center justify-between p-3 rounded bg-brand-50 border border-brand-100 text-xs">
                      <span>Begin active examination of this claim:</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMarkUnderReview(selectedClaim.id)}
                        disabled={isProcessing}
                      >
                        Mark Under Review
                      </Button>
                    </div>
                  )}

                  {(selectedClaim.status === 'pending' || selectedClaim.status === 'under_review') && (
                    <div className="space-y-3">
                      <Input
                        label="Administrator Approval / Review Notes (Optional)"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="e.g. Serial match verified against student purchase slip"
                        disabled={isProcessing}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {/* Reject Section with Reason */}
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <Input
                            placeholder="Rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            disabled={isProcessing}
                            className="text-xs h-9"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(selectedClaim.id)}
                            disabled={isProcessing}
                            className="shrink-0"
                          >
                            Reject
                          </Button>
                        </div>

                        {/* Approve Button */}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(selectedClaim.id)}
                          disabled={isProcessing}
                          className="gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Approve Claim</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedClaim.status === 'approved' && (
                    <div className="p-4 rounded-lg bg-[#EBF3F0] border border-[#A3C7B9] space-y-3 text-xs">
                      <div className="space-y-1">
                        <span className="font-bold text-status-success text-sm block">
                          Ready for Physical Handover
                        </span>
                        <p className="text-status-success/90">
                          Handover Desk: <strong>{collectionLocation}</strong>
                        </p>
                      </div>

                      <Input
                        label="Handover Notes / Verification Officer Remarks"
                        value={handoverNotes}
                        onChange={(e) => setHandoverNotes(e.target.value)}
                        placeholder="e.g. Verified student card #CS-2024-042 in person"
                        disabled={isProcessing}
                      />

                      <div className="flex justify-end pt-2">
                        <Button
                          size="md"
                          onClick={() => handleHandover(selectedClaim.id)}
                          disabled={isProcessing}
                          className="bg-status-success hover:bg-[#2F5849] border-[#2F5849] gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Handover & Mark Recovered</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedClaim.status === 'completed' && (
                    <div className="p-3.5 rounded bg-stone-100 text-stone-700 text-xs flex items-center gap-2 border border-stone-200">
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                      <span>This item has been officially handed over to the verified claimant and closed.</span>
                    </div>
                  )}

                  {selectedClaim.status === 'rejected' && (
                    <div className="p-3.5 rounded bg-status-danger-bg text-status-danger text-xs flex items-center gap-2 border border-[#E8BAC0]">
                      <XCircle className="w-4 h-4" />
                      <span>
                        This claim was rejected. Reason: &ldquo;{selectedClaim.admin_notes || 'Failed ownership verification'}&rdquo;
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-dashed border-brand-200">
                <ShieldAlert className="w-10 h-10 text-brand-300 mb-2" />
                <h3 className="text-sm font-semibold text-brand-800">No Claim Selected</h3>
                <p className="text-xs text-brand-500 max-w-xs mt-1">
                  Select a claim from the left queue to compare evidence, verify the ownership answer, and issue an administrative decision.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

