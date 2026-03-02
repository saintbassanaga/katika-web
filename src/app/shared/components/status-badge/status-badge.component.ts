import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusConfig } from '@app/models';

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Escrow statuses
  INITIATED:   { bg: '#EDF1F7', color: '#475569', dot: '#94A3B8' },
  LOCKED:      { bg: '#E5EEF8', color: '#154B85', dot: '#3A7BC8' },
  SHIPPED:     { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  DELIVERED:   { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  RELEASED:    { bg: '#F0FDFA', color: '#0F766E', dot: '#14B8A6' },
  DISPUTED:    { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  REFUNDED:    { bg: '#FDF4FF', color: '#6B21A8', dot: '#A855F7' },
  CANCELLED:   { bg: '#F8FAFC', color: '#64748B', dot: '#CBD5E1' },
  // Dispute statuses
  OPEN:        { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  OPENED:      { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  UNDER_REVIEW:{ bg: '#EEF2FF', color: '#3730A3', dot: '#6366F1' },
  AWAITING_BUYER:   { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  AWAITING_SELLER:  { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  AWAITING_ARBITRATION_PAYMENT: { bg: '#FFF7ED', color: '#9A3412', dot: '#F97316' },
  REFERRED_TO_ARBITRATION:      { bg: '#F5F3FF', color: '#5B21B6', dot: '#8B5CF6' },
  RESOLVED_BUYER:  { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  RESOLVED_SELLER: { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  RESOLVED_SPLIT:  { bg: '#F0FDFA', color: '#0F766E', dot: '#14B8A6' },
  CLOSED_NO_ACTION:{ bg: '#F8FAFC', color: '#64748B', dot: '#CBD5E1' },
  IN_PROGRESS: { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  RESOLVED:    { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  // Generic
  PROCESSING:  { bg: '#E5EEF8', color: '#154B85', dot: '#3A7BC8' },
  COMPLETED:   { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  FAILED:      { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  EXPIRED:     { bg: '#F5F5F4', color: '#57534E', dot: '#A8A29E' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [TranslatePipe],
  styles: [`
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 9px 3px 7px;
      border-radius: 999px;
      font-size: .6875rem; font-weight: 600; letter-spacing: .01em;
      white-space: nowrap;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  `],
  template: `
    <span class="badge"
          [style.background]="cfg().bg"
          [style.color]="cfg().color">
      <span class="dot" [style.background]="cfg().dot"></span>
      {{ 'status.' + status() | translate }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  protected cfg() {
    return STATUS_CONFIG[this.status()] ?? { label: this.status(), bg: '#EDF1F7', color: '#475569', dot: '#94A3B8' };
  }
}
