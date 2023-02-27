import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { Client } from 'boardgame.io/client'
import { generateCredentials, P2P } from '@boardgame.io/p2p'
import { Dartboard } from './Boards/Dartboard';
import { CricketGame, CricketState } from './Games/Cricket';
import { CopyBtn } from './Components/CopyBtn';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material'
import { AutoJoinClient } from './Utillities/AutoJoinClient';

// Request to keep the device alive so the game doesn't disconnect
(navigator as any)?.wakeLock.request();

const queryParameters = new URLSearchParams(window.location.search);
const QueryParamJoinGame = queryParameters.get("joinGame");
const QueryParamName = queryParameters.get("name");
const QueryParamNumPlayers = parseInt(queryParameters.get("numPlayers") ?? '2');

const uuid = () => Math.round(Math.random() * 1e16).toString(32);

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const matchID = useMemo(() => QueryParamJoinGame ? QueryParamJoinGame : uuid(), []);
  const isHost = useMemo(() => QueryParamJoinGame ? false : true, []);
  const joinURL = useMemo(() => `${window.location.origin}${window.location.pathname}${isHost ? `?joinGame=${matchID}` : ''}`, [matchID, isHost]);
  const [error, setError] = useState<null | string>(null);

  const [client, setClient] = useState<ReturnType<typeof Client<CricketState>>>();

  const credentials = useMemo(() => generateCredentials(), []);

  // Manage the client
  useEffect(() => {
    const client = AutoJoinClient<CricketState>({
      game: CricketGame,
      numPlayers: QueryParamNumPlayers,
      playerID: isHost ? '0' : undefined,
      matchID,
      credentials,
      multiplayer: P2P({
        playerName: QueryParamName ? QueryParamName : isHost ? 'Host' : 'Guest',
        isHost,
        onError: (e) => {
          setError(e.type);
        }
      }),
      debug: false
    });

    client.start();

    setClient(client);

    return () => {
      client.stop();
    }
  }, [isHost, credentials, matchID]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
    <div className="App">
      <div>
        <div className="game-frame">
          <Dartboard client={client} />
        </div>
        {error && (
          <p className="error">
            PeerJS Error: <code>{error}</code>
          </p>
        )}
        <CopyBtn value={joinURL}>Copy share URL</CopyBtn>
        {isHost && <p>You are the host</p>}
      </div>
    </div>
    </ThemeProvider>
  );
}

export default App;
