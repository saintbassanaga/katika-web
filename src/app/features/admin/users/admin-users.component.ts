import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { UserAdminResponse } from '@shared/models/model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { ToastService } from '@core/notification/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { AdminCreateStaffComponent } from '../staff/admin-create-staff.component';
import { TuiIcon } from '@taiga-ui/core';

const ROLE_FILTERS = [
  { value: '',           labelKey: 'admin.users.filters.all' },
  { value: 'BUYER',      labelKey: 'admin.users.filters.buyers' },
  { value: 'SELLER',     labelKey: 'admin.users.filters.sellers' },
  { value: 'BOTH',       labelKey: 'admin.users.filters.both' },
  { value: 'SUPPORT',    labelKey: 'admin.users.filters.support' },
  { value: 'SUPERVISOR', labelKey: 'admin.users.filters.supervisors' },
];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [RouterLink, TimeAgoPipe, TranslatePipe, AdminCreateStaffComponent, TuiIcon],
  styles: [':host { display: block; height: 100%; overflow-y: auto; }'],
  template: `
    <div class="animate-fade flex flex-col min-h-full bg-page">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-dark shadow-[0_2px_12px_rgba(15,23,42,.25)] px-4 md:px-8 py-3 flex items-center gap-3">
        <a routerLink="/admin/dashboard"
           class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 no-underline shrink-0 transition-colors hover:bg-white/20">
          <tui-icon icon="@tui.arrow-left" class="w-5 h-5" />
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-bold text-white m-0">{{ 'admin.users.title' | translate }}</h1>
          @if (!loading()) {
            <p class="text-xs text-white/50 m-0">{{ totalElements() }} {{ 'admin.users.totalSuffix' | translate }}</p>
          }
        </div>
        <button (click)="showCreateModal.set(true)"
          class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity">
          <tui-icon icon="@tui.plus" class="w-4 h-4" />
          {{ 'admin.staff.newButton' | translate }}
        </button>
      </div>

      <!-- Filter chips -->
      <div class="px-4 md:px-8 pt-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
        @for (f of roleFilters; track f.value) {
          <button
            (click)="setRoleFilter(f.value)"
            class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all whitespace-nowrap"
            [class]="activeRole() === f.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'"
          >{{ f.labelKey | translate }}</button>
        }
      </div>

      <!-- Content -->
      <div class="flex-1 px-4 md:px-8 py-3 pb-24 md:pb-8 max-w-4xl mx-auto w-full">

        @if (loading()) {
          <div class="flex flex-col gap-2">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div class="skeleton-shimmer w-10 h-10 rounded-full shrink-0"></div>
                <div class="flex-1 space-y-1.5">
                  <div class="skeleton-shimmer h-3 w-1/3 rounded"></div>
                  <div class="skeleton-shimmer h-2.5 w-1/4 rounded"></div>
                </div>
                <div class="skeleton-shimmer h-6 w-16 rounded-full"></div>
              </div>
            }
          </div>
        } @else if (users().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><tui-icon icon="@tui.users" class="w-8 h-8" /></div>
            <p class="text-base font-bold text-slate-900 m-0 mb-1">{{ 'admin.users.empty' | translate }}</p>
          </div>
        } @else {
          <div class="flex flex-col gap-2">
            @for (u of users(); track u.id) {
              <div class="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 shadow-[0_1px_4px_rgba(15,23,42,.06)]">
                <!-- Avatar -->
                <div class="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
                     [class]="u.active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'">
                  {{ u.fullName[0] }}
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-sm font-bold text-slate-900 m-0 truncate">{{ u.fullName }}</p>
                    @if (u.verified) {
                      <span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-success bg-success-lt px-1.5 py-0.5 rounded-full"><tui-icon icon="@tui.check" class="w-2.5 h-2.5" /> {{ 'admin.users.verified' | translate }}</span>
                    }
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{{ u.role }}</span>
                    <span class="text-slate-300">·</span>
                    <span class="text-[11px] text-slate-400">{{ u.createdAt | timeAgo }}</span>
                    @if (u.lastLoginAt) {
                      <span class="text-slate-300">·</span>
                      <span class="text-[11px] text-slate-400">{{ 'admin.users.lastLogin' | translate }} {{ u.lastLoginAt | timeAgo }}</span>
                    }
                  </div>
                </div>

                <!-- Status + action -->
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[11px] font-semibold px-2 py-1 rounded-full"
                        [class]="u.active ? 'bg-success-lt text-success' : 'bg-slate-100 text-slate-500'">
                    {{ u.active ? ('admin.users.active' | translate) : ('admin.users.inactive' | translate) }}
                  </span>
                  <button
                    (click)="toggleUser(u)"
                    [disabled]="actionId() === u.id"
                    class="w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all disabled:opacity-40"
                    [class]="u.active
                      ? 'border-red-200 text-red-400 hover:bg-red-50'
                      : 'border-success/30 text-success hover:bg-success-lt'"
                    [title]="u.active ? ('admin.users.deactivate' | translate) : ('admin.users.activate' | translate)"
                  >
                    @if (actionId() === u.id) {
                      <tui-icon icon="@tui.loader-circle" class="w-4 h-4 animate-spin" />
                    } @else if (u.active) {
                      <tui-icon icon="@tui.x" class="w-4 h-4" />
                    } @else {
                      <tui-icon icon="@tui.check" class="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            }

            @if (hasMore()) {
              <button
                (click)="loadMore()"
                [disabled]="loadingMore()"
                class="w-full py-3 mt-1 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors bg-white"
              >
                @if (loadingMore()) { {{ 'common.loading' | translate }} } @else { {{ 'common.loadMore' | translate }} }
              </button>
            }
          </div>
        }
      </div>
    </div>

    @if (showCreateModal()) {
      <app-admin-create-staff
        (created)="onStaffCreated($event)"
        (cancel)="showCreateModal.set(false)"
      />
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast        = inject(ToastService);
  private readonly translate    = inject(TranslateService);

  protected readonly users          = signal<UserAdminResponse[]>([]);
  protected readonly loading        = signal(true);
  protected readonly loadingMore    = signal(false);
  protected readonly hasMore        = signal(false);
  protected readonly totalElements  = signal(0);
  protected readonly activeRole     = signal('');
  protected readonly actionId       = signal<string | null>(null);
  protected readonly showCreateModal = signal(false);

  protected readonly roleFilters = ROLE_FILTERS;

  private page = 0;

  ngOnInit(): void { this.load(); }

  protected setRoleFilter(role: string): void {
    this.activeRole.set(role);
    this.page = 0;
    this.users.set([]);
    this.load();
  }

  protected loadMore(): void {
    this.page++;
    this.loadingMore.set(true);
    this.fetch(false);
  }

  private load(): void {
    this.loading.set(true);
    this.fetch(true);
  }

  private fetch(reset: boolean): void {
    this.adminService.getUsers({
      role: this.activeRole() || undefined,
      page: this.page,
      size: 20,
    }).subscribe({
      next: (data) => {
        this.users.update(u => reset ? data.content : [...u, ...data.content]);
        this.totalElements.set(data.totalElements ?? data.content.length);
        this.hasMore.set(this.page < data.totalPages - 1);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  protected onStaffCreated(user: UserAdminResponse): void {
    this.showCreateModal.set(false);
    this.users.update(list => [user, ...list]);
    this.totalElements.update(n => n + 1);
  }

  protected toggleUser(user: UserAdminResponse): void {
    if (this.actionId()) return;
    this.actionId.set(user.id);
    const call$ = user.active
      ? this.adminService.deactivateUser(user.id)
      : this.adminService.activateUser(user.id);

    call$.subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.actionId.set(null);
        const key = user.active ? 'admin.users.deactivatedToast' : 'admin.users.activatedToast';
        this.toast.success(this.translate.instant(key, { name: user.fullName }));
      },
      error: () => this.actionId.set(null),
    });
  }
}
