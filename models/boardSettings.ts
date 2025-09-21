export interface BoardSettingsI {
    portrait: OrientationBoardSettingsI;
    landscape: OrientationBoardSettingsI;
  }
  
  export interface OrientationBoardSettingsI {
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
  