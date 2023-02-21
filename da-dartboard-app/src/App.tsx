import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { Segment } from './Utillities/DartboardUtilities';
import { Client } from 'boardgame.io/react'
import { generateCredentials, P2P } from '@boardgame.io/p2p'
import { Configurator } from './Components/Configurator';
import { Granboard } from './Utillities/Granboard';
import { Dartboard } from './Boards/Dartboard';
import { CricketGame } from './Games/Cricket';

const uuid = () => Math.round(Math.random() * 1e16).toString(32);

const View = () => {
  const [matchID, setMatchID] = useState(() => uuid());
  const [isHost, setIsHost] = useState(false);
  const [showClient, setShowClient] = useState(false);
  const [GameView, setGameView] = useState<null | ReturnType<typeof Client>>(
    null
  );
  const [error, setError] = useState<null | string>(null);

  const credentials = useMemo(() => generateCredentials(), []);

  const toggleShowClient = () => {
    setError(null);
    setShowClient((showClient) => !showClient);
  };

  useEffect(() => {
    if (showClient) {
      setGameView(() =>
        Client({
          game: CricketGame,
          board: Dartboard,
          multiplayer: P2P({
            isHost,
            onError: (e) => {
              setError(e.type);
            }
          }),
          debug: true
        })
      );
    } else {
      setGameView(null);
    }
  }, [showClient, isHost]);

  if (!GameView) {
    return (
      <Configurator
        {...{
          matchID,
          setMatchID,
          isHost,
          setIsHost,
          onSubmit: toggleShowClient
        }}
      />
    );
  }

  return (
    <div>
      <div className="game-frame">
        <GameView {...{ playerID: isHost ? '0' : '1', matchID, credentials }} />
      </div>
      {error && (
        <p className="error">
          PeerJS Error: <code>{error}</code>
        </p>
      )}
      <h3>{`MatchID: ${matchID}`}</h3>
      {isHost && <p>This is the match host.</p>}
      <p>
        <button className="cta" onClick={toggleShowClient}>
          Back
        </button>
      </p>
    </div>
  );
};

function App() {
  const [/*unused*/, setDarboard] = useState<Granboard>();
  const [lastSegmentHit, setLastSegmentHit] = useState<Segment>();

  const onSegmentHit = useCallback((segment: Segment) => {
    setLastSegmentHit(segment);
  }, [])

  return (
    <div className="App">
        <button onClick={async () => {setDarboard(await Granboard.ConnectToBoard(onSegmentHit))}}>Connect to Dartboard</button>
        <h2>{lastSegmentHit?.LongName}</h2>
        <h2>TicTacToe Test</h2>
        <View />
    </div>
  );
}

export default App;
