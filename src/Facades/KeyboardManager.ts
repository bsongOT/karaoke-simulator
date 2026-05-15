export class KeyboardManager {
    constructor(
        // private keyStates:{
            
        // },
        // private syncDataRef:{current: Article<SyncInfo>},
        // private audio:AudioManager
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