export class SyncInfo{
    word:string;
    start:number;
    end:number;
    pitch:number;

    constructor(word:string, start:number, end:number, pitch:number = 0){
        this.word = word;
        this.start = start;
        this.end = end;
        this.pitch = pitch;
    }
}