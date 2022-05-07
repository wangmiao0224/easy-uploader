import axios from 'axios'
import type { AxiosInstance , AxiosRequestConfig } from 'axios'

const axiosInstance: AxiosInstance = axios.create()

// eslint-disable-next-line @typescript-eslint/no-empty-function
axiosInstance.interceptors.request.use((res:AxiosRequestConfig)=>{
  return res
})

axiosInstance.interceptors.response.use((res: AxiosRequestConfig) => { 
  return res
})

export default axiosInstance
