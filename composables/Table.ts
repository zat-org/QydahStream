import { useFirestore, useDocument } from "vuefire";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import type { TableData } from "~/models/Table";


export const useTable = () => {
  const db = useFirestore();
  const BoardStore = useMyBoardConfStore();


  const getOrCreateTable = async (tableId: string) => {
    const tableRef = doc(db, "tables", tableId);
    const docSnap = await getDoc(tableRef);
    if (docSnap.exists()) {
      console.log("exist ");
      // test
      BoardStore.board = docSnap.data() as TableData;
    } else {
      console.log("dont exist ");
      BoardStore.board = BoardStore.defaultTableData;
      await setDoc(tableRef,BoardStore.defaultTableData);
    }

    onSnapshot(tableRef, (doc) => {
      BoardStore.board = doc.data() as TableData;
    });
  };

  return {
    getOrCreateTable,
  };
};
