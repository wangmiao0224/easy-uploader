<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
  <input type="file" ref="fileRef" @change="change" />
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
import FileChunk from "./common/FileChunk";
import {upload} from './common/upload'
export default defineComponent({
  setup() {
    const fileRef = ref<HTMLElement | null>(null);
    const change = async  (e: any) => {
      const file = e.target.files[0];
      const fileChunk = new FileChunk(file,{chunkSize: 1024 *1024});
      const chunks = await fileChunk.getFileChunks()
      console.log(chunks);
      upload(chunks,1);
    };

    return {
      change,
      fileRef,
    };
  },
  components: {
    HelloWorld,
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
</style>
