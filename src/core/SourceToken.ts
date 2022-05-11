import { CanEmpty } from "@/utils/type";

 class SourceToken { 
    cancel!: () => void
    pause!: () => void
    
    source():SourceToken { 
        return new SourceToken()
    }
     setPause(onPause:any) { 
        this.pause = onPause
     }
     setCancel(onCancel:any) { 
        this.cancel = onCancel
     }
 }
 const sourceToken = new SourceToken()
export default sourceToken