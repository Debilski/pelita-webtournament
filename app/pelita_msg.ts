
import type { Tuple4 } from './typeutils';

// export interface RootMsg {
//   __action__: string;
//   __data__: ObserveData|null;
// }

type RootMsg = {
  __action__: "observe",
  __data__: ObserveData
} | {
  __action__: "SPEAK",
  __data__: string
} | {
  __action__: "CLEAR",
  __data__: null
} | {
  __action__: "INIT",
  __data__: null
};

type Pos = [number, number];

export type { RootMsg };

export interface ObserveData {
  game_uuid: string;
  walls: Pos[];
  shape: Pos;
  food: Pos[];
  food_age: (number[] | number)[][];
  turn: number;
  round: number;
  gameover: boolean;
  whowins?: any;
  bots: Tuple4<Pos>;
  score: [number, number];
  fatal_errors: any[][];
  errors: null[];
  max_rounds: number;
  timeout: number;
  noise_radius: number;
  sight_distance: number;
  max_food_age: number;
  shadow_distance: number;
  layout_name: string;
  team_names: [string, string];
  team_infos: null[];
  team_time: [number, number];
  deaths: Tuple4<number>;
  kills: Tuple4<number>;
  bot_was_killed: boolean[];
  noisy_positions: (number[] | null)[];
  requested_moves: RequestedMove[];
  say: Tuple4<string>;
  timeout_length: number;
  error_limit: number;
  num_errors: [number, number];
}

export interface RequestedMove {
  previous_position: number[];
  requested_position: number[];
  success: boolean;
}
