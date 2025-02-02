import { defineStore } from 'pinia'
import type { TableData } from '~/composables/Table'

export const useMyBoardConfStore = defineStore('myBoardConfStore',()=>{
  const  board = ref<TableData>()

      const defaultTableData: TableData = {
        id: "",
        PlayerImageWidth: 200,
        dimension: { width: "1080px", height: "1920px" },
        scorePanel: {
          topMargin: "0px",
          width: "1080px",
          height: "300px",
          svgViewBox: { width: "1180", height: "400" },
          leftTeam: { 
            name: { size: "25px", top:"18px" , left:"116px" ,width:"50%",height:"100px"}, 
            score: { size: "47px" ,top:"7px" , left:"403px",width:"20%",height:"100px" }
           },
          rightTeam: {
            name: { size: "25px", top:"18px" , left:"527px" ,width:"50%",height:"100px"}, 
            score: { size: "47px" ,top:"7px" , left:"474px",width:"20%",height:"100px" }
          }
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
      defaultTableData.scorePanel.svgViewBox.width =`${Number.parseInt(defaultTableData.scorePanel.width.replace("px","")) +100}`
      defaultTableData.scorePanel.svgViewBox.height =`${Number.parseInt(defaultTableData.scorePanel.height.replace("px","")) +100}`
      board.value = defaultTableData
return {board}
})
