/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from "./request";
import  FileChunk from "./FileChunk";
export type UploadOptionType = {
  maxRunSize: number, //最大请求并行数  默认6
  onProgress?: (progressEvent: any) => void; //上传进度函数
  isChunk?: boolean; //是否分块上传， 默认true
  chunkSize?:number; //分块大小 默认5 * 1024 * 1024
}
const DEFAULT_CHUNK_SIZE: number = 5 * 1024 * 1024
const DEFAULT_IS_CHUNK = true
const DEFAULT_MAX_RUN_SIZE = 6


export async function upload(file:File, options: UploadOptionType) {
  if (file.size === 0) return;
  console.log(file.size);
  
  const { maxRunSize=DEFAULT_MAX_RUN_SIZE, onProgress, isChunk = DEFAULT_IS_CHUNK, chunkSize = DEFAULT_CHUNK_SIZE} = options;
  const fileChunk = new FileChunk(file,{chunkSize,isChunk});
  const files = await fileChunk.getFileChunks()
  
  let allLoaded = 0 //已完成size
  //进度条总事件
  const onAllProgress = (progressEvent: any) => {
    const { loaded, total } = progressEvent
    const diff = total > files[0].size ? total - files[0].size : 0
    if (loaded === total) {
      allLoaded += (total - diff)
      onProgress && onProgress({ loaded: allLoaded, total: file.size });
    } else { 
      onProgress && onProgress({ loaded: allLoaded + loaded - diff, total: file.size });
    }
  }

  const runMap = new Map()
  let cursor = -1
  const next = (index: number) => {
    if (cursor >= files.length) return

    
    
    const formData = new FormData();
    formData.append("name", `${files[cursor].name}-${files[cursor].hash}-${files[cursor].hashNo}`);
    formData.append("fileName", files[cursor].name);
    formData.append("hash", files[cursor].hash);
    formData.append("chunk", files[cursor].chunk);
    console.log(cursor,formData);
   runMap.set(
      index,
      axios({
        method:'POST',
        url: "/upload",
        data: formData,
        onUploadProgress:onAllProgress
      }).then((e) => {
          cursor++
          next(index);
      })
    );
  }
  for (let index = 0; index < (files.length < maxRunSize ? files.length : maxRunSize); index++ ) {
    cursor++
    next(index);
  }
}
