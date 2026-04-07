// ── Auth ─────────────────────────────────────────────────────

export interface UserProfile {
  userId: string;
  fullName: string;
  role?: 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN' | 'SUPPORT' | 'SUPERVISOR';
  email?: string;
  mfaEnabled: boolean;
  verified?: boolean;
  cniNumber?: string;
  issuedAt: string;
  expiresAt: string;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  emailVerified: boolean;
  cniProvided: boolean;
  role: 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN' | 'SUPPORT' | 'SUPERVISOR';
  verified: boolean;
  mfaEnabled: boolean;
  addressStreet: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressCountry: string | null;
  addressPostalCode: string | null;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
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
  role: 'BUYER' | 'SELLER';
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
  fullName?: string;
  email?: string;
  cniNumber?: string;
  addressStreet?: string;
  addressCity?: string;
  addressRegion?: string;
  addressCountry?: string;
  addressPostalCode?: string;
}

export interface MfaSetupResponse {
  secretKey: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  message: string;
}

export interface AuthState {
  user: UserProfile | null;
  storedRole: string | null;
  mfaRequired: boolean;
  challengeId: string | null;
  loading: boolean;
  initialized: boolean;
}

// ── Verification ──────────────────────────────────────────────

export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface VerificationRequestResponse {
  id: string;
  userId: string;
  status: VerificationStatus;
  notes: string | null;
  rejectionReason: string | null;
  bill1Uploaded: boolean;
  bill2Uploaded: boolean;
  reviewedBy: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

// ── Notification ─────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// ── App Notifications ─────────────────────────────────────────

export type NotificationType =
  | 'ESCROW_LOCKED' | 'ESCROW_SHIPPED' | 'ESCROW_DELIVERED'
  | 'ESCROW_RELEASED' | 'ESCROW_DISPUTED' | 'ESCROW_CANCELLED' | 'ESCROW_REFUNDED'
  | 'PAYOUT_COMPLETED' | 'PAYOUT_FAILED'
  | 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED';

export interface AppNotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entityId: string | null;
  entityReference: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

// ── Platform ─────────────────────────────────────────────────

export type AppPlatform = 'web' | 'tauri' | 'android' | 'ios';

export interface TauriPlatformInfo {
  os: 'linux' | 'windows' | 'macos' | 'android' | 'ios';
  arch: string;
  version: string;
  is_mobile: boolean;
  is_desktop: boolean;
}

// ── WebSocket ─────────────────────────────────────────────────

export interface StompMessage<T = unknown> {
  destination: string;
  body: T;
}

// ── Escrow / Transactions ─────────────────────────────────────

export interface TransactionSummary {
  id: string;
  reference: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  grossAmount: number;
  platformFee: number | null;
  netAmount: number | null;
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
  platformFee: number | null;
  netAmount: number | null;
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

export interface EscrowCreateRequest {
  buyerPhone: string;
  grossAmount: number;
  description?: string;
  deliveryDeadline?: string; // ISO 8601
  idempotencyKey?: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ── Disputes ─────────────────────────────────────────────────

export type DisputeStatus =
  | 'OPENED' | 'UNDER_REVIEW' | 'AWAITING_BUYER' | 'AWAITING_SELLER'
  | 'AWAITING_ARBITRATION_PAYMENT' | 'REFERRED_TO_ARBITRATION'
  | 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'RESOLVED_SPLIT'
  | 'CLOSED_NO_ACTION' | 'CANCELLED';

export type DisputeReason =
  | 'NOT_RECEIVED' | 'LATE_DELIVERY' | 'WRONG_ADDRESS' | 'PARTIAL_DELIVERY'
  | 'NOT_AS_DESCRIBED' | 'DEFECTIVE' | 'COUNTERFEIT' | 'WRONG_ITEM' | 'QUALITY_ISSUE'
  | 'SERVICE_NOT_RENDERED' | 'SERVICE_INCOMPLETE' | 'SERVICE_UNSATISFACTORY'
  | 'SELLER_UNRESPONSIVE' | 'BUYER_UNRESPONSIVE'
  | 'OVERCHARGED' | 'HIDDEN_FEES'
  | 'SUSPECTED_FRAUD' | 'UNAUTHORIZED_TRANSACTION'
  | 'OTHER';

export type ResolutionType =
  | 'FULL_REFUND_BUYER' | 'PARTIAL_REFUND_BUYER' | 'RELEASE_TO_SELLER'
  | 'SPLIT_50_50' | 'CUSTOM_RATIO' | 'NO_ACTION';

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
  attachmentIds: string | null;
  createdAt: string;
}

export interface DisputeResponse {
  id: string;
  reference: string;
  transactionId: string;
  transactionRef: string;
  initiatorId: string;
  initiatorRole: 'BUYER' | 'SELLER';
  reason: DisputeReason;
  description: string;
  claimedAmount: number;
  status: DisputeStatus;
  resolutionType: ResolutionType | null;
  refundedToBuyer: number | null;
  releasedToSeller: number | null;
  arbitrationFee: number | null;
  submissionDeadline: string | null; // ISO-8601
  buyerArbitrationFeePaid: boolean;
  sellerArbitrationFeePaid: boolean;
  buyerName: string | null;
  sellerName: string | null;
  grossAmount: number | null;
  currency: string | null;
  createdAt: string;
  resolvedAt: string | null;
  messages: DisputeMessage[];
}

export interface CreateDisputeRequest {
  transactionId: string;
  initiatorId: string;
  initiatorRole: 'BUYER' | 'SELLER';
  reason: DisputeReason;
  description: string;
  claimedAmount?: number;
}

export interface ResolveDisputeRequest {
  resolutionType: ResolutionType;
  actorType?: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPERVISOR' | 'SUPPORT';
  actorId?: string;
  sellerPercent?: number;
}

export interface DisputeStatusEvent {
  type: 'DISPUTE_STATUS_CHANGED' | 'REFERRED_TO_ARBITRATION' | 'DISPUTE_RESOLVED' | 'NEW_MESSAGE' | 'NEW_EVIDENCE';
  disputeId: string;
  disputeReference: string;
  message: string;
  timestamp: string;
}


export interface ReasonGroup {
  groupKey: string;
  reasons: { value: DisputeReason; labelKey: string; icon: string }[];
}

export interface TimelineStep {
  key: string;
  labelKey: string;
  state: 'completed' | 'current' | 'pending';
}

// ── Payouts ──────────────────────────────────────────────────

export type PayoutStatus =
  | 'PENDING' | 'OTP_SENT' | 'MFA_PENDING' | 'OTP_VALIDATED' | 'PROCESSING'
  | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface PayoutRequest {
  destinationPhone: string;
  amount: number;
  userId?: string;
}

export interface PayoutRequestResponse {
  id: string;
  reference: string;
  userId: string;
  destinationPhone: string;
  operator: string;
  amount: string;
  platformFee: string;
  providerFee: string;
  fee: string;
  netAmount: string;
  actualProviderFee: string | null;
  currency: string;
  status: PayoutStatus;
  failureReason: string | null;
  createdAt: string;
  otpSentAt: string | null;
  otpValidatedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
}

// ── Wallet ───────────────────────────────────────────────────

export type TransactionStatus =
  | 'INITIATED' | 'LOCKED' | 'SHIPPED' | 'DELIVERED' | 'RELEASED'
  | 'DISPUTED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';

export type MovementType =
  | 'ESCROW_FREEZE' | 'ESCROW_UNFREEZE' | 'ESCROW_CREDIT'
  | 'REFUND_UNFREEZE' | 'REFUND_CREDIT'
  | 'DISPUTE_FREEZE' | 'DISPUTE_REFUND_BUYER' | 'DISPUTE_RELEASE_SELLER'
  | 'DISPUTE_SPLIT_BUYER' | 'DISPUTE_SPLIT_SELLER'
  | 'PAYOUT_DEBIT' | 'PAYOUT_REVERSAL' | 'PAYOUT_FAILED_REFUND'
  | 'DEPOSIT_CREDIT' | 'PLATFORM_FEE_CREDIT';

export interface WalletBalance {
  id: string;
  userId: string;
  balance: number;
  frozenAmount: number;
  totalAmount: number;
  currency: string;
  updatedAt: string;
}

export interface WalletMovement {
  id: string;
  movementType: MovementType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  frozenBefore: number;
  frozenAfter: number;
  relatedTransactionId: string | null;
  relatedTransactionType: string | null;
  description: string;
  createdAt: string;
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardTransactionSummary {
  id: string;
  reference: string;
  buyerName: string;
  netAmount: number | null;
  status: string;
  createdAt: string;
}

export interface DisputeSummary {
  id: string;
  transactionRef: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface WalletInfo {
  amount: number;
  frozen: number;
  currency: string;
}

// ── Admin ─────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalStaff: number;
  totalTransactions: number;
  initiatedTransactions: number;
  lockedTransactions: number;
  releasedTransactions: number;
  disputedTransactions: number;
  cancelledTransactions: number;
  totalVolumeReleased: string;
  totalDisputes: number;
  openDisputes: number;
  underReviewDisputes: number;
  referredToArbitrationDisputes: number;
  resolvedDisputes: number;
}

export interface UserAdminResponse {
  id: string;
  fullName: string;
  role: 'BUYER' | 'SELLER' | 'BOTH' | 'SUPPORT' | 'SUPERVISOR' | 'ADMIN';
  verified: boolean;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface CreateStaffRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  role: 'SUPPORT' | 'SUPERVISOR';
  password: string;
}

export interface AssignDisputeRequest {
  agentId: string;
}

export interface UpdateDisputeStatusRequest {
  status: 'AWAITING_BUYER' | 'AWAITING_SELLER';
  note?: string;
}

// ── UI / Shared ───────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface FabConfig {
  labelKey: string;
  action: 'escrow';
}

export interface StatusConfig {
  bg: string;
  color: string;
  dot: string;
}

export interface NavItem {
  key: string;
  route: string;
}

export interface SidebarItem {
  key: string;
  route: string;
  roles?: string[];
}

export interface MenuItem {
  icon: string;
  label: string;
  sub?: string;
  route: string;
  danger?: boolean;
}
