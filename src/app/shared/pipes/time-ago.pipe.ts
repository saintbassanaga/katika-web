import { inject, Pipe, PipeTransform } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

@Pipe({ name: 'timeAgo', standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  private readonly lang = toSignal(
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.translate.currentLang),
    ),
  );

  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    return dayjs(value).locale(this.lang() ?? 'fr').fromNow();
  }
}
