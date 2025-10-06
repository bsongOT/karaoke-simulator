import { AudioManager } from "./AudioManager.js";
import { Article } from "./data-struct/Article.js";
import { SyncInfo } from "./SyncInfo.js";

export function eraseSync(syncData:Article<SyncInfo>, currentIndex:[number, number], setCurrentIndex:(idx:[number, number])=>void, rerender:()=>void){
    if (currentIndex[0] === 0 && currentIndex[1] === 0) return;

    const prevIndex = syncData.prevIndex(currentIndex);
    setCurrentIndex(prevIndex);
    
    syncData.at(currentIndex).start = -1;
    syncData.at(currentIndex).end = -1;
    syncData.at(currentIndex).pitch = 0;
    syncData.at(prevIndex).start = -1;
    syncData.at(prevIndex).end = -1;
    syncData.at(prevIndex).pitch = 0;

    rerender();
}
export function insertSync(syncData:Article<SyncInfo>, currentIndex:[number, number], setCurrentIndex:(idx:[number, number])=>void, audio:AudioManager, rerender:()=>void){
    const current = syncData.at(currentIndex);
    const prev = syncData.prev(currentIndex);
    
    if (!current) return;
    
    current.start = audio.currentTime;

    if (prev && prev.start >= 0 && (prev.end < 0 || prev.end > current.start)) prev.end = current.start;

    setCurrentIndex(syncData.nextIndex(currentIndex));
    rerender();
}
export function closeSync(syncData:Article<SyncInfo>, currentIndex:[number, number], audio:AudioManager, rerender:()=>void){
    const prev = syncData.prev(currentIndex);

    prev.end = audio.currentTime;

    rerender();
}
export function raiseSyncPitchAt(syncData:Article<SyncInfo>, time:number, amount:number){
    const sync = syncData.map(_ => _).flat().find(s => s.start <= time && time <= s.end);
    if (!sync) return;
    sync.pitch *= Math.pow(2, amount / 12);
    if (sync.pitch <= 65 || isNaN(sync.pitch)) sync.pitch = 130;
    //setSyncChangeTrigger(!syncChangeTrigger)
}
export function togglePlay(audio:AudioManager){
    if (audio.paused) audio.play();
    else audio.pause()
}
export function goBack(audio:AudioManager){
    audio.currentTime--;
}
export function goForward(audio:AudioManager){
    audio.currentTime++;
}