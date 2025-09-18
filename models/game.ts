export interface MoshtraI {
  
    id: number;
    usAbnat: number;
    themAbnat: number;
    state: string;
    advancedDetails: any;
    startedAt: string;
    endedAt: string;
    pausingIntervals: any[];
    isMoshtaraSucceeded: any;
    moshtaraOwner: any;
  
  
}

export interface SakkaI {
  
    id: number;
    state: string;
    isMashdoda: boolean;
    winner: string | null;
    usSakkaScore: number;
    themSakkaScore: number;
    drawHandler: string;
    startedAt: string;
    endedAt: string;
    pausingIntervals: any[];
    moshtaras: MoshtraI[];
  }
 
export interface PlayerI {
    id: string;
    name: string;
    url: string;
    index: number;
  }

// export interface GameI {
//   sakkas: SakkaI[];
//   id: string;
//   createdAt: string;
//   startedAt: string;
//   endedAt: string | null;
//   gameMode: string;
//   state: string;
//   usName: string;
//   themName: string;
//   usGameScore: number;
//   themGameScore: number;
//   maxSakkaPerGame: number;
//   // us 0 up 1 down  them  0 right   1 left
//   usPlayers: { name: string; url: string }[];
//   themPlayers: { name: string; url: string }[];
//   winner: null | string;
// }

// game mode is enum or string value
// game - sakka -  moshtra state is enum or string value
//winner us them enum or string
// location object is type  object {lang and lat } or string
// advanced detrtails types
//pausingIntervals  type
// in real matxh  isMoshtaraSucceeded boolean   or null
export interface GameI {
  gameData: {
    id: string;
    createdAt: string;
    startedAt: string;
    endedAt: string|null;
    gameMode: string;
    state: string;
    usName: string;
    themName: string;
    usGameScore: number;
    themGameScore: number;
    maxSakkaPerGame: number;
    lastAppliedEventIndex: number;
    winner: string|null;
    gameInterval: number;
    location: any;
    pausingIntervals: any[];
    usPlayers: PlayerI[];
    themPlayers: PlayerI[];
    sakkas: SakkaI[];
  };
  boardSettings: {
    portrait: BoardSettingsI;
    landscape: BoardSettingsI;    
    };
}


export interface BoardSettingsI {
  dimension: {
    width: number;
    height: number;
  };
  scorePanel: {
    topMargin: number;
    height: number;
    position: {
      scale: number;
      top: number;
      left: number;
    };
    leftTeam: {
      name: {
        size: number;
        top: number;
        left: number;
      };
      score: {
        size: number;
        top: number;
        left: number;
      };
    };
    rightTeam: {
      name: {
        size: number;
        top: number;
        left: number;
      };
      score: {
        size: number;
        top: number;
        left: number;
      };
    };
  };
  leftPlayer: {
    top: number;
    left: number;
  };
  rightPlayer: {
    top: number;
    right: number;
  };
  bottomPlayer: {
    bottom: number;
    left: number;
  };
  playerImageWidth: number;
  detailScore: {
    color: string;
    fontSize: number;
  };
}

export interface IStatics {
  usStatistics: {
    playedSakkas: number;
    winnedSakkas: number;
    lostSakka: number;
    moshtaraSunCount: number;
    moshtaraHokmCount: number;
    wonMoshtaraCount: number;
    lostMoshtaraCount: number;
    ekak: number;
    aklat: number;
    sra: number;
    khamsen: number;
    me2a: number;
    rob3ome2a: number;
    baloot: number;
    sunKaboot: number;
    hokmKaboo: number;
  };
  themStatistics: {
    winnedSakkas: number;
    playedSakkas: number;
    lostSakka: number;
    moshtaraSunCount: number;
    moshtaraHokmCount: number;
    wonMoshtaraCount: number;
    lostMoshtaraCount: number;
    ekak: number;
    aklat: number;
    sra: number;
    khamsen: number;
    me2a: number;
    rob3ome2a: number;
    baloot: number;
    sunKaboot: number;
    hokmKaboot: number;
  };
}
