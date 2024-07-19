"use client"

import React, {
  useEffect,
  useState
} from "react";

import anime from 'animejs/lib/anime.es.js';

const cellSize = 32; // Size of each cell in the SVG
const offset = 0.15 * cellSize; // Offset for the outline

const findClusters = (shape: [number, number], walls: [number, number][]) => {
  const [width, height] = shape;
  const clusters: [number, number][][] = [];
  const visited = new Set<string>();

  const directions = [
    [0, 1], [1, 0], [0, -1], [-1, 0]
  ];

  const inBounds = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < height;

  const dfs = (x: number, y: number, cluster: [number, number][]) => {
    if (!inBounds(x, y) || visited.has(`${x},${y}`) || !walls.some(([bx, by]) => bx === x && by === y)) {
      return;
    }
    visited.add(`${x},${y}`);
    cluster.push([x, y]);
    for (const [dx, dy] of directions) {
      dfs(x + dx, y + dy, cluster);
    }
  };

  for (const [x, y] of walls) {
    if (!visited.has(`${x},${y}`)) {
      const cluster: [number, number][] = [];
      dfs(x, y, cluster);
      clusters.push(cluster);
    }
  }

  return clusters;
};

// Generate the path for a single cluster using a perimeter tracing algorithm with inner and outer boundaries
const createPath = (cluster: [number, number][]) => {
  const pathCommands: string[] = [];
  const visitedCorners = new Set<string>();

  const startPoint = cluster[0];
  let [x, y] = startPoint;
  let corner = 0;

  const move = () => {
    switch (corner) {
      case 0:
        // check if there is a wall to the left
        if (cluster.some(([bx, by]) => bx === x - 1 && by === y)) {
          corner = 1;
          x -= 1;
        } else {
          corner = 2;
        }
        break;

      case 1:
        // check if there is a wall to the top
        if (cluster.some(([bx, by]) => bx === x && by === y - 1)) {
          corner = 3;
          y -= 1;
        } else {
          corner = 0;
        }
        break;

      case 2:
        // check if there is a wall to the bottom
        if (cluster.some(([bx, by]) => bx === x && by === y + 1)) {
          corner = 0;
          y += 1;
        } else {
          corner = 3;
        }
        break;

      case 3:
        // check if there is a wall to the right
        if (cluster.some(([bx, by]) => bx === x + 1 && by === y)) {
          corner = 2;
          x += 1;
        } else {
          corner = 1;
        }
        break;

      default:
        break;
    }
  };
  {

    let startCorner = 3;
    corner = startCorner;

    const px = x * cellSize + (corner % 2 === 0 ? offset : cellSize - offset);
    const py = y * cellSize + (corner < 2 ? offset : cellSize - offset);

    pathCommands.push(`M${px},${py}`);

    do {
      const node = `${x},${y},${corner}`;
      if (visitedCorners.has(node)) {
        break;
      }

      visitedCorners.add(node);

      const px = x * cellSize + (corner % 2 === 0 ? offset : cellSize - offset);
      const py = y * cellSize + (corner < 2 ? offset : cellSize - offset);

      pathCommands.push(`L${px} ${py}`);
      move()
    } while (!(x === startPoint[0] && y === startPoint[1] && corner === startCorner));

    pathCommands.push('Z'); // Close the path
  };

  const node = `${x},${y},${0}`;
  if (!visitedCorners.has(node)) {
    let startCorner = 0;
    corner = startCorner;

    const px = x * cellSize + (corner % 2 === 0 ? offset : cellSize - offset);
    const py = y * cellSize + (corner < 2 ? offset : cellSize - offset);

    pathCommands.push(`M${px},${py}`);

    do {
      const node = `${x},${y},${corner}`;
      if (visitedCorners.has(node)) {
        break;
      }

      visitedCorners.add(node);

      const px = x * cellSize + (corner % 2 === 0 ? offset : cellSize - offset);
      const py = y * cellSize + (corner < 2 ? offset : cellSize - offset);

      pathCommands.push(`L${px},${py}`);
      move()
    } while (!(x === startPoint[0] && y === startPoint[1] && corner === startCorner));

    pathCommands.push('Z'); // Close the path
  };

  //console.log(pathCommands, cluster);
  return pathCommands.join(' ');
};


function Bot({ position, color, width }: { position: [number, number], color: string, width: number }) {
  const leftSide = position[0] < width / 2;
  const inHomezone = () => {
    switch (color) {
      case "blue":
        return leftSide;

      case "red":
        return !leftSide;
    }
  }

  useEffect(() => {
    anime.timeline()
      .add({
        targets: '#mazebox .blue',
        opacity: [0, 1],
        easing: 'linear',
        duration: 2000,
      }, 3500)
      .add({
        targets: '#mazebox .red',
        opacity: [0, 1],
        easing: 'linear',
        duration: 2000,
      }, 3500);;
  }, []);

  return (
    <use transform={`translate(${(position[0]) * cellSize}, ${(position[1]) * cellSize}) scale(3)`} href={inHomezone() ? `#ghost` : `#pacman`} className={color} />
  )
}

