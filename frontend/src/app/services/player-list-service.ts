import { Injectable } from '@angular/core';
import { PlayerService } from './player-service';
import { ConfigService } from './config-service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Player } from '../models/Player';

@Injectable({
  providedIn: 'root'
})
export class PlayerListService {
  constructor(
    private playerService: PlayerService,
    private configService: ConfigService
  ) {}

  /** Load all players + team config + budget data together */
  loadFullData(): Observable<any> {
    return combineLatest([
      this.playerService.getPlayers(),
      this.configService.getTeams(),
      this.configService.getBudget()
    ]).pipe(
      map(([players, teams, budget]) => {
        const virtualBudget = budget?.VirtualBudget || 0;
        const summary = this.computeTeamSummary(players, teams, virtualBudget);
        return { players, teams, budget: virtualBudget, summary };
      })
    );
  }

  /** Compute team composition and remaining budget */
  private computeTeamSummary(players: Player[], teams: any[], budgetPerCaptain: number) {
    return teams.map(team => {
      const teamPlayers = players.filter(p => p.TeamAssigned === team.TeamName);
      const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.SoldPrice || 0), 0);
      const remaining = budgetPerCaptain - totalSpent;
      return {
        TeamName: team.TeamName,
        TotalPlayers: teamPlayers.length,
        TotalSpent: totalSpent,
        RemainingBudget: remaining,
        Players: teamPlayers
      };
    });
  }
}