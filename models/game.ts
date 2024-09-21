export interface MoshtraI {
  advancedDetails: null;
    id: number;
    usAbnat: number;
    themAbnat: number;
    state: string;
}

export interface SakkaI{
  moshtaras: MoshtraI[];
  id: number;
  state: string;
  isMashdoda: false;
  winner: null | string;
  usSakkaScore: number;
  themSakkaScore: number;
}


export interface GameI {
  sakkas: SakkaI[];
  id: string;
  createdAt: string;
  startedAt: string;
  endedAt: string | null;
  gameMode: string;
  state: string;
  usName: string;
  themName: string;
  usGameScore: number;
  themGameScore: number;
  maxSakkaPerGame: number;
  // us 0 up 1 down  them  0 right   1 left
  usPlayers: { name: string; url: string }[];
  themPlayers: { name: string; url: string }[];
  winner: null | string;
}
