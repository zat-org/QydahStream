import { useFirestore, useDocument } from "vuefire";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
interface TableData {
  id: string;
  scoreMarginTop:string,
  LeftPlayer: { top: string; left: string };
  RightPlayer: { top: string; right: string };
  BottomPlayer: { bottom: string; left: string };
  PlayerImageWidth: number;
}

export const useTable = async() => {
  const db = useFirestore();
  const tableData = ref<TableData>({
    id: "",
    PlayerImageWidth: 60,
    scoreMarginTop:"0px",
    LeftPlayer: { top: "calc(50% - 30px)", left: "0px" },
    RightPlayer: { top: "calc(50% - 30px)", right: "0px" },
    BottomPlayer: { bottom: "0px", left: "calc(50% - 30px)" },
  });

  const getOrCreateTable = async (tableId: string) => {
    const tableRef = doc(db, "tables", tableId);
    const docSnap = await getDoc(tableRef);
    if (docSnap.exists()) {
    console.log("exist ")
      tableData.value = docSnap.data() as TableData;
    } else {
    console.log("dont exist ")

      const defaultTableData: TableData = {
        id: tableId,
        PlayerImageWidth: 60,
        scoreMarginTop:"0px",
        LeftPlayer: { top: "", left: "0px" },
        RightPlayer: { top: "", right: "0px" },
        BottomPlayer: { bottom: "0px", left: "" },
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
      tableData.value = defaultTableData;
      await setDoc(tableRef, defaultTableData);
    }

    onSnapshot(tableRef, (doc) => {
      tableData.value = doc.data() as TableData;
      console.log("Changed")
    });

  };

  return {
    getOrCreateTable,
    tableData,
  };
};
