/* eslint-disable @typescript-eslint/ban-types */
import { transUrlParams } from "@/utils";
import { CanEmpty, UploadCallbackArr } from "@/utils/type";
import axios, { AxiosStatic } from "axios";
import { FileType } from "./FileHelper";
//默认参数
const DEFAULT_MAX_RUN_SIZE = 6;

//上传Config
export type UploadConfigType = {
  file: File;
  maxRunSize?: number; //最大请求并行数  默认6
  axiosInstance?: AxiosStatic;
  onProgress?: (progressEvent: any) => void; //上传进度函数
  uploadCallbackArr?: UploadCallbackArr;
};

//执行队列类型
type runQueneType = {
  state: "running" | "finish";
  request: Promise<void>;
};

interface UploadHelperImp {
  maxRunSize: number; //最大并行数
  runQuene: Map<number, runQueneType>; //运行中的队列
  successResolve: any; //全部完成后的resolve
  requestUrl: CanEmpty<string>; //上传URL
  fileArr: (() => Promise<FileType>)[]; //文件列表
  uploadCallbckArr: ((data: any) => void)[]; //每个分片上传成功回调
  loaded: number; //文件上传大小
  tempLoaded: number; //临时大小，暂停后更改进度值
  file: CanEmpty<File>; //用户传入的文件
  pause: boolean; //是否暂停
  cursor: number; //文件上传指针
  axiosInstance: AxiosStatic; //axios实例
  onProgress: CanEmpty<(progressEvent: any) => void>; //进度条事件
  upload: () => void; //每个分片的上传
  run: () => Promise<void>; //开始上传
  onPause: () => void; //暂停
  onUnPause: () => void; //继续
  setConfig: (config: UploadConfigType) => void; //设置
  cancel: () => void; //取消上传
  reset: () => void; //重置状态，但是config还是上次传入的
}

class UploadHelper implements UploadHelperImp {
  maxRunSize!: number;
  runQuene: Map<number, runQueneType> = new Map();
  successResolve: any;
  requestUrl: CanEmpty<string>;
  fileArr: (() => Promise<FileType>)[] = [];
  uploadCallbckArr: ((data: any) => void)[] = [];
  loaded = 0;
  tempLoaded = 0;
  file: CanEmpty<File>;
  pause = false;
  cursor = -1;
  private success = 0;
  private fail = 0;
  axiosInstance!: AxiosStatic;
  onProgress: CanEmpty<(progressEvent: any) => void>;
  constructor(fileArr: (() => Promise<FileType>)[], config: UploadConfigType) {
    this.setConfig(config);
    this.fileArr = fileArr;
  }

  onAllProgress(file: FileType): (progressEvent: any) => void {
    let preLoaded = 0;
    return (progressEvent: any) => {
      const { loaded, total } = progressEvent;
      const diffSize = total - file.size;
      if (loaded === total) {
        this.loaded -= diffSize;
      }
      this.loaded += loaded - preLoaded;
      preLoaded = loaded;
      this.onProgress &&
        this.onProgress({
          ...progressEvent,
          ...{
            loaded: this.pause ? this.tempLoaded : this.loaded,
            total: this.file?.size,
          },
        });
    };
  }

  async upload(index = 0): Promise<void> {
    if (this.pause) return; //暂停返回

    const fileFn = this.fileArr[++this.cursor];
    if (!fileFn) {
      //全部完成
      return;
    }
    const file = await (fileFn && fileFn());

    const formData = new FormData();
    formData.append("file", file.file);
    const onProgressEvent = this.onAllProgress(file);
    const v: runQueneType = {
      state: "running",
      request: this.axiosInstance({
        method: "POST",
        url:
          "/upload?" +
          transUrlParams({
            name: file.name,
            no: file.no,
            size: file.size,
            hash: file.hash,
          }),
        data: formData,
        onUploadProgress: onProgressEvent,
      })
        .then((e) => {
          v.state = "finish";
          this.success++
          this.uploadCallbckArr.forEach((cb) => { 
            cb({ state: "success",data: {success:this.success,fail:this.fail,data:e,file} })
          }
          );
          if (this.success === this.fileArr.length) {
            this.successResolve();
          } else {
            this.upload(index);
          }
        })
        .catch((e) => {
          this.fail++
          this.uploadCallbckArr.map((cb) =>
            cb({ state: "fail", file, data: {success:this.success,fail:this.fail,...e} })
          );
        }),
    };
    this.runQuene.set(index, v);
  }
  run(): Promise<void> {
    return new Promise((res) => {
      this.successResolve = res;
      let index = 0;
      const timerFn = () => {
        if (index < this.maxRunSize) {
          this.upload(index++);
        } else {
          clearInterval(timer);
        }
        return timerFn;
      };
      const timer = setInterval(timerFn(), 1000);
    });
  }
  setConfig(config: UploadConfigType): void {
    const {
      file,
      maxRunSize = DEFAULT_MAX_RUN_SIZE,
      onProgress,
      uploadCallbackArr = [],
      axiosInstance = axios,
    } = config;
    this.uploadCallbckArr = uploadCallbackArr;
    this.file = file;
    this.maxRunSize = maxRunSize;
    this.onProgress = onProgress;
    this.axiosInstance = axiosInstance;
  }

  onPause(): boolean {
    if (this.pause) return false;
    this.pause = !this.pause;
    this.tempLoaded = this.loaded;
    return true;
  }
  onUnPause(): boolean {
    if (!this.pause) {
      return false;
    }
    this.pause = !this.pause;
    this.runQuene.forEach((value, key) => {
      if (value.state === "finish") {
        this.upload(key);
      }
    });
    return true;
  }
  cancel(): void {
    this.reset();
  }
  reset(): void {
      this.cursor = -1;
    this.fileArr = [];
    this.runQuene = new Map();
  }
}

export default UploadHelper;
