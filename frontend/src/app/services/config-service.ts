import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ConfigLoaderService } from './config-loader-service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  constructor(private http: HttpClient, private config: ConfigLoaderService) {}

  getTeams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.apiBaseUrl}/config/teams`);
  }

getBudget(): Observable<{ VirtualBudget: number }> {
  return this.http.get<{ VirtualBudget: number }>(`${this.config.apiBaseUrl}/config/budget`);
}

  /** Fetch positions dynamically */
  getPositions(): Observable<string[]> {
    return this.http.get<{ positions: string[] }>(`${this.config.apiBaseUrl}/config/positions`).pipe(
      map(res => [...res.positions])
    );
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.config.apiBaseUrl}/config/users`);
  }
}