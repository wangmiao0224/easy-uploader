/* eslint-disable @typescript-eslint/ban-types */
import UploadHelper, { UploadConfigType } from './core/UploadHelper'
import FileHelper, { FileType, FileConfigType } from './core/FileHelper'
import SourceToken from './core/SourceToken'
import type { CanEmpty } from './utils/type'

export { 
  UploadHelper,
  UploadConfigType,
  FileHelper,
  FileType,
  ConfigType,
  FileConfigType,
  SourceToken
}

type ConfigType = {
  sourceToken?:typeof SourceToken
  maxRunSize?: number; //最大请求并行数  默认6
  onProgress?: (progressEvent: any) => void; //上传进度函数
  isChunk?: boolean; //是否分块上传， 默认true
  chunkSize?: number; //分块大小 默认5 * 1024 * 1024,
} 

function createInstance(defaultConfig: ConfigType = {}):Uploader { 
  const uploader = new Uploader(defaultConfig)
  return uploader
}

class Uploader { 
  public success: CanEmpty<Function>
  public onProgress: CanEmpty<Function>
  public config!:ConfigType
  constructor(config: ConfigType = {}) { 
      this.config = config
  }
  create(config: ConfigType = {}) { 
    return createInstance(config)
  }
  upload(file: File, config?: ConfigType) { 
    this.config = Object.assign(this.config, config)
    
    const { maxRunSize, onProgress,chunkSize,isChunk,sourceToken } = this.config
    const uploadConfig: UploadConfigType = {
      maxRunSize,onProgress,file
    }
    const fileConfig: FileConfigType = {
      chunkSize,isChunk
    }
    const fileHelper = new FileHelper(file, fileConfig)
    
    const uploadHelper = new UploadHelper(fileHelper.getFileChunks(), uploadConfig)
    sourceToken?.setPause(() => { 
        uploadHelper.onPause()
    })
    return uploadHelper?.run()
  }
} 






const uploader = createInstance()


export default uploader