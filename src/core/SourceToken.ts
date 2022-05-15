import { Resolve } from "@/utils/type";

export type  SourceType={ 
   token: Promise<SourceReturnType>
   resolve: Resolve<SourceReturnType>
}
export type SourceReturnType = {
   result: boolean,
   message?:string
}

class SourceToken { 
   token: Promise<SourceReturnType>
   resolve!:Resolve<SourceReturnType>
    source(): SourceToken { 
        return new SourceToken()
    }
   constructor() { 
      this.token = new Promise<SourceReturnType>(resolve => { 
         this.resolve = resolve
      }).then(() => { 
         return {
            result: false,
            message:'令牌未被初始化，请正确调用'
         }
      })
   }
   setToken(source: SourceType) { 
      const { token, resolve } = source
         this.token = token
         this.resolve = resolve
   }
   useSource(): Promise<SourceReturnType>{ 
      if (!this.resolve) { 
         throw new Error('令牌已失效')
      }
      this.resolve && this.resolve({result:true})
      return this.token
   }
 }
 const sourceToken = new SourceToken()
export default sourceToken