import { AudioManager } from "@/AudioManager";
import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { Shortcut } from "@/types";

export class KeyboardManager {
    constructor(
        private keyStates:{
            
        },
        private syncDataRef:{current: Article<SyncInfo>},
        private audio:AudioManager
    ){
        document.addEventListener("keydown", this.handleKey);
        document.addEventListener("keyup", this.handleKeyUp);
    }
    private handleKey(e:KeyboardEvent){

    }
    private handleKeyUp(e:KeyboardEvent){

    }
    public quit(){

    }
}