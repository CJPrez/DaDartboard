import { PhaseMap } from "boardgame.io";
import { INVALID_MOVE, TurnOrder } from "boardgame.io/core";
import {
  CreateSegment,
  Segment,
  SegmentID,
} from "../../Utillities/DartboardUtilities";
import { DartsGameState } from "../DartsGame";
import {
  commonDartHit,
  commonTurnEnd,
  DartsGamePhases,
  DartsGameTypes,
} from "../Utilities/DartsGameUtilities";
import { PlaySound, Sound } from "../Utilities/SoundBoard";

export interface Standard01PlayerData {
  score: number;
}

export interface Standard01PhaseData {
  playerData: Record<string, Standard01PlayerData>;
}

export const standard01Phase: PhaseMap<DartsGameState> = {
  [DartsGameTypes.Standard01]: {
    turn: {
      order: {
        ...TurnOrder.RESET,
        first: (context) => context.G.startingPlayerIndex,
        playOrder: (context) => context.G.playOrder,
      },
      onEnd: commonTurnEnd,
    },
    next: DartsGamePhases.GameOver,
    onBegin: (state) => {
      state.G.gamePhase = DartsGamePhases.InGame;
      state.G.gameType = DartsGameTypes.Standard01;
      const playerData: Record<string, Standard01PlayerData> = {};
      state.G.playOrder.forEach((playerID) => {
        playerData[playerID] = {
          score: state.G.gameConfig.standard01Score,
        };
      });

      state.G.phaseData = { playerData };
    },
    moves: {
      dartHit: {
        move: (state, segment: Segment) => {
          if (
            state.G.gameType !== DartsGameTypes.Standard01 ||
            !state.G.phaseData
          ) {
            // We shouldn't get into this state as the phaseData should be initialized in the phase onBegin
            console.error("phaseData is empty for this player");
            PlaySound(Sound.DartHitError);
            return INVALID_MOVE;
          }

          // Limit dart throws to 3 per move
          if ((state.ctx.numMoves ?? 0) > 2) {
            PlaySound(Sound.DartHitError);
            return INVALID_MOVE;
          }

          // Check that the segment is not a special segment above 25 (such as the reset button)
          if (segment.Section > 25) {
            return undefined;
          }

          const playerState =
            state.G.phaseData.playerData[state.ctx.currentPlayer];
          const commonPlayerState =
            state.G.commonPlayerData[state.ctx.currentPlayer];

          // Check if the player isn't out of turns, but is out of throws due to a bust
          if (commonPlayerState.dartThrows[0].length >= 3) {
            PlaySound(Sound.DartHitError);
            return undefined;
          }

          commonDartHit(state, segment);

          const newScore = playerState.score - segment.Value;

          if (newScore >= 0) {
            // Only count the hit if it does not bring the new score below zero
            playerState.score = newScore;

            // Check if they've won
            if (newScore === 0) {
              state.G.winner = state.ctx.currentPlayer;
              state.events.endPhase();
            }
          } else {
            // Revert previously counted throws due to the bust (ignore the current throw as it wasn't counted)
            for (
              let i = 0;
              i < commonPlayerState.dartThrows[0].length - 1;
              i++
            ) {
              playerState.score += commonPlayerState.dartThrows[0][i].Value;
            }

            // The player has busted. Add misses for any remaining throws and
            // reset points to the beginning of the leg
            for (let i = commonPlayerState.dartThrows[0].length; i < 3; i++) {
              commonPlayerState.dartThrows[0].push(
                CreateSegment(SegmentID.BUST)
              );
            }
          }
        },
        undoable: true,
      },
    },
  },
};
