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
    leftTeam: { 
      name: { size: string, top:string , left:string ,width:string,height:string}; 
      score: { size: string ,top:string , left:string,width:string,height:string }
     };
    rightTeam: {
      name: { size: string, top:string , left:string ,width:string,height:string}; 
      score: { size: string ,top:string , left:string,width:string,height:string }
    };
    position:{
      scale:number , 
      left:string ,
      top:string,
    }
  };
  
  LeftPlayer: { top: string; left: string };
  RightPlayer: { top: string; right: string };
  BottomPlayer: { bottom: string; left: string };
  PlayerImageWidth: number;
  DetailScoreColor: string;
}
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
