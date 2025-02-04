import { defineStore } from "pinia";
import type { TableData } from "~/composables/Table";

export const useMyBoardConfStore = defineStore("myBoardConfStore", () => {
  const board = ref<TableData>();

  const defaultTableData: TableData = {
    id: "",
    PlayerImageWidth: 200,
    dimension: { width: "1080px", height: "1920px" },
    scorePanel: {
      topMargin: "0px",
      width: "1080px",
      height: "300px",
      position: {
        scale: 0.9,
        left: "-14px",
        top: "0px",
      },
      leftTeam: {
        name: {
          size: "25px",
          top: "73px",
          left: "111px",
          width: "50%",
          height: "100px",
        },
        score: {
          size: "47px",
          top: "66px",
          left: "414px",
          width: "20%",
          height: "100px",
        },
      },
      rightTeam: {
        name: {
          size: "25px",
          top: "73px",
          left: "188px",
          width: "50%",
          height: "100px",
        },
        score: {
          size: "47px",
          top: "66px",
          left: "43px",
          width: "20%",
          height: "100px",
        },
      },
    },
    LeftPlayer: { top: "calc(50% - 30px)", left: "0px" },
    RightPlayer: { top: "calc(50% - 30px)", right: "0px" },
    BottomPlayer: { bottom: "0px", left: "calc(50% - 30px)" },
    DetailScoreColor: "#000000",
  };
  defaultTableData.LeftPlayer.top = `calc(50% - ${
    defaultTableData.PlayerImageWidth / 2
  }px)`;
  defaultTableData.RightPlayer.top = `calc(50% - ${
    defaultTableData.PlayerImageWidth / 2
  }px)`;
  defaultTableData.BottomPlayer.left = `calc(50% - ${
    defaultTableData.PlayerImageWidth / 2
  }px)`;

  board.value = defaultTableData;
  return { board ,defaultTableData };
});
