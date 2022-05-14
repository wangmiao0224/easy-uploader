
export type CanEmpty<T> = T | undefined |null

export type Resolve<T> = (value: T | PromiseLike<T>) => void

export type UploadCallbackArr = UploadCallback[]
export type UploadCallback = (data: any) => void