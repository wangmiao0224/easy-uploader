/* eslint-disable @typescript-eslint/ban-types */
import { transUrlParams } from "@/utils";
import { CanEmpty } from "@/utils/type";
import axios, { CancelTokenSource } from "axios";
import { FileType } from "./FileHelper";



export type UploadConfigType = {
    file:File,
    maxRunSize?: number; //最大请求并行数  默认6
    onProgress?: (progressEvent: any) => void; //上传进度函数
  };


const DEFAULT_MAX_RUN_SIZE = 6;
class UploadHelper { 
    maxRunSize: number = DEFAULT_MAX_RUN_SIZE ; //最大并行数
    runMap: Map<number, Promise<void>> = new Map()  //运行中Map
    cancelMap: Map<number, () => void> = new Map()   //cancelToken Map
    successResolve:any
    requestUrl:CanEmpty<string>
    fileArr: Promise<FileType>[] = []  //文件列表
    loaded = 0 //文件上传大小
    tempLoaded = 0 //临时大小，暂停后更改进度值
    file: CanEmpty<File>
    pause = false //是否暂停
    onProgress:CanEmpty<(progressEvent:any)=>void>
    constructor(fileArr:Promise<FileType>[],config:UploadConfigType) {
        this.setConfig(config)
        this.fileArr = fileArr
     }

    onAllProgress(file: FileType,cancelSource:CancelTokenSource): (progressEvent: any) => void {
        let preLoaded = 0
        return (progressEvent: any) => {
          const { loaded, total } = progressEvent;
          const diffSize = total - file.size
          if (loaded === total) {
              this.loaded -= diffSize
              this.tempLoaded += (total-diffSize)
          }
          this.loaded += loaded - preLoaded;
          preLoaded = loaded
            this.onProgress && this.onProgress({ ...progressEvent, ...{ loaded: this.loaded, total: this.file?.size } });
        };
      };

    async upload(index: number):Promise<void> {
        const file = await this.fileArr.shift()
        if (!file) { 
            this.successResolve()
            return
        }
        const formData = new FormData()
        formData.append('file', file.file)
        const cancelSource = axios.CancelToken.source()
        const onProgressEvent = this.onAllProgress(file,cancelSource)
        this.runMap.set(index,
            axios({
                method: "POST",
                url: "/upload?" + transUrlParams({
                    name: file.name,
                    no: file.no,
                    size: file.size,
                    hash:file.hash
                }),
                data: formData,
                cancelToken:cancelSource.token,
                onUploadProgress:onProgressEvent,
            }).then((e) => this.upload(index)))
        this.cancelMap.set(index, () => {
            cancelSource.cancel();
            this.fileArr.unshift(Promise.resolve(file))
        })
    }
    run():Promise<void>{ 
        return new Promise(res => { 
            for (
                let index = 0;
                index < (this.fileArr.length < this.maxRunSize ? this.fileArr.length : this.maxRunSize);
                index++
              ) {
                this.upload(index);
                this.successResolve = res
              }
        })
        
    }
    setConfig(config:UploadConfigType):void { 
        const { file,maxRunSize = DEFAULT_MAX_RUN_SIZE,onProgress } = config
        this.file = file
        this.maxRunSize = maxRunSize
        this.onProgress = onProgress
    }

    onPause():void { 
        this.pause = !this.pause
        if (this.pause) {
            this.cancelMap.forEach(item => {
                item()
            })
        } else { 
            this.runMap.forEach((value, key) => { 
                this.upload(key)
            })
            this.loaded = this.tempLoaded
        }
    }
}

export default UploadHelper

