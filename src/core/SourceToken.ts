import { CanEmpty,Resolve } from "@/utils/type";

export type  SourceType={ 
   token: Promise<void>
   resolve: Resolve<void> | null
}

class SourceToken { 
   token: CanEmpty<Promise<void>>
   resolve:CanEmpty<Resolve<void>>
    pause!: () => void
    
    source(): SourceToken { 
        return new SourceToken()
    }
   setToken(source: SourceType) { 
      const { token, resolve } = source
      if (!this.token) { 
         this.token = token
         this.resolve = resolve
      }
   }
   useSource() { 
      if (this.token) this.resolve && this.resolve()
      this.token = null
      this.resolve = null
   }
 }
 const sourceToken = new SourceToken()
export default sourceToken