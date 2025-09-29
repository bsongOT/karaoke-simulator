"use client";

import { Article } from "./data-struct/Article";
import { SyncInfo } from "./SyncInfo";
import { Product } from "./types";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util"

export function syllabify(words:string) {
    const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
    const arr = words.match(syllableRegex);
    if (arr) return arr;
    return [words];
}

export function toSylls(sentence:string){
    const words = sentence.split(" ");
    const syllables = [];

    for (let i = 0; i < words?.length; i++){
        const english = /^[A-Za-z]*$/;

        if (english.test(words[i][0])){
            syllables.push(...syllabify(words[i]).map(w => new SyncInfo(w, -1, -1)))
        }
        else{
            syllables.push(...words[i].split("").map(w => new SyncInfo(w, -1, -1)))
        }

        if (i < words.length - 1){
            syllables[syllables.length - 1].word += " ";
        }
    }

    return syllables
}

export function lineSentence(line:string[], to:number = -1){
    if (to > -1) return line.slice(0, to + 1).join("");
    return line.join("");
}

export function toNotes(sentence:string){
    const sign = [".", ",", "!", "?", "？", "。", "「", "」"];
    const refinedSentence = sentence.split("").filter(v => !sign.includes(v)).join("");
    
    return toSylls(refinedSentence)
}

export function lineSentenceWidth(cx:CanvasRenderingContext2D, syncData:Article<SyncInfo>, idx:[number, number], shouldTrim:boolean){
    if (idx[0] < 0 || idx[1] < 0) return 0;
    const sentence = lineSentence(syncData.lineAt(idx[0]).map(si => si.word), idx[1]);
        
    if (shouldTrim) return cx.measureText(sentence.trim()).width;
    return cx.measureText(sentence).width;
}

export function download(url:string, name:string){
    const a = document.createElement("a")
    a.href = url
    a.download = name;
    a.click()
    a.remove()
}

export async function convert(product:Product, canvas:HTMLCanvasElement, draw:(time:number) => void, duration:number, events?:{onProgress?:(progress:{percent: number, message:string}) => void}){
    let message = "";
    const ffmpeg = new FFmpeg()
    const blobs = await getBlobs(canvas, draw, duration, events);
    await ffmpeg.load();
    ffmpeg.on("progress", ({progress}) => {
        events?.onProgress?.({
            percent: Math.min(1, progress),
            message: message
        });
    })
    await ffmpeg.writeFile('music.mp3', await fetchFile(product.music))
    await ffmpeg.writeFile("mr.mp3", await fetchFile(product.mr))
    await ffmpeg.createDir("./scenes")
    for (let i = 0; i < blobs.length; i++){
        await ffmpeg.writeFile(`./scenes/scene${("0000" + i).slice(-5)}.png`, await fetchFile(blobs[i]))
    }
    
    const animationCommand = `-framerate 24 -start_number 1 -i ./scenes/scene%05d.png -c:v libx264 animation.mp4`;
    const singAlongCommand = '-i animation.mp4 -i music.mp3 singalong.mp4';
    const karaokeCommand = "-i animation.mp4 -i mr.mp3 karaoke.mp4"

    message = "(2/4) Converting frames to video..."
    await ffmpeg.exec(animationCommand.split(" "));
    message = "(3/4) Creating a sing-along(music + frames) video..."
    await ffmpeg.exec(singAlongCommand.split(" "));
    message = "(4/4) Creating a karaoke(mr + frames) video..."
    await ffmpeg.exec(karaokeCommand.split(" "));

    const singAlong = await ffmpeg.readFile("singalong.mp4") as Uint8Array<ArrayBuffer>;
    const karaoke = await ffmpeg.readFile("karaoke.mp4") as Uint8Array<ArrayBuffer>;

    return {
        singAlong: new Blob([singAlong.buffer], { type: "video/mp4" }),
        karaoke: new Blob([karaoke.buffer], { type: "video/mp4" }),
        music: product.music!,
        mr: product.mr!,
        syncData: product.dataJson!
    }
}

function toBlobAsync(canvas:HTMLCanvasElement){
    return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve)
    })
}
async function getBlobs(canvas:HTMLCanvasElement, draw:(time:number) => void, duration:number, events?:{onProgress?:(progress:{percent: number, message: string}) => void}){
    const blobs = [] as Blob[];
    const message = "(1/4) Fetching frames...";
    const frameCount = Math.floor(duration * 24);

    for (let i = 0; i < frameCount; i++){
        draw(i / 24);
        const blob = await toBlobAsync(canvas);
        if (blob) blobs.push(blob);
        events?.onProgress?.({
            percent: i / frameCount,
            message: message
        })
    }
    
    return blobs;
}

export async function getSyncDataBlob(syncData:Article<SyncInfo>){
    const syncRes = await fetch("data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(syncData.map(_ => _))));

    return syncRes.blob();
}
export function wait(ms:number){
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    })
}
export function frequencyToNoteName(freq:number) {
    const A4 = 440;
    const noteNames = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];
    const n = Math.round(12 * Math.log2(freq / A4)) + 57; // MIDI note number
    const noteNumber = n % 12;
    const note = noteNames[noteNumber];
    const octave = Math.max(Math.floor(n / 12), 0);
    return { noteNumber, note, octave };
}