import axios from "./request";
import type { ChunkFileType } from "./FileChunk";
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function upload(files: ChunkFileType[], maxSize = 6) {
  if (files.length === 0) return;
  console.log(files.length);
  

  if (files.length <= maxSize) {
    const filesPromise = files.map((data) => {
      const formData = new FormData();
      formData.append("name", `${data.name}-${data.hash}-${data.hashNo}`);
      formData.append("fileName", data.name);
      formData.append("hash", data.hash);
      formData.append("chunk", data.chunk);
      return axios({
        method:'POST',
        url: "/upload",
        data: formData,
      });
    });
    Promise.all(filesPromise).then((e) => {
      //合并
    });
  } else {
    let index = maxSize;
    const requestMap = new Map<number, Promise<void>>();
    const next = (cursor:number,data:ChunkFileType) => {
      const formData = new FormData();
      formData.append("name", `${data.name}-${data.hash}-${data.hashNo}`);
      formData.append("fileName", data.name);
      formData.append("hash", data.hash);
      formData.append("chunk", data.chunk);
      requestMap.set(
        cursor,
        axios({
          method:'POST',
          url: "/upload",
          data: formData,
        }).then((e) => {
          if (index < maxSize - 1) { 
            next(cursor,files[index++]);
          }
        })
      );
    }
    for (let cursor = 0; cursor < maxSize; cursor++) {
      next(cursor,files[cursor]);
    }

    
  }

  
}
