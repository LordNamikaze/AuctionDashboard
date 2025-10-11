import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigLoaderService } from './config-loader-service';
import { Observable } from 'rxjs';
import { Player } from '../models/Player';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  constructor(private http: HttpClient, private config: ConfigLoaderService) {}

  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.config.apiBaseUrl}/players`);
  }

  sellPlayer(payload: { PlayerID: any; SoldPrice: number; TeamAssigned: string }) {
    return this.http.post(`${this.config.apiBaseUrl}/players/sell`, payload);
  }
}
