import { Injectable } from '@angular/core';
import { PlayerService } from './player-service';
import { ConfigService } from './config-service';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Player } from '../models/Player';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private players$ = new BehaviorSubject<Player[]>([]);
  private currentIndex$ = new BehaviorSubject<number>(0);

constructor(
    private playerService: PlayerService,
    private configService: ConfigService
  ) {}

  /** Load initial player + config data */
  loadInitialData() {
    return combineLatest([
      this.playerService.getPlayers(),
      this.configService.getTeams(),
      this.configService.getBudget()
    ]).pipe(
      map(([players, teams, budget]) => {
        this.players$.next(players);
        return { players, teams, budget };
      })
    );
  }

  /** Get current player observable */
  get currentPlayer$() {
    return combineLatest([this.players$, this.currentIndex$]).pipe(
      map(([players, idx]) => players[idx] || null)
    );
  }

  /** Navigate players */
  nextPlayer() {
    const idx = this.currentIndex$.value;
    const players = this.players$.value;
    if (idx < players.length - 1) this.currentIndex$.next(idx + 1);
  }

  previousPlayer() {
    const idx = this.currentIndex$.value;
    if (idx > 0) this.currentIndex$.next(idx - 1);
  }

  /** Submit sale */
  sellPlayer(PlayerID: any, SoldPrice: number, TeamAssigned: string) {
    return this.playerService.sellPlayer({ PlayerID, SoldPrice, TeamAssigned });
  }

  /** Filter players by position */
  getPlayersByGroup(position: string) {
    return this.players$.value.filter(
      p => p.PrimaryPosition === position || p.SecondaryPosition === position
    );
  }
}