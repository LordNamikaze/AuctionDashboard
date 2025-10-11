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
  private primaryFilter$ = new BehaviorSubject<string>('All');
  private secondaryFilter$ = new BehaviorSubject<string>('All');

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

  /** Filtered players according to dropdowns */
  private getFilteredPlayers(): Player[] {
    const primary = this.primaryFilter$.value;
    const secondary = this.secondaryFilter$.value;

    return this.players$.value.filter(p => {
      const primaryMatch = primary === 'All' || p.PrimaryPosition === primary;
      const secondaryMatch = secondary === 'All' || p.SecondaryPosition === secondary;

      if (primary === 'All' && secondary === 'All') return true;
      if (primary === 'All') return secondaryMatch;
      if (secondary === 'All') return primaryMatch;
      return primaryMatch && secondaryMatch;
    });
  }

  /** Current player observable */
  get currentPlayer$() {
    return combineLatest([this.players$, this.currentIndex$, this.primaryFilter$, this.secondaryFilter$]).pipe(
      map(() => {
        const filtered = this.getFilteredPlayers();
        const idx = this.currentIndex$.value;
        const current = filtered[idx];
        
        // If current index doesn't have a valid player, reset to first filtered player
        if (!current && filtered.length > 0) {
          this.currentIndex$.next(0);
          return filtered[0];
        }
        return current || null;
      })
    );
  }

  /** Upcoming players observable (after current) */
  get upcomingPlayers$() {
    return combineLatest([this.players$, this.currentIndex$, this.primaryFilter$, this.secondaryFilter$]).pipe(
      map(() => {
        const filtered = this.getFilteredPlayers();
        const idx = this.currentIndex$.value;
        return filtered.slice(idx + 1); // all players after current
      })
    );
  }

  nextPlayer() {
    const idx = this.currentIndex$.value;
    const filteredLength = this.getFilteredPlayers().length;
    if (idx < filteredLength - 1) this.currentIndex$.next(idx + 1);
  }

  previousPlayer() {
    const idx = this.currentIndex$.value;
    if (idx > 0) this.currentIndex$.next(idx - 1);
  }

  setPrimaryFilter(position: string) {
    this.primaryFilter$.next(position);
    this.currentIndex$.next(0);
  }

  setSecondaryFilter(position: string) {
    this.secondaryFilter$.next(position);
    this.currentIndex$.next(0);
  }
    
  /** Submit sale */
  sellPlayer(PlayerID: any, SoldPrice: number, TeamAssigned: string) {
    return this.playerService.sellPlayer({ PlayerID, SoldPrice, TeamAssigned });
  }
  
getPlayerImage(player: Player): string {
  if (!player) return 'assets/FallBack_KuchNahi.jpg';
  const assetsBase = 'assets/';
  // Try both jpg and jpeg extensions
  return `${assetsBase}${player.PlayerID}_Image.jpg`;
  // Note: The error handler in the template will automatically try the jpeg extension if jpg fails
}

  
  
  /** Filter players by position */
  getPlayersByGroup(position: string) {
    return this.players$.value.filter(
      p => p.PrimaryPosition === position || p.SecondaryPosition === position
    );
  }
}