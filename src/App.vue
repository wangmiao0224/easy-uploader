<template>
  <input name="avatar" type="file" ref="fileRef" @change="change" />
  <button @click="onUpload">开始上传</button>
  <div class="progress">
    <div
      class="progress-bar"
      :style="{ width: `${(400 * percentRef) / 100}px` }"
    ></div>
    <div class="progress-content">
      <span>{{ loadedRef }}M/{{ totalRef }}M-</span>
      <span>{{ percentRef }}%</span>
    </div>
  </div>
  <div>时间:{{ useTimeRef }}秒</div>
  <div>速度:{{ speed }}M/S</div>
  <button @click="onPause">{{ isPause ? "点击继续" : "点击暂停" }}</button>
  <button @click="onCancel">取消</button>
</template>

<script lang="ts">
import axios, { AxiosRequestConfig } from "axios";
import { defineComponent, ref, computed } from "vue";
import { FileType } from "./core/FileHelper";
// import {upload} from './common/upload'
import Uploader, { ACTION, SourceToken } from "./uploader";
export default defineComponent({
  setup() {
    const fileRef = ref<HTMLElement | null>(null);
    const loadedRef = ref<number>(0);     //已上传数量
    const totalRef = ref<number>(0);      //上传总数
    const useTimeRef = ref<number>(0);   //计时
    let timeSpeed = 1 
    let timer:any = null
    const isPause = ref<boolean>(false); //是否暂停
    const file = ref<File | null>(null); //选中的文件
    //计算上传进度
    const onProgress = (progressEvent: any) => {
      const { loaded, total } = progressEvent;
      loadedRef.value = Math.floor((loaded / (1024 * 1024)) * 100) / 100;
      totalRef.value = Math.floor((total / (1024 * 1024)) * 100) / 100;
    };
    //速度显示
    const speed = computed(() => {
      const res = loadedRef.value / (useTimeRef.value || 1);
      return res.toFixed(2);
    });
    //百分比显示
    const percentRef = computed(() => {
      const result = (loadedRef.value / (totalRef.value || 1)) * 100;
      return result.toFixed(2);
    });
    //暂停token
    const onPauseToken = SourceToken.source();
    //取消token
    const onCancelToken = SourceToken.source()
    const onPause = async () => {
      if (isPause.value === true) {
        const res = await onPauseToken.useSource();
        const { result } = res;
        if (result) {
          timeSpeed = 1
          isPause.value = false;
        }
      } else {
        const res = await onPauseToken.useSource();
        const { result } = res;
        if (result) {
          timeSpeed = 0
          isPause.value = true
        };
      }
    };

    //传入自定义axios
    const axiosInstance = axios;
    axiosInstance.interceptors.request.use(
      (res: AxiosRequestConfig<FileType>) => {
        res.url += "&key=1";
        return res;
      }
    );
    const uploader = Uploader.create({ axiosInstance, isChunk: true });
    //监听上传
    uploader.on(ACTION.UPLOAD, (data) => {
      console.log("已完成NO:" + data.file.no);
    });
    //取消下载事件
    const onCancel = () => {
      onCancelToken.useSource()
      timeSpeed = 1
      clearInterval(timer)
    };

    //开始上传
    const onUpload = () => {
      if (!file.value) return;
       timer = setInterval(() => {
        useTimeRef.value +=timeSpeed;
      }, 1000);
      //开始上传
      uploader
        .upload(file.value, {
          onProgress,
          chunkSize: 1024 * 1024 * 10,
          onPauseToken,
          onCancelToken,
          maxRunSize: 6,
          isMD5: true,
        })
        .then(() => {
          clearInterval(timer)
        });
    };
    const change = async (e: any) => {
      file.value = e.target.files[0];
    };

    return {
      change,
      fileRef,
      loadedRef,
      totalRef,
      percentRef,
      useTimeRef,
      speed,
      onPause,
      isPause,
      onCancel,
      onUpload,
    };
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.progress {
  width: 400px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid green;
  position: relative;
}
.progress .progress-bar {
  position: absolute;
  background-color: green;
  opacity: 0.5;
  height: 30px;
  width: 30px;
}
.progress .progress-content {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
