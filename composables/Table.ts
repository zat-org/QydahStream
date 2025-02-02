import { useFirestore, useDocument } from "vuefire";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

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
    svgViewBox: { width: string; height: string };
    leftTeam: { 
      name: { size: string, top:string , left:string ,width:string,height:string}; 
      score: { size: string ,top:string , left:string,width:string,height:string }
     };
    rightTeam: {
      name: { size: string, top:string , left:string ,width:string,height:string}; 
      score: { size: string ,top:string , left:string,width:string,height:string }
    };
  };
  LeftPlayer: { top: string; left: string };
  RightPlayer: { top: string; right: string };
  BottomPlayer: { bottom: string; left: string };
  PlayerImageWidth: number;
  DetailScoreColor: string;
}
// interface TableData {
//   id: string;
//   scoreMarginTop: string;
//   LeftPlayer: { top: string; left: string };
//   RightPlayer: { top: string; right: string };
//   BottomPlayer: { bottom: string; left: string };
//   PlayerImageWidth: number;
//   DetailScoreColor: string;
// }
export const useTable = () => {
  const db = useFirestore();
  const BoardStore = useMyBoardConfStore();
  const tableData = ref<TableData>({
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
        name: { size: "25px", top:"18px" , left:"114px" ,width:"50%",height:"100px"}, 
        score: { size: "47px" ,top:"7px" , left:"0px",width:"20%",height:"100px" }
      }
    },
    LeftPlayer: { top: "calc(50% - 30px)", left: "0px" },
    RightPlayer: { top: "calc(50% - 30px)", right: "0px" },
    BottomPlayer: { bottom: "0px", left: "calc(50% - 30px)" },
    DetailScoreColor: "#000000",
  });

  const getOrCreateTable = async (tableId: string) => {
    const tableRef = doc(db, "tables", tableId);
    const docSnap = await getDoc(tableRef);
    if (docSnap.exists()) {
      console.log("exist ");
      // test
      BoardStore.board = docSnap.data() as TableData;
      tableData.value = docSnap.data() as TableData;
    } else {
      console.log("dont exist ");

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
            name: { size: "25px", top:"18px" , left:"114px" ,width:"50%",height:"100px"}, 
            score: { size: "47px" ,top:"7px" , left:"0px",width:"20%",height:"100px" }
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
      defaultTableData.scorePanel.svgViewBox.width = `${
        Number.parseInt(defaultTableData.scorePanel.width.replace("px", "")) +
        100
      }`;
      defaultTableData.scorePanel.svgViewBox.height = `${
        Number.parseInt(defaultTableData.scorePanel.height.replace("px", "")) +
        100
      }`;
      BoardStore.board = defaultTableData;
      tableData.value = defaultTableData;
      await setDoc(tableRef, defaultTableData);
    }

    onSnapshot(tableRef, (doc) => {
      tableData.value = doc.data() as TableData;
      BoardStore.board = doc.data() as TableData;
    });
  };

  return {
    getOrCreateTable,
    tableData,
  };
};
