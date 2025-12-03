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
export function raiseCurrentSyncPitch(syncData:Article<SyncInfo>, time:number, amount:number, rerender:()=>void){
    const sync = syncData.map(_ => _).flat().find(s => s.start <= time && time <= s.end);
    if (!sync) return;
    sync.pitch *= Math.pow(2, amount / 12);
    if (sync.pitch <= 65 || isNaN(sync.pitch)) sync.pitch = 130;
    rerender();
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
export function gotoPrevSync(audio:AudioManager, syncData:Article<SyncInfo>){
    const time = audio.currentTime;
    const syncArr = syncData.map(_ => _).flat();
    const syncIdx = syncArr.findLastIndex(s => s.start <= time);
    if (syncIdx <= 0) return;
    if (syncArr[syncIdx - 1].start < 0) return;
    audio.currentTime = syncArr[syncIdx - 1].start;
}
export function gotoNextSync(audio:AudioManager, syncData:Article<SyncInfo>){
    const time = audio.currentTime;
    const syncArr = syncData.map(_ => _).flat();
    const syncIdx = syncArr.findLastIndex(s => s.start <= time);
    if (syncIdx === -1 || syncIdx + 1 >= syncArr.length) return;
    if (syncArr[syncIdx + 1].start < 0) return;
    audio.currentTime = syncArr[syncIdx + 1].start;
}
export function setCurrentIndexByTime(setCurrentIndex:(idx:[number,number])=>void, syncData:Article<SyncInfo>, time:number){
    const idx = syncData.findIndex(s => s.start <= time && time <= s.end);
    if (idx[1] === -1) return;
    setCurrentIndex(idx);
}