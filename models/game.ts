export interface MoshtraI {
  advancedDetails: any[];
  id: number;
  usAbnat: number;
  themAbnat: number;
  state: string;
}

export interface SakkaI {
  moshtaras: MoshtraI[];
  id: number;
  state: string;
  isMashdoda: false;
  winner: null | string;
  themSakkaScore: number;
  usSakkaScore: number;
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


export interface IStatics {
  usStatistics: {
    playedSakkas: number,
    winnedSakkas: number,
    lostSakka: number,
    moshtaraSunCount: number,
    moshtaraHokmCount: number,
    wonMoshtaraCount: number,
    lostMoshtaraCount:number,
    ekak: number,
    aklat: number,
    sra: number,
    khamsen: number,
    me2a: number,
    rob3ome2a: number,
    baloot: number,
    sunKaboot: number,
    hokmKaboo: number
  },
  themStatistics: {
    winnedSakkas: number,
    playedSakkas: number,
    lostSakka: number,
    moshtaraSunCount:number,
    moshtaraHokmCount: number,
    wonMoshtaraCount: number,
    lostMoshtaraCount: number,
    ekak: number,
    aklat: number,
    sra: number,
    khamsen: number,
    me2a: number,
    rob3ome2a:number,
    baloot: number,
    sunKaboot: number,
    hokmKaboot: number
  }
}