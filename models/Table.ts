export interface TableData {
  id: string;
  dimension: {
    width: string;
    height: string;
  };
  scorePanel: {
    topMargin: string;
    width: string;
    height: string;
    leftTeam: {
      name: { size: string; top: string; left: string };
      score: { size: string; top: string; left: string };
    };
    rightTeam: {
      name: { size: string; top: string; left: string };
      score: { size: string; top: string; left: string };
    };
    position: {
      scale: number;
      left: string;
      top: string;
    };
  };

  LeftPlayer: { top: string; left: string };
  RightPlayer: { top: string; right: string };
  BottomPlayer: { bottom: string; left: string };
  PlayerImageWidth: number;
  DetailScore: { Color: string; FontSize: string };
}
