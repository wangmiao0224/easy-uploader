<template>
  <input name="avatar" type="file" ref="fileRef" @change="change" />
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
// import {upload} from './common/upload'
import Uploader, { ACTION, SourceToken } from "./uploader";
export default defineComponent({
  setup() {
    const fileRef = ref<HTMLElement | null>(null);
    const loadedRef = ref<number>(0);
    const totalRef = ref<number>(0);
    const useTimeRef = ref<number>(0);
    const isPause = ref<boolean>(false)
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
    const change = async (e: any) => {
      const file = e.target.files[0];
      const onProgress = (progressEvent: any) => {
        const { loaded, total } = progressEvent;
        loadedRef.value = Math.floor((loaded / (1024 * 1024)) * 100) / 100;
        totalRef.value = Math.floor((total / (1024 * 1024)) * 100) / 100;
      };
      const timer = setInterval(() => {
        useTimeRef.value++;
      }, 1000);

      const uploader = Uploader.create();
      //监听上传
      uploader.on(ACTION.UPLOAD, (data) => {
        // console.log(data);
      });

      //开始上传
      uploader
        .upload(file, {
          onProgress,
          chunkSize: 1024 * 1024 * 10,
          onPausetoken,
          maxRunSize: 6,
        })
        .then(() => {
          clearInterval(timer);
        });
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
      isPause
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