function Maze({ game_uuid, shape, walls, food, a, b, x, y, whowins, gameover }:
  {
    game_uuid: string,
    shape: [number, number],
    walls: [number, number][],
    food: [number, number][],
    a: [number, number],
    b: [number, number],
    x: [number, number],
    y: [number, number],
    whowins: number | null,
    gameover: boolean
  }
) {
  const [width, height] = shape;
  const clusters = findClusters(shape, walls);

  useEffect(() => {
    if (game_uuid) {
      let pathAnimation = anime.timeline()
        .add({
          targets: '#mazebox #maze path',
          strokeDashoffset: [anime.setDashoffset, 0],
          easing: 'easeInCubic',
          duration: 2000,
          delay: function (el, i) { return i * 25 },
          direction: 'alternate',
          loop: false
        })
        .add({
          targets: '#mazebox #maze path',
          fill: ['rgb(214, 219, 220)', "#faa"], // ffa
          easing: 'linear',
          duration: 2000
        }, 2000)
        .add({
          targets: '#mazebox .foodblue',
          opacity: [0, 1],
          easing: 'linear',
          duration: 2000,
        }, 3000)
        .add({
          targets: '#mazebox .foodred',
          opacity: [0, 1],
          easing: 'linear',
          duration: 2000,
        }, 3000)
        .add({
          targets: '#mazebox .blue',
          opacity: [0, 1],
          easing: 'linear',
          duration: 2000,
        }, 3500)
        .add({
          targets: '#mazebox .red',
          opacity: [0, 1],
          easing: 'linear',
          duration: 2000,
        }, 3500);
    }
  }, [walls]);


  useEffect(() => {
    console.log(gameover, whowins);
    if (gameover && whowins === 0) {
      let pathAnimation = anime.timeline()
        .add({
          targets: '#mazebox #maze path',
          fill: ["#faa", "rgb(94, 158, 217)"],
          easing: 'linear',
          duration: 200
        });
    };
    if (gameover && whowins === 1) {
      let pathAnimation = anime.timeline()
        .add({
          targets: '#mazebox #maze path',
          fill: ["#faa", "rgb(235, 90, 90)"],
          easing: 'linear',
          duration: 200
        });
    };
    if (gameover && whowins === 2) {
      let pathAnimation = anime.timeline()
        .add({
          targets: '#mazebox #maze path',
          fill: ["#faa", "#fff"],
          easing: 'linear',
          duration: 200
        });
    };
  }, [gameover, whowins]);


  return (
    <div id="mazebox">
      <svg
        width={width * cellSize}
        height={height * cellSize}
        viewBox={`0 0 ${width * cellSize} ${height * cellSize}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <style type="text/css">{`
        line {
            stroke: #000000;
            stroke-linecap: round;
            stroke-width: 3;
        }
        .foodblue {
            stroke: black;
            fill: rgb(94, 158, 217);
        }
        .foodred {
            stroke: black;
            fill: rgb(235, 90, 90);
        }
        .blue {
            fill: rgb(94, 158, 217);
        }
        .red {
            fill: rgb(235, 90, 90);
        }

        .gameover {
          fill: #FFC903;
          stroke: #ED1B22;
          stroke-width: 10px;
          stroke-linejoin: round;
          paint-order: stroke;
        }
    `}</style>


        <defs>
          <g id="pacman">
            <path d="M 9.98 7.73
        A 4.38 4.38 0 1 1 9.98 3.8
        L 6.05 5.8
        Z"
            />
          </g>

          <g id="ghost">
            <path d="M 2 6
        C 2 3.79 3.8 2 6 2
        C 8.21 2 10 3.8 10 6
        L 10 10
        L 9.01 8.81
        L 8.01 10
        L 7 8.81
        L 6.01 10
        L 5.01 8.81
        L 4 10
        L 3 8.81
        L 2 10
        L 2 6
        Z
        M 4.39 6.54
        C 4.9 6.54 5.31 6.03 5.31 5.38
        C 5.31 4.74 4.9 4.22 4.39 4.22
        C 3.88 4.22 3.47 4.74 3.47 5.38
        C 3.47 6.03 3.88 6.54 4.39 6.54
        Z
        M 6.9 6.54
        C 7.41 6.54 7.82 6.03 7.82 5.38
        C 7.82 4.74 7.41 4.22 6.9 4.22
        C 6.39 4.22 5.98 4.74 5.98 5.38
        C 5.98 6.03 6.39 6.54 6.9 6.54
        Z
        M 4.25 6
        C 4.44 6 4.6 5.79 4.6 5.53
        C 4.6 5.27 4.44 5.05 4.25 5.05
        C 4.05 5.05 3.89 5.27 3.89 5.53
        C 3.89 5.79 4.05 6 4.25 6
        Z
        M 6.76 6
        C 6.95 6 7.11 5.79 7.11 5.53
        C 7.11 5.27 6.95 5.05 6.76 5.05
        C 6.56 5.05 6.4 5.27 6.4 5.53
        C 6.4 5.79 6.56 6 6.76 6
        Z"></path>
          </g>

        </defs>

        <g id="maze">
          {walls.map(([x, y], index) => (
            <rect
              key={`${x},${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="transparent"
            />
          ))}
          {clusters.map((cluster, index) => (
            <path
              className="maze"
              key={`${cluster[0]},${cluster[1]}-${cluster.length}`}
              d={createPath(cluster)}
              stroke="darkblue"
              strokeWidth="2"
              fill="transparent"
              strokeLinecap="round"
              strokeLinejoin="bevel"
            />
          ))}
        </g>
        {food.map(([x, y], index) => (
          <circle key={index} cx={(0.5 + x) * cellSize} cy={(0.5 + y) * cellSize} r={cellSize / 5} className={x < width / 2 ? "foodblue" : "foodred"}></circle>
        ))}

        <Bot position={a} key="botA" color="blue" width={width}></Bot>
        <Bot position={b} key="botB" color="blue" width={width}></Bot>
        <Bot position={x} key="botX" color="red" width={width}></Bot>
        <Bot position={y} key="botY" color="red" width={width}></Bot>

        {
          gameover ? (<text fontSize="100" className="gameover"
          x="50%" y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          >
          GAME OVER
        </text>) : null
          }

      </svg>
    </div>
  );
};
export default Maze;

