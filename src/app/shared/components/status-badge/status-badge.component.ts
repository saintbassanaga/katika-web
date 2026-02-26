import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

interface StatusConfig { label: string; bg: string; color: string; dot: string; }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  INITIATED:   { label: 'Initié',        bg: '#EDF1F7', color: '#475569', dot: '#94A3B8' },
  LOCKED:      { label: 'Bloqué',        bg: '#E5EEF8', color: '#154B85', dot: '#3A7BC8' },
  SHIPPED:     { label: 'Expédié',       bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  DELIVERED:   { label: 'Livré',         bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  RELEASED:    { label: 'Libéré',        bg: '#F0FDFA', color: '#0F766E', dot: '#14B8A6' },
  DISPUTED:    { label: 'Litigieux',     bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  REFUNDED:    { label: 'Remboursé',     bg: '#FDF4FF', color: '#6B21A8', dot: '#A855F7' },
  CANCELLED:   { label: 'Annulé',        bg: '#F8FAFC', color: '#64748B', dot: '#CBD5E1' },
  OPEN:        { label: 'Ouvert',        bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  OPENED:      { label: 'Ouvert',        bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  IN_PROGRESS: { label: 'En cours',      bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  RESOLVED:    { label: 'Résolu',        bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  PROCESSING:  { label: 'En traitement', bg: '#E5EEF8', color: '#154B85', dot: '#3A7BC8' },
  COMPLETED:   { label: 'Complété',      bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  FAILED:      { label: 'Échoué',        bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
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
