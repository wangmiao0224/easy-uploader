<template>
  <input name='avatar' type="file" ref="fileRef" @change="change" />
  <div class="progress">
    <div class="progress-bar" :style="{width:`${400 * percentRef/100 }px`}"></div>
    <div class="progress-content">
      <span>{{loadedRef}}M/{{totalRef}}M-</span>
      <span>{{percentRef}}%</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref,computed } from "vue";
import {upload} from './common/upload'
export default defineComponent({
  setup() {
    const fileRef = ref<HTMLElement | null>(null)
     const loadedRef = ref<number>(0)
     const totalRef = ref<number>(0)
     const percentRef = computed(()=>{
       const result = (loadedRef.value/(totalRef.value||1)) * 100
       return result.toFixed(2)
     })
    const change = async  (e: any) => {
      const file = e.target.files[0];
      const onProgress = (progressEvent:any)=>{
        const {loaded,total } = progressEvent
        loadedRef.value = Math.floor(loaded /(1024 * 1024) *100) /100
        totalRef.value = Math.floor(total /(1024 * 1024) *100) /100
        
      }
      upload(file,{maxRunSize:6,onProgress,chunkSize:1024*1024*20});
    };

    return {
      change,
      fileRef,
      loadedRef,
      totalRef,
      percentRef
    };
  }
 
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
.progress{
  width: 400px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid green;
  position: relative;
}
.progress .progress-bar{
  position: absolute;
  background-color:green;
  opacity: 0.5;
  height:30px;
  width: 30px;
}
.progress .progress-content{
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%)
}
</style>
