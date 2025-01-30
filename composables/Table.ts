import { useFirestore, useDocument } from "vuefire";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
interface TableData {
  id: string;
  LeftPlayer: { top: string; left: string };
  RightPlayer: { top: string; right: string };
  BottomPlayer: { bottom: string; left: string };
  PlayerImageWidth: number;
}

export const useTable = () => {
  const db = useFirestore();
  const tableData = ref();
  const getOrCreateTable = async (tableId: string) => {
    const tableRef = doc(db, "tables", tableId);
    const docSnap = await getDoc(tableRef);
    if (!docSnap.exists()) {
      const defaultTableData: TableData = {
        id: tableId,
        PlayerImageWidth: 60,
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
      tableData.value=defaultTableData
      await setDoc(tableRef, defaultTableData);
    }
    const unsubscribe = onSnapshot(tableRef, (doc) => {
      tableData.value = doc.data();
    });

    return tableData;
  };

  return {
    getOrCreateTable,
  };
};
