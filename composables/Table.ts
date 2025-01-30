import { useFirestore, useDocument } from "vuefire";
import { doc, setDoc } from "firebase/firestore";
import { until } from "@vueuse/core";
interface TableData {
  id: string;
  LeftPlayer: { top: string; left: string };
  RightPlayer: { top: string; right: string };
  BottomPlayer: { bottom: string; left: string };
  PlayerImageWidth: number;
}

export const useTable = () => {
  const db = useFirestore();
  const getOrCreateTable = async (tableId: string) => {
    const tableRef = doc(db, "tables", tableId);
    const { data: tableDoc } = useDocument(tableRef);
    await until(tableDoc).not.toBeNull();
    const tableData = computed(() => {
      if (tableDoc.value) {
        console.log(" it was added ");
        return tableDoc.value as TableData;
      } else {
        const defaultTableData: TableData = {
          id: tableId,
          PlayerImageWidth: 60,
          LeftPlayer: { top: "", left: "0px" },
          RightPlayer: { top: "", right: "0px" },
          BottomPlayer: { bottom: "0px", left: "" },
        };
        defaultTableData.LeftPlayer.top = `calc(50% - ${defaultTableData.PlayerImageWidth/2}px)`;
        defaultTableData.RightPlayer.top = `calc(50% - ${defaultTableData.PlayerImageWidth/2}px)`;
        defaultTableData.BottomPlayer.left = `calc(50% - ${defaultTableData.PlayerImageWidth/2}px)`;

        // Create new table if it doesn't exist
        try {
          setDoc(tableRef, defaultTableData);
        } catch (e) {
          console.log(e);
        }

        return defaultTableData;
      }
    }).value;
    return tableData;
  };

  return {
    getOrCreateTable,
  };
};
