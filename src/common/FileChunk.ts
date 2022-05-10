import Worker from '@/work/fileHash.worker'
export type UploadConfig = {
  chunkSize: number; //分片文件大小
  isChunk: boolean; // 是否分
};
export type ChunkFileType = {
  name: string;
  size: number;
  hash: string;
  no: number;
  file:Blob
};
export default class FileChunk {
  file: File;
  chunkSize: number;
  isChunk = false;
  fileChunks: ChunkFileType[] = [];
  constructor(file: File, config: UploadConfig) {
    const { chunkSize, isChunk } = config;
    this.chunkSize = chunkSize;
    this.isChunk = isChunk || false;
    this.file = file;
  }

  getFileChunks(
    file: File = this.file,
    chunkSize: number = this.chunkSize
  ): Promise<ChunkFileType>[] {
    const BlobSLice = File.prototype.slice;
    const chunkNum = Math.ceil(file.size / chunkSize);
    
    const promiseArr: Promise<ChunkFileType>[] = new Array(chunkNum).fill(0).map((item, index) => {
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
            const result: ChunkFileType = {
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
}
