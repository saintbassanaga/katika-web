import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export abstract class ApiService {
  protected readonly http = inject(HttpClient);
  protected readonly base = environment.apiUrl;

  protected url(path: string): string {
    return `${this.base}${path}`;
  }

  protected get defaultOptions() {
    return { withCredentials: true };
  }
}
