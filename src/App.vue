<template>
  <input name="avatar" type="file" ref="fileRef" @change="change" />
  <button @click="onUpload">开始下载</button>
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
  <button @click="onPause">{{isPause?'点击继续':'点击暂停'}}</button>
  <button @click="onCancel">取消</button>
</template>

<script lang="ts">
import axios, { AxiosRequestConfig } from "axios";
import { defineComponent, ref, computed } from "vue";
import { FileType } from "./core/FileHelper";
// import {upload} from './common/upload'
import Uploader, { ACTION, SourceToken } from "./uploader";
import easyUploader from 'easy-uploader.js'
export default defineComponent({
  setup() {
    const fileRef = ref<HTMLElement | null>(null);
    const loadedRef = ref<number>(0);
    const totalRef = ref<number>(0);
    const useTimeRef = ref<number>(0);
    const isPause = ref<boolean>(false)
    const file = ref<File|null>(null)
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

    const onPausetoken = SourceToken.source();
    const onPause = async () => {
      if(isPause.value === true){
        const res = await onPausetoken.useSource()
        const {result} = res
        if(result) isPause.value = false;
      }else{
        const res = await onPausetoken.useSource()
       const {result} = res
        if(result) isPause.value = true;
        
      }
      
    };
    const axiosInstance = axios
    axiosInstance.interceptors.request.use((res:AxiosRequestConfig<FileType>)=>{
      res.url+='&key=1'
      return res
})
    const uploader = Uploader.create({axiosInstance,isChunk:true});
    //监听上传
     uploader.on(ACTION.UPLOAD, (data) => {
         console.log('已完成NO:'+data.file.no);
      });
    const onCancel = ()=>uploader.cancel()
    const onUpload = ()=>{
      if(!file.value) return
      const onProgress = (progressEvent: any) => {
        const { loaded, total } = progressEvent;
        loadedRef.value = Math.floor((loaded / (1024 * 1024)) * 100) / 100;
        totalRef.value = Math.floor((total / (1024 * 1024)) * 100) / 100;
      };
      const timer = setInterval(() => {
        useTimeRef.value++;
      }, 1000);
       //开始上传
      uploader
        .upload(file.value, {
          onProgress,
          chunkSize: 1024 * 1024 * 10,
          onPausetoken,
          maxRunSize: 6,
          isMD5:false
        })
        .then(() => {
          clearInterval(timer);
        });
    }
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
      onUpload
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
