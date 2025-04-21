import { defineStore } from "pinia";
import type { TableData } from "~/models/Table";

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
          size: "30px",
          top: "0px",
          left: "0px",

        },
        score: {
          size: "50px",
          top: "0px",
          left: "0px",

        },
      },
      rightTeam: {
        name: {
          size: "30px",
          top: "0px",
          left: "0px",

        },
        score: {
          size: "50px",
          top: "0px",
          left: "0px",

        },
      },
    },
    LeftPlayer: { top: "calc(50% - 30px)", left: "0px" },
    RightPlayer: { top: "calc(50% - 30px)", right: "0px" },
    BottomPlayer: { bottom: "0px", left: "calc(50% - 30px)" },
    DetailScore:{Color:"#000000" , FontSize:"50px"},
  };
  defaultTableData.LeftPlayer.top = ` ${
    defaultTableData.PlayerImageWidth / 2
  }px`;
  defaultTableData.RightPlayer.top = `  ${
    defaultTableData.PlayerImageWidth / 2
  }px`;
  defaultTableData.BottomPlayer.left = `  ${
    defaultTableData.PlayerImageWidth / 2
  }px`;

  // board.value = defaultTableData;
  return { board ,defaultTableData };
});
