import SparkMD5 from "spark-md5";

export type UploadConfig = {
  chunkSize: number; //分片文件大小
  isChunk: boolean; // 是否分
};
export type ChunkFileType = {
  name: string;
  size: number;
  hash: string;
  hashNo: number;
  chunk: Blob;
};

export default class Upload {
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
  ): Promise<ChunkFileType[]> {
    const BlobSLice = File.prototype.slice;
    const chunkNum = Math.ceil(file.size / chunkSize);
    const spark = new SparkMD5.ArrayBuffer()
    const promiseArr: Promise<ChunkFileType>[] = new Array(chunkNum).fill(0).map((item, index) => {
      const fileReader = new FileReader();
        return new Promise<ChunkFileType>((resolve) => {
          fileReader.onload = (e) => {
            const res = e.target?.result;
            spark.append(res as ArrayBuffer);
            const result: ChunkFileType = {
              name: file.name,
              size: chunk.size,
              hash: spark.end(),
              hashNo: index,
              chunk: chunk,
            };
            console.log(result);
            resolve(result);
          };
          const chunk = BlobSLice.apply(file, [
            index * chunkSize,
            (index + 1) * chunkSize > file.size
              ? file.size
              : (index + 1) * chunkSize,
          ]);
          console.log(chunk,index);
          
          fileReader.readAsArrayBuffer(chunk);
        });
      });
    
    return Promise.all<ChunkFileType>(promiseArr)
  }
}
