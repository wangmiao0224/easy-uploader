import Worker from '@/work/fileHash.worker'
import type { CanEmpty } from '@/utils/type';
import WorkerManager from './WorkerManager';

//默认参数
const DEFAULT_CHUNK_SIZE: number = 5 * 1024 * 1024;
const DEFAULT_IS_CHUNK = true;
const DEFAULT_USE_WORKER = true
const DEFAULT_MAX_WORK_SIZE = 6

// 文件Config类型
export type FileConfigType = {
  chunkSize: CanEmpty<number>; //分片文件大小
  isChunk: CanEmpty<boolean>; // 是否分
  useWorker?: boolean //是否使用web-worker
  maxWorkSize?:number
};

//文件类型
export type FileType = {
  name: string;
  size: number;
  hash: string;
  no: number;
  file:Blob
};


interface FileHelperImp { 
  file: CanEmpty<File>;           //用户传入文件
  chunkSize:number;               //分片大小
  isChunk:boolean;                //是否分片
  fileChunks: FileType[] ;        //
  workerManager: WorkerManager,   //web-worker管理
  useWorker: boolean,             //是否使用web-worker
  maxWorkSize: number             //最大worker运行数
  getFileChunks: (file: CanEmpty<File>, chunkSize: number) => (() => Promise<FileType>)[] //获取所有的chunk的promise
  setConfig: (config: FileConfigType) => void //设置
  close:()=>void                  //关闭所有的worker
}

/**
 * 因为需要为文件计算hash，这个过程也是比较耗时，所以会用到web-worker
 */
 class FileHepler implements FileHelperImp{
  file: CanEmpty<File>;
  chunkSize = DEFAULT_CHUNK_SIZE;
  isChunk = DEFAULT_IS_CHUNK;
  fileChunks: FileType[] = [];
  workerManager: WorkerManager;
  useWorker!: boolean;
  maxWorkSize!: number;
  constructor(file:File,config?: FileConfigType) {
    this.setConfig(config)
    this.file = file
    this.workerManager = new WorkerManager(Worker,6)
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
  ):(()=>Promise<FileType>)[] {
    if (!file) { 
      throw new Error('未找到文件，通过setConfig方法设置文件')
    }
    const BlobSLice = File.prototype.slice;
    const chunkNum = Math.ceil(file.size / chunkSize);
    
    const promiseArr: (()=>Promise<FileType>)[] = new Array(chunkNum).fill(0).map((item, index) => {
        const chunk = BlobSLice.apply(file, [
          index * chunkSize,
          (index + 1) * chunkSize > file.size
            ? file.size
            : (index + 1) * chunkSize,
        ]);
        const result: FileType = {
          name: file.name,
          size: chunk.size,
          hash: '',
          no: index,
          file:chunk
        };
        return ()=>this.workerManager.postMessage([result,chunk]).then(e=>e.data)
        });
    return promiseArr
  }

  /**
   * 设置文件
   * @param file 
   */
  setConfig(config?: FileConfigType):void { 
    const { chunkSize , isChunk =DEFAULT_IS_CHUNK ,useWorker = DEFAULT_USE_WORKER,maxWorkSize =DEFAULT_MAX_WORK_SIZE } = config || {};
    this.chunkSize = chunkSize|| DEFAULT_CHUNK_SIZE;
    this.isChunk = isChunk || false;
    this.useWorker = useWorker
    this.maxWorkSize = maxWorkSize
    
  }
  //关闭所有的worker
  close():void { 
    this.workerManager.terminate()
  }
}




export default FileHepler