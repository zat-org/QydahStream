export const useSleep = () => {
  const sleep =(ms:number)=>{
    return new Promise(resolve => setTimeout(resolve, ms));
  }
return {sleep}
}

