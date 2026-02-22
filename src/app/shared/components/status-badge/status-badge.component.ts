import { Component, input } from '@angular/core';

export type TransactionStatus =
  | 'INITIATED' | 'LOCKED' | 'SHIPPED' | 'DELIVERED'
  | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'CANCELLED';

interface StatusConfig {
  label: string;
  classes: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  INITIATED:  { label: 'Initié',      classes: 'bg-gray-100 text-gray-700'    },
  LOCKED:     { label: 'Bloqué',      classes: 'bg-blue-100 text-blue-700'    },
  SHIPPED:    { label: 'Expédié',     classes: 'bg-yellow-100 text-yellow-700' },
  DELIVERED:  { label: 'Livré',       classes: 'bg-green-100 text-green-700'  },
  RELEASED:   { label: 'Libéré',      classes: 'bg-teal-100 text-teal-700'    },
  DISPUTED:   { label: 'Litigieux',   classes: 'bg-red-100 text-red-700'      },
  REFUNDED:   { label: 'Remboursé',   classes: 'bg-purple-100 text-purple-700' },
  CANCELLED:  { label: 'Annulé',      classes: 'bg-gray-100 text-gray-500'    },
  OPEN:       { label: 'Ouvert',      classes: 'bg-red-100 text-red-700'      },
  IN_PROGRESS:{ label: 'En cours',    classes: 'bg-yellow-100 text-yellow-700' },
  RESOLVED:   { label: 'Résolu',      classes: 'bg-green-100 text-green-700'  },
  PROCESSING: { label: 'En traitement', classes: 'bg-blue-100 text-blue-700'  },
  COMPLETED:  { label: 'Complété',    classes: 'bg-green-100 text-green-700'  },
  FAILED:     { label: 'Échoué',      classes: 'bg-red-100 text-red-700'      },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      [class]="badgeClasses()"
    >
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();

  protected badgeClasses() {
    return STATUS_CONFIG[this.status()]?.classes ?? 'bg-gray-100 text-gray-700';
  }

  protected label() {
    return STATUS_CONFIG[this.status()]?.label ?? this.status();
  }
}
