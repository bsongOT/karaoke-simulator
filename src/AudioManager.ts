class AudioInfo {
    private __pausedTime = 0;
    private __rateChangedTime = 0;
    private __rateChangedAudioTime = 0;
    private __paused = true;
    public get paused(){
        return this.__paused;
    }
    private constructor(
        private audioContext:AudioContext,
        private audioBuffer:AudioBuffer,
        private source:AudioBufferSourceNode,
        private gain:GainNode
    ){}
    public static async create(blob:Blob, audioContext:AudioContext){
        const buffer = await blob.arrayBuffer().then(b => audioContext.decodeAudioData(b));
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gain = audioContext.createGain();
        gain.gain.value = 1;
        source.connect(gain).connect(audioContext.destination);
        const audioInfo = new AudioInfo(audioContext, buffer, source, gain);

        return audioInfo;
    }
    public get duration(){
        return this.audioBuffer.duration;
    }
    public get volume(){
        return this.gain.gain.value;
    }
    public set volume(v){
        this.gain.gain.value = v;
    }
    public get playbackRate(){
        return this.source.playbackRate.value;
    }
    public set playbackRate(v){
        this.__rateChangedTime = this.audioContext.currentTime;
        this.__rateChangedAudioTime = this.currentTime;
        this.source.playbackRate.value = v;
    }
    public get currentTime(){
        if (this.__paused) {
            return Math.min(this.duration, this.__rateChangedAudioTime + this.playbackRate * (this.__pausedTime - this.__rateChangedTime));
        }

        return Math.min(this.duration, this.__rateChangedAudioTime + this.playbackRate * (this.audioContext.currentTime - this.__rateChangedTime));
    }
    public set currentTime(v){
        if (v < 0) return;
        if (v > this.duration) return;
        this.__rateChangedTime = this.audioContext.currentTime;
        this.__rateChangedAudioTime = v;
        if (this.paused){
            this.__pausedTime = this.__rateChangedTime;
        }
        else {
            this.pause();
            this.play();
        }
    }
    public play(){
        if (!this.paused) return;
        const currentTime = this.currentTime;
        this.__paused = false;
        this.__rateChangedTime = this.audioContext.currentTime;
        this.__rateChangedAudioTime = currentTime;
        this.reloadSource();
        this.source.start(this.audioContext.currentTime, currentTime);
    }
    public pause(){
        this.__paused = true;
        this.__pausedTime = this.audioContext.currentTime;
        this.source.stop();
        this.source.disconnect();
    }
    private reloadSource(){
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.playbackRate.value = this.playbackRate;
        source.connect(this.gain).connect(this.audioContext.destination);
        this.source = source;
    }
}
export class AudioManager {
    private list:AudioInfo[] = [];
    public get duration(){
        return Math.max(...this.list.map(l => l.duration));
    }
    public get currentTime(){
        if (this.list.length <= 0) return 0;
        return this.list[0].currentTime;
    }
    public set currentTime(v){
        for (const l of this.list){
            l.currentTime = v;
        }
    }
    public get playbackRate(){
        if (this.list.length <= 0) return 1;
        return this.list[0].playbackRate;
    }
    public set playbackRate(v){
        for (const l of this.list){
            l.playbackRate = v;
        }
    }
    public get volume(){
        return this.list.map(l => l.volume);
    }
    public get paused(){
        if (this.list.length <= 0) return true;
        return this.list[0].paused;
    }
    public constructor(private audioContext:AudioContext){}
    public async register(blob:Blob){
        this.list.push(await AudioInfo.create(blob, this.audioContext));
        if (!this.paused){
            this.list[this.list.length - 1].currentTime = this.currentTime;
            this.list[this.list.length - 1].play();
        }
    }
    public play(){
        if (!this.paused) return;
        for (const i of this.list) i.play();
    }
    public pause(){
        for (const i of this.list) i.pause();
    }
    public setVolume(index:number, volume:number){
        this.list[index].volume = volume;
    }
}