/* eslint-disable @typescript-eslint/ban-types */
import UploadHelper, { UploadConfigType } from "./core/UploadHelper";
import FileHelper, { FileType, FileConfigType } from "./core/FileHelper";
import SourceToken, { SourceType,SourceReturnType } from "./core/SourceToken";
import type { CanEmpty, Resolve, UploadCallback, UploadCallbackArr } from "./utils/type";

export {
  UploadHelper,
  UploadConfigType,
  FileHelper,
  FileType,
  ConfigType,
  FileConfigType,
  SourceToken,
  STATE,
  ACTION
};

//uploader的Config
type ConfigType = {
  onPausetoken?: typeof SourceToken;
  maxRunSize?: number; //最大请求并行数  默认6
  onProgress?: (progressEvent: any) => void; //上传进度函数
  isChunk?: boolean; //是否分块上传， 默认true
  chunkSize?: number; //分块大小 默认5 * 1024 * 1024,
  useWorker?: boolean,
  maxWorkSize?:number
};

/**
 * 当前上传状态
 * 0-等待状态
 * 1-正在上传
 * 2-上传成功
 * 3-上传失败
 */
enum STATE  { 
  PENDING = 0,
  RUNNING = 1,
  SUCCESS = 2,
  FAIL = 3,
  PAUSE = 4
}

/**
 * 监听钩子事件
 * UPLOAD: 每次上传分片调用
 */
enum ACTION { 
  UPLOAD = 'uploadAction'
}

//创建Uploader实例
function createInstance(defaultConfig: ConfigType = {}): Uploader {
  const uploader = new Uploader(defaultConfig);
  return uploader;
}

interface UploaderImp { 
   onProgress: CanEmpty<Function>;    //用户传入进度事件
   config: ConfigType;                //实例化的时候Config
   state: STATE                       //当前实例的状态
  uploadCallbackArr: UploadCallbackArr//分片upload钩子数组
  create: (config: ConfigType) => void//创建新的实例
  upload: (file: File, config: ConfigType) => void //上传文件
  on: (action: ACTION, callback: UploadCallback) => void //新增钩子事件
  uploadAction:(callback:UploadCallback) => void //增加上传分片钩子事件
}

class Uploader implements UploaderImp {
  public onProgress: CanEmpty<Function>;
  public config!: ConfigType;
  public state: STATE = STATE.PENDING
  public uploadCallbackArr:UploadCallbackArr = []
  constructor(config: ConfigType = {}) {
    this.config = config;
  }
  create(config: ConfigType = {}) {
    return createInstance(config);
  }
  upload(file: File, config?: ConfigType) {
    this.config = Object.assign(this.config, config);

    const { maxRunSize, onProgress, chunkSize, isChunk, onPausetoken,useWorker,maxWorkSize } =
      this.config;
    const uploadConfig: UploadConfigType = {
      maxRunSize,
      onProgress,
      file,
      uploadCallbackArr:this.uploadCallbackArr
    };
    const fileConfig: FileConfigType = {
      chunkSize,
      isChunk,
      useWorker,
      maxWorkSize
    };
    const fileHelper = new FileHelper(file, fileConfig);

    const uploadHelper = new UploadHelper(
      fileHelper.getFileChunks(),
      uploadConfig
    );

    const getResolve = (): SourceType => {
      let resolve!: Resolve<SourceReturnType>;
      const token = new Promise<SourceReturnType>((res) => {
        resolve = res;
      }).then(() => {
        const returnData: SourceReturnType = {
          result: true,
          message:''
        }
        console.log('sop');
        
        if (uploadHelper.pause) {
          returnData.result = uploadHelper.onUnPause()
          returnData.message = '继续下载'
        } else {
          returnData.result = uploadHelper.onPause()
          returnData.message = '暂停下载'
        }
        onPausetoken?.setToken(getResolve());
        return returnData
      });
      return {
        token,
        resolve,
      };
    };

    onPausetoken?.setToken(getResolve());
    return uploadHelper?.run().then(res => { 
      fileHelper.close()
      return res
    });
  }

  //监听函数
  on(action: ACTION, callback:UploadCallback) { 
    this[action](callback)
  }
  uploadAction(callback:UploadCallback) { 
    this.uploadCallbackArr.push(callback)
  }

}

const uploader = createInstance();

export default uploader;
