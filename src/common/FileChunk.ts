import SparkMD5 from "spark-md5";

export type UploadConfig = {
  chunkSize?: number; //分片文件大小
  isChunk?: boolean; // 是否分
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
  chunkSize = 5 * 1024 * 1024;
  isChunk = false;
  fileChunks: ChunkFileType[] = [];
  constructor(file: File, config: UploadConfig = {}) {
    const { chunkSize, isChunk } = config;
    this.chunkSize = chunkSize || this.chunkSize;
    this.isChunk = isChunk || false;
    this.file = file;
  }

  getFileChunks(
    file: File = this.file,
    chunkSize: number = this.chunkSize
  ):Promise<ChunkFileType[]> {
    return new Promise((resolve) => {
      if (file.size < chunkSize) resolve(this.fileChunks);
      const BlobSLice = File.prototype.slice;
      const chunkNum = Math.ceil(file.size / chunkSize);
      let currentChunkIndex = 0;
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        
        const chunk = e.target?.result;
        spark.append(chunk as ArrayBuffer);
        if (currentChunkIndex < chunkNum) {
          const res = loadNext();
          res.hash = spark.end();
          this.fileChunks.push(res);
        } else {
          resolve(this.fileChunks)
        }
      };
      function loadNext(): ChunkFileType {
        currentChunkIndex++;
        const chunk = BlobSLice.apply(file, [
          currentChunkIndex * chunkSize,
          (currentChunkIndex + 1) * chunkSize > file.size
            ? file.size
            : (currentChunkIndex + 1) * chunkSize,
        ]);
        fileReader.readAsArrayBuffer(chunk);
        return {
          name: file.name,
          size: chunk.size,
          hash: "",
          hashNo: currentChunkIndex,
          chunk: chunk,
        };
      }
      loadNext()
    });
  }
}
