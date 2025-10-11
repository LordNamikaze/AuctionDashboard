import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigLoaderService {
  private config: any;

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    this.config = await firstValueFrom(this.http.get('/assets/config.json'));
  }

  get apiBaseUrl(): string {
    return this.config?.apiBaseUrl || '';
  }
}
