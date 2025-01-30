import { useFirestore, useDocument } from "vuefire";
import { doc, setDoc } from "firebase/firestore";

interface TableData {
  id: string;
  LeftPlayer : {top:string ,left:string };
  RightPlayer: {top:string , right:string };
  BottomPlayer: {bottom:string ,left:string };
  PlayerImageWidth:number
}

export const useTable = () => {
  const db = useFirestore();

  const getOrCreateTable = async (tableId: string)=> {
    const tableRef = doc(db, "tables", tableId);
    const { data: tableDoc } = useDocument(tableRef);

    const tableData = computed(() => {
      if (tableDoc.value) {
        return tableDoc.value as TableData;
      }

      const defaultTableData: TableData = {
        id: tableId,
        PlayerImageWidth: 60,
        LeftPlayer: { top: "", left: "0px" },
        RightPlayer: { top: "", right: "0px" },
        BottomPlayer: { bottom: "0px", left: "" },
      };
      defaultTableData.LeftPlayer.top=`calc(50% - ${defaultTableData.PlayerImageWidth}px)`
      defaultTableData.RightPlayer.top=`calc(50% - ${defaultTableData.PlayerImageWidth}px)`
      defaultTableData.BottomPlayer.left=`calc(50% - ${defaultTableData.PlayerImageWidth}px)`

      // Create new table if it doesn't exist
      setDoc(tableRef, defaultTableData);
      return defaultTableData;
    });    return tableData
  };

  return {
    getOrCreateTable,
  };
};
