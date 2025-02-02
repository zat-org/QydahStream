import { useFirestore, useDocument } from "vuefire";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

interface TableData {
  id: string;
  dimension: {
    width: string;
    height: string;
  };
  scorePanel: {
    topMargin: string;
    width: string;
    height: string;
    svgViewBox :{width:string ,height:string}

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
export const useTable = async () => {
  const db = useFirestore();

  const tableData = ref<TableData>({
    id: "",
    PlayerImageWidth: 200,
    dimension:{width:"1080px" , height:"1920px"},
    scorePanel:{
      topMargin:"0px",
      width:"1080px",
      height:"300px",
      svgViewBox:{width:"1180",height:"400"}
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
      tableData.value = docSnap.data() as TableData;
    } else {
      console.log("dont exist ");

      const defaultTableData: TableData = {
        id: "",
        PlayerImageWidth: 200,
        dimension:{width:"1080px" , height:"1920px"},
        scorePanel:{
          topMargin:"0px",
          width:"1080px",
          height:"300px",
          svgViewBox:{width:"1180",height:"400"}
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

      tableData.value = defaultTableData;
      await setDoc(tableRef, defaultTableData);
    }

    onSnapshot(tableRef, (doc) => {
      tableData.value = doc.data() as TableData;
      console.log("Changed");
    });
  };

  return {
    getOrCreateTable,
    tableData,
  };
};
