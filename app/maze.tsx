"use client"

import React, {
  useEffect
} from "react";

import anime from 'animejs/lib/anime.es.js';

type Pos = [number, number];

const cellSize = 32; // Size of each cell in the SVG
const offset = 0.2 * cellSize; // Offset for the outline
let radius = 0.5 * cellSize - offset;
let radius_inner = offset;

const findClusters = (shape: Pos, walls: Pos[]) => {
  const [width, height] = shape;
  const clusters: Pos[][] = [];
  const visited = new Set<string>();

  const directions = [
    [0, 1], [1, 0], [0, -1], [-1, 0]
  ];

  const inBounds = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < height;

  const dfs = (x: number, y: number, cluster: Pos[]) => {
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
      const cluster: Pos[] = [];
      dfs(x, y, cluster);
      clusters.push(cluster);
    }
  }

  return clusters;
};

// Generate the path for a single cluster using a perimeter tracing algorithm with inner and outer boundaries
const createPath = (cluster: Pos[]) => {
  const visitedCorners = new Set<string>();
  const visitedCells = new Set<string>();


  /* Corners:

    Reference points

    +-4-----+-------+
    |       0       7
    |       |       |
    |       |       |
    +-1-----+-----3-+
    |       |       |
    |       |       |
    5       2       |
    +-------+-----6-+

  */

  const refPoint0 = [0.5 * cellSize, offset];
  const refPoint1 = [offset, 0.5 * cellSize];
  const refPoint2 = [0.5 * cellSize, cellSize - offset];
  const refPoint3 = [cellSize - offset, 0.5 * cellSize];

  const refPoint4 = [offset, 0];
  const refPoint5 = [0, cellSize - offset];
  const refPoint6 = [cellSize - offset, cellSize];
  const refPoint7 = [cellSize, offset];

  const refPoints = [
    refPoint0, refPoint1, refPoint2, refPoint3,
    refPoint4, refPoint5, refPoint6, refPoint7
  ];

  type PathMove = { next: [Pos, number], path: string };

  const makeNextLine = (x: number, y: number, nextRefPoint: number): PathMove => {
    const px = x * cellSize + refPoints[nextRefPoint][0];
    const py = y * cellSize + refPoints[nextRefPoint][1];
    return { next: [[x, y], nextRefPoint], path: `L ${px},${py}` };
  }

  const makeNextCurve = (x: number, y: number, nextRefPoint: number): PathMove => {
    const px = x * cellSize + refPoints[nextRefPoint][0];
    const py = y * cellSize + refPoints[nextRefPoint][1];
    return { next: [[x, y], nextRefPoint], path: `A ${radius},${radius} 0 0 0 ${px},${py}` };
  }

  const makeNextCurveInner = (x: number, y: number, nextRefPoint: number): PathMove => {
    const px = x * cellSize + refPoints[nextRefPoint][0];
    const py = y * cellSize + refPoints[nextRefPoint][1];
    return { next: [[x, y], nextRefPoint], path: `A ${radius_inner},${radius_inner} 0 0 1 ${px},${py}` };
  }

  const move = (x: number, y: number, corner: number): PathMove | undefined => {
    switch (corner) {
      case 0:
        // exit if wall to the top
        if (cluster.some(([bx, by]) => bx === x && by === y - 1)) return;
        // check if there is a wall to the left
        if (cluster.some(([bx, by]) => bx === x - 1 && by === y)) {
          return makeNextLine(x - 1, y, 7);
        } else {
          return makeNextCurve(x, y, 1);
        }

      case 1:
        // exit if wall to the left
        if (cluster.some(([bx, by]) => bx === x - 1 && by === y)) return;
        // check if there is a wall to the bottom
        if (cluster.some(([bx, by]) => bx === x && by === y + 1)) {
          return makeNextLine(x, y + 1, 4);
        } else {
          return makeNextCurve(x, y, 2);
        }

      case 2:
        // exit if wall to the bottom
        if (cluster.some(([bx, by]) => bx === x && by === y + 1)) return;
        // check if there is a wall to the right
        if (cluster.some(([bx, by]) => bx === x + 1 && by === y)) {
          return makeNextLine(x + 1, y, 5);
        } else {
          return makeNextCurve(x, y, 3);
        }

      case 3:
        // exit if wall to the right
        if (cluster.some(([bx, by]) => bx === x + 1 && by === y)) return;
        // check if there is a wall to the top
        if (cluster.some(([bx, by]) => bx === x && by === y - 1)) {
          return makeNextLine(x, y - 1, 6);
        } else {
          return makeNextCurve(x, y, 0);
        }

      case 4:
        // check if there is a wall to the left
        if (cluster.some(([bx, by]) => bx === x - 1 && by === y)) {
          return makeNextCurveInner(x - 1, y, 7);
        } else {
          return makeNextLine(x, y, 1);
        }

      case 5:
        // check if there is a wall to the bottom
        if (cluster.some(([bx, by]) => bx === x && by === y + 1)) {
          return makeNextCurveInner(x, y + 1, 4);
        } else {
          return makeNextLine(x, y, 2);
        }

      case 6:
        // check if there is a wall to the right
        if (cluster.some(([bx, by]) => bx === x + 1 && by === y)) {
          return makeNextCurveInner(x + 1, y, 5);
        } else {
          return makeNextLine(x, y, 3);
        }

      case 7:
        // check if there is a wall to the top
        if (cluster.some(([bx, by]) => bx === x && by === y - 1)) {
          return makeNextCurveInner(x, y - 1, 6);
        } else {
          return makeNextLine(x, y, 0);
        }
    }
  };

  if (cluster.length === 1) {
    // Widen the dot so that it does not look like food
    const [x, y] = cluster[0];

    const px = x * cellSize + 0.5 * cellSize;
    const py = y * cellSize + offset;

    return [
      `M ${px},${py}`,
      `l ${-offset} 0`,
      `a 1,1 0 0 0 0,${cellSize - 2 * offset}`,
      `l ${2 * offset} 0`,
      `a 1,1 0 0 0 0,${- cellSize + 2 * offset}`,
      `Z`
    ].join(" ");
  }

  const pathCommands = cluster.flatMap((startCell) => {
    // iterate through all possible starting points in all cells (unless already visited)
    const paths = [0, 1, 2, 3].map(startRefPoint => {
      let [x, y] = startCell;
      if (visitedCorners.has(`${x},${y},${startRefPoint}`)) return "";

      let refPoint = startRefPoint;

      const px = x * cellSize + refPoints[refPoint][0];
      const py = y * cellSize + refPoints[refPoint][1];

      let pathCommands = [];
      pathCommands.push([`M ${px},${py}`]);

      do {
        const node = `${x},${y},${refPoint}`;
        if (visitedCorners.has(node)) {
          break;
        }

        visitedCorners.add(node);
        visitedCells.add(`${x},${y}`);

        let pathMove = move(x, y, refPoint);
        if (!pathMove) return "";
        let path = "";
        ({ next: [[x, y], refPoint], path: path } = pathMove);

        pathCommands.push([path]);
      } while (!(x === startCell[0] && y === startCell[1] && refPoint === startRefPoint));

      pathCommands.push(["Z"]); // Close the path

      const joined = pathCommands.join(" ");
      return joined;
    });
    return paths;
  });

  console.log(pathCommands);
  return pathCommands.join(" ");
};


function Bot({ position, color, width }: { position: Pos, color: string, width: number }) {
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
    shape: Pos,
    walls: Pos[],
    food: Pos[],
    a: Pos,
    b: Pos,
    x: Pos,
    y: Pos,
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
          //fill: ['rgb(214, 219, 220)', "#faa"], // ffa
          fillOpacity: [0, 0.7], // ffa
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
  }, [walls, game_uuid]);


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
          <linearGradient id="grad" gradientUnits="userSpaceOnUse">
            <stop stopColor="blue" offset="0" />
            <stop stopColor="blue" offset="50%" />
            <stop stopColor="red" offset="50%" />
            <stop stopColor="red" offset="100%" />
          </linearGradient>
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
              opacity="0"
              // fill="lightblue"
              stroke="lightgrey"
            />
          ))}
          {clusters.map((cluster, index) => (
            <path
              className="maze"
              key={`${cluster[0]},${cluster[1]}-${cluster.length}`}
              d={createPath(cluster)}
              // stroke="lightblue"
              stroke="url(#grad)"
              strokeWidth="2"
              fill="#ffa"
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

