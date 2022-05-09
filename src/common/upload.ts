/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from "./request";
import FileChunk from "./FileChunk";
import { transUrlParams } from "./utils/UrlUtil";
export type UploadOptionType = {
  maxRunSize: number; //最大请求并行数  默认6
  onProgress?: (progressEvent: any) => void; //上传进度函数
  isChunk?: boolean; //是否分块上传， 默认true
  chunkSize?: number; //分块大小 默认5 * 1024 * 1024
};
const DEFAULT_CHUNK_SIZE: number = 5 * 1024 * 1024;
const DEFAULT_IS_CHUNK = true;
const DEFAULT_MAX_RUN_SIZE = 6;

export async function upload(file: File, options: UploadOptionType) {
  if (file.size === 0) return;
  const {
    maxRunSize = DEFAULT_MAX_RUN_SIZE,
    onProgress,
    isChunk = DEFAULT_IS_CHUNK,
    chunkSize = DEFAULT_CHUNK_SIZE,
  } = options;
  const fileChunk = new FileChunk(file, { chunkSize, isChunk });
  const promiseFiles = await fileChunk.getFileChunks();

  let allLoaded = 0; //已完成size
  const runMap = new Map<number,Promise<void>>();//用来存放运行中接口的Map
  let cursor = -1; //指针位置
  //进度条总事件
  const onAllProgress = (realSize:number) => {
    let preLoaded = 0
    return (progressEvent: any) => {
      const { loaded, total } = progressEvent;
      const diffSize = total - realSize
      if (loaded === total) {
        allLoaded  -= diffSize
      }
      allLoaded += loaded - preLoaded;
      preLoaded = loaded
      onProgress && onProgress({ loaded: allLoaded, total: file.size });
    };
  };
  const next = async (index: number) => {
    if (cursor >= promiseFiles.length) return;
    const file = await promiseFiles[cursor];
    const formData = new FormData();
    formData.append("file", file.file);
    const urlParams = transUrlParams({
      name: file.name,
      no: file.no,
      hash: file.hash,
      size: file.size,
    });
    const onProgressEvent = onAllProgress(file.size)
    runMap.set(
      index,
      axios({
        method: "POST",
        url: "/upload?" + urlParams,
        data: formData,
        onUploadProgress: onProgressEvent,
      }).then((e) => {
        cursor++;
        next(index);
      })
    );
  };
  for (
    let index = 0;
    index < (promiseFiles.length < maxRunSize ? promiseFiles.length : maxRunSize);
    index++
  ) {
    cursor++;
    next(index);
  }
}
