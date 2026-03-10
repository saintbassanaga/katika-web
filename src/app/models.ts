// ─── Pagination ──────────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  userId: string;
  fullName: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPPORT' | 'SUPERVISOR';
  email?: string;
  mfaEnabled: boolean;
  verified: boolean;
  issuedAt: string;
  expiresAt: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  requiresMfa: boolean;
  challengeId: string | null;
  mfaExpiresIn: number | null;
  mfaType: string | null;
  userId: string | null;
  role: string | null;
  message: string;
}

export interface RegisterRequest {
  phoneNumber: string;
  fullName: string;
  password: string;
  email?: string;
}

export interface MfaVerifyRequest {
  challengeId: string;
  code: string;
  backupCode?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email?: string;
  cniNumber?: string;
}

export interface MfaSetupResponse {
  secretKey: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  message: string;
}

// ─── Escrow ───────────────────────────────────────────────────────────────────

export interface EscrowCreateRequest {
  buyerPhone: string;
  grossAmount: number;
  description?: string;
  deliveryDeadline?: string;
  idempotencyKey?: string;
}

export interface TransactionSummary {
  id: string;
  reference: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  lockedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  releasedAt: string | null;
  disputedAt: string | null;
  refundedAt: string | null;
}

export interface TransactionDetail {
  id: string;
  reference: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: string;
  activeDisputeId: string | null;
  createdAt: string;
  lockedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  releasedAt: string | null;
  disputedAt: string | null;
  refundedAt: string | null;
}

export interface ScanResponse {
  status: string;
  transactionId: string;
  message: string;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type MovementType =
  | 'ESCROW_FREEZE'   | 'ESCROW_UNFREEZE'  | 'ESCROW_CREDIT'
  | 'REFUND_UNFREEZE' | 'REFUND_CREDIT'
  | 'DISPUTE_FREEZE'  | 'DISPUTE_REFUND_BUYER' | 'DISPUTE_RELEASE_SELLER'
  | 'DISPUTE_SPLIT_BUYER' | 'DISPUTE_SPLIT_SELLER'
  | 'PAYOUT_DEBIT'    | 'PAYOUT_REVERSAL'
  | 'DEPOSIT_CREDIT'  | 'PLATFORM_FEE_CREDIT'
  | 'FEE_DEBIT'       | 'FEE_CREDIT'
  | 'ADMIN_CREDIT'    | 'ADMIN_DEBIT';

export interface WalletBalance {
  balance: number;
  frozenAmount: number;
  currency: string;
}

export interface WalletMovement {
  id: string;
  type: MovementType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  frozenBefore: number;
  frozenAfter: number;
  reference: string;
  description: string;
  createdAt: string;
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export type DisputeReason =
  | 'NOT_RECEIVED' | 'LATE_DELIVERY' | 'WRONG_ADDRESS' | 'PARTIAL_DELIVERY'
  | 'NOT_AS_DESCRIBED' | 'DEFECTIVE' | 'COUNTERFEIT' | 'WRONG_ITEM' | 'QUALITY_ISSUE'
  | 'SERVICE_NOT_RENDERED' | 'SERVICE_INCOMPLETE' | 'SERVICE_UNSATISFACTORY'
  | 'SELLER_UNRESPONSIVE' | 'BUYER_UNRESPONSIVE'
  | 'OVERCHARGED' | 'HIDDEN_FEES'
  | 'SUSPECTED_FRAUD' | 'UNAUTHORIZED_TRANSACTION'
  | 'OTHER';

export type EvidenceType = 'SCREENSHOT' | 'IMAGE' | 'DOCUMENT' | 'RECEIPT' | 'VIDEO' | 'OTHER';

export type ResolutionType =
  | 'FULL_REFUND_BUYER'
  | 'RELEASE_TO_SELLER'
  | 'PARTIAL_REFUND_BUYER'
  | 'SPLIT_50_50'
  | 'NO_ACTION';

export interface DisputeSummary {
  id: string;
  transactionRef: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface DisputeDetail {
  id: string;
  reference: string;
  transactionRef: string;
  transactionId: string;
  initiatorId: string;
  respondentId: string;
  reason: DisputeReason;
  status: string;
  description?: string;
  claimedAmount?: number;
  resolutionType?: ResolutionType;
  createdAt: string;
  buyerName: string;
  sellerName: string;
  grossAmount: number;
  currency: string;
  messages: DisputeMessage[];
  evidences?: DisputeEvidence[];
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  messageType: string;
  internalOnly: boolean;
  attachmentCount: number;
  attachmentIds: string;
  createdAt: string;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: string;
  evidenceType: EvidenceType;
  originalFileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  description?: string;
  verified: boolean;
  verifiedAt?: string;
  rejected: boolean;
  rejectionReason?: string;
  createdAt: string;
}

export interface CreateDisputeRequest {
  transactionId: string;
  initiatorId: string;
  initiatorRole: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPPORT' | 'SUPERVISOR';
  reason: DisputeReason;
  description: string;
  claimedAmount?: number;
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export interface PayoutRequest {
  amount: number;
  provider: 'CAMPAY' | 'MONETBIL';
  phone: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardTransaction {
  id: string;
  reference: string;
  counterpartName: string;
  amount: number;
  status: string;
  createdAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface NavItem {
  key: string;
  route: string;
}

export interface SidebarItem {
  key: string;
  route: string;
  roles?: string[];
}

export interface FabConfig {
  labelKey: string;
  icon: 'plus' | 'flag';
  action: 'escrow' | 'dispute';
}

export interface StatusConfig {
  bg: string;
  color: string;
  dot: string;
}

export interface ProfileMenuItem {
  icon: string;
  label: string;
  sub?: string;
  route: string;
  danger?: boolean;
}
