import Worker from '@/work/fileHash.worker'
import type { CanEmpty } from '@/utils/type';
export type FileConfigType = {
  chunkSize: CanEmpty<number>; //分片文件大小
  isChunk: CanEmpty<boolean>; // 是否分
};
export type FileType = {
  name: string;
  size: number;
  hash: string;
  no: number;
  file:Blob
};
const DEFAULT_CHUNK_SIZE: number = 5 * 1024 * 1024;
const DEFAULT_IS_CHUNK = true;
export default class FileHepler {
  file: CanEmpty<File>;
  chunkSize = DEFAULT_CHUNK_SIZE;
  isChunk = DEFAULT_IS_CHUNK;
  fileChunks: FileType[] = [];
  constructor(file:File,config?: FileConfigType) {
    this.setConfig(config)
    this.file = file
  }

  /**
   * 获取文件分片的Promise
   * @param file  文件流
   * @param chunkSize  分片文件大小
   * @returns  因为hash操作比较慢，所以采用Worker进行处理，返回Promise
   */
  getFileChunks(
    file: CanEmpty<File> = this.file,
    chunkSize: number = this.chunkSize
  ): Promise<FileType>[] {
    if (!file) { 
      throw new Error('未找到文件，通过setConfig方法设置文件')
    }
    const BlobSLice = File.prototype.slice;
    const chunkNum = Math.ceil(file.size / chunkSize);
    
    const promiseArr: Promise<FileType>[] = new Array(chunkNum).fill(0).map((item, index) => {
        const chunk = BlobSLice.apply(file, [
          index * chunkSize,
          (index + 1) * chunkSize > file.size
            ? file.size
            : (index + 1) * chunkSize,
        ]);
        let worker = new Worker()
      return new Promise(resolve => { 
        worker.onmessage = function (e: any) { 
            const hash = e.data
            const result: FileType = {
              name: file.name,
              size: chunk.size,
              hash: hash,
              no: index,
              file:chunk
            };
          resolve(result)
          worker = null
          }
          worker.postMessage([chunk])
      })
      
        });
    return promiseArr
  }

  /**
   * 设置文件
   * @param file 
   */
  setConfig(config?: FileConfigType):void { 
    const { chunkSize = DEFAULT_CHUNK_SIZE, isChunk =DEFAULT_IS_CHUNK } = config || {};
    this.chunkSize = chunkSize;
    this.isChunk = isChunk || false;
    
  }
}
