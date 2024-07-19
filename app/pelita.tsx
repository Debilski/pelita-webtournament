"use client"

import React, {
  ReactNode,
  useEffect,
  useRef
} from "react";


import Maze from "./maze";
import ZMQReceiver from "./zmqreceiver";
import TypewriterText from "./typewritertext";
import { GameState } from "./zmqreceiver";

interface GameStats {
  points: [number, number];
  errors: [number, number];
  kills: [number, number, number, number];
  deaths: [number, number, number, number];
  time: [number, number];
}

function Pelita() {
  const [showPre, setShowPre] = React.useState(true);
  const [showMain, setShowMain] = React.useState(true);
  const [getText, setText] = React.useState<string[]>([]);

  const [gameUUID, setGameUUID] = React.useState("");
  const [shape, setShape] = React.useState<[number, number]>([0, 0]);
  const [walls, setWalls] = React.useState<[number, number][]>([]);
  const [food, setFood] = React.useState<[number, number][]>([]);
  const [bots, setBots] = React.useState<[number, number][]>([[0, 0], [0, 0], [0, 0], [0, 0]]);

  const [team1, setTeam1] = React.useState("");
  const [team2, setTeam2] = React.useState("");

  const [stats, setStats] = React.useState<GameStats | null>(null);
  const [whoWins, setWhoWins] = React.useState<number | null>(null);
  const [gameOver, setGameOver] = React.useState<boolean>(false);

  const flip = () => {
    //setShowMain(!showMain);
    //setShowPre(!showPre);
  };

  const updateGameState = (gameState: { '__data__': GameState }) => {
    if (gameState['__data__']) {
      // if (gameUUID != gameState['__data__']['game_uuid']) {
      setGameUUID((oldUUID) => {
        if (oldUUID != gameState['__data__']['game_uuid']) {
          console.log("UUID changed", gameState['__data__']['game_uuid'], oldUUID);
          setShape(gameState['__data__']['shape'])
          setWalls(gameState['__data__']['walls']);
        }
        return gameState['__data__']['game_uuid'];
      })
      // }
      setFood(gameState['__data__']['food']);
      setBots(gameState['__data__']['bots']);
      setTeam1(gameState['__data__']['team_names'][0]);
      setTeam2(gameState['__data__']['team_names'][1]);
      setStats(
        {
          "deaths": gameState['__data__']['deaths'],
          "kills": gameState['__data__']['kills'],
          "errors": gameState['__data__']['num_errors'],
          "points": gameState['__data__']['score'],
          "time": gameState['__data__']['team_time'],
        }
      );
      setWhoWins(gameState['__data__']['whowins']);
      setGameOver(gameState['__data__']['gameover']);
    }
  }

  const updateMessage = (msg: string) => {
    setText(oldText => [...oldText, msg]);
  }

  const clearPage = () => {
    setText([]);
  }

  const a = bots[0];
  const b = bots[2];
  const x = bots[1];
  const y = bots[3];

  return (
    <div>
      <h1 className="fixed top-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800 dark:border-gray-600">
        ᗧ Pelita Tournament 2024
      </h1>

      {showPre ?
        getText.map((t, i) => (<TypewriterText key={i} text={t}></TypewriterText>))
        : null}


      {showMain ?
        <div id="main">
          {gameUUID ?
            (<>
              <h2 className="flex flex-row text-lg">
              <span className="basis-1/2"><b>{team1}</b> ({stats.points[0]})</span>
              <span className="basis-1/2 text-right"><b>{team2}</b> ({stats.points[1]})</span>
              </h2>
              <div className="flex flex-row">
                <div className="basis-1/2">Errors: {stats.errors[0]}, Kills: {stats.kills[0] + stats.kills[2]}, Deaths: {stats.deaths[0] + stats.deaths[2]}, Time: {stats.time[0].toFixed(2)} </div>
                <div className="basis-1/2 text-right">Errors: {stats.errors[1]}, Kills: {stats.kills[1] + stats.kills[3]}, Deaths: {stats.deaths[1] + stats.deaths[3]}, Time: {stats.time[1].toFixed(2)} </div>
              </div>
            </>)
            : null}

          <Maze
            key={gameUUID}
            game_uuid={gameUUID}
            shape={shape}
            walls={walls}
            food={food}
            a={a}
            b={b}
            x={x}
            y={y}
            whowins={whoWins}
            gameover={gameOver}>
          </Maze>
          <p className='text-xs text-slate-600 text-right'>{gameUUID}</p>

        </div>
        : null
      }

      <ZMQReceiver url='ws://127.0.0.1:5556' sendGameState={updateGameState} sendMessage={updateMessage} sendClearPage={clearPage}></ZMQReceiver>


    </div>
  );
};
export default Pelita;
