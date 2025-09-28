import { AudioManager } from "./AudioManager.js";
import { Article } from "./data-struct/Article.js";
import { SyncInfo } from "./SyncInfo.js";

export function eraseSync(syncData:Article<SyncInfo>, currentIndex:[number, number], setCurrentIndex:(idx:[number, number])=>void, rerender:()=>void){
    if (currentIndex[0] === 0 && currentIndex[1] === 0) return;

    const prevIndex = syncData.prevIndex(currentIndex);
    setCurrentIndex(prevIndex);
    
    syncData.at(currentIndex).start = -1;
    syncData.at(currentIndex).end = -1;
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

    if (prev && (prev.end < 0 || prev.end > current.start)) prev.end = current.start;

    setCurrentIndex(syncData.nextIndex(currentIndex));
    rerender();
}
export function closeSync(syncData:Article<SyncInfo>, currentIndex:[number, number], audio:AudioManager, rerender:()=>void){
    syncData.prev(currentIndex).end = audio.currentTime;

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