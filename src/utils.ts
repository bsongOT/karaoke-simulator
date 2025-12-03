"use client";

import { Article } from "./data-struct/Article";
import { SyncInfo } from "./SyncInfo";
import { Product } from "./types";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util"
import lamejs from "@breezystack/lamejs";

export function syllabify(words:string) {
    const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
    const arr = words.match(syllableRegex);
    if (arr) return arr;
    return [words];
}

export function toSylls(sentence:string){
    const words = sentence.split(" ");
    const syllables = [] as SyncInfo[];

    for (let i = 0; i < words?.length; i++){
        const english = /^[A-Za-z]*$/;

        if (english.test(words[i][0])){
            syllables.push(...words[i].split("~").map(
                (part, idx) => [
                    ...(idx > 0 ? [new SyncInfo("~", -1, -1)] : []),
                    ...syllabify(part)
                    .map(w => new SyncInfo(w, -1, -1))
                ]
                )
                .flat()
            )
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

type ConvertOptions = {
    onProgress?:(progress:{percent: number, message:string}) => void,
    includesMusic?:boolean,
    includesMR?:boolean,
    includesSingAlong?:boolean,
    includesData?:boolean
}
export async function convert(product:Product, syncData:Article<SyncInfo>, canvas:HTMLCanvasElement, draw:(time:number) => void, duration:number, options?:ConvertOptions){
    let message = "";
    const ffmpeg = new FFmpeg();
    const melody = await generateMelodies(syncData, duration, options?.onProgress);
    const blobs = await getBlobs(canvas, draw, duration, options);
    await ffmpeg.load();
    ffmpeg.on("progress", ({progress}) => {
        options?.onProgress?.({
            percent: Math.min(1, progress),
            message: message
        });
    })
    ffmpeg.on("log", e => console.log(e.message));

    await ffmpeg.writeFile('melody.mp3', await fetchFile(melody));
    await ffmpeg.writeFile('music.mp3', await fetchFile(product.music));
    await ffmpeg.writeFile("mr.mp3", await fetchFile(product.mr));
    await ffmpeg.createDir("./scenes");
    for (let i = 0; i < blobs.length; i++){
        await ffmpeg.writeFile(`./scenes/scene${("0000" + i).slice(-5)}.png`, await fetchFile(blobs[i]))
    }
    
    const animationCommand = `-framerate 24 -start_number 1 -i ./scenes/scene%05d.png -c:v libx264 animation.mp4`;
    const singAlongCommand = '-i animation.mp4 -i music.mp3 -c:v copy singalong.mp4';
    const karaokeCommand = "-i animation.mp4 -i mr.mp3 -c:v copy karaoke.mp4"
    const singAlongMVCommand = 
        '-i music.mp3 -framerate 24 -start_number 1 -i ./scenes/scene%05d.png ' +
        '-filter_complex [0:v]scale=800:450:force_original_aspect_ratio=decrease,pad=800:450:(ow-iw)/2:(oh-ih)/2[vid];[vid][1:v]overlay=0:0[out] ' +
        '-map [out] -map 0:a ' +
        '-c:a copy singalong.mp4';
    const karaokeMVCommand = '-i singalong.mp4 -i mr.mp3 -c:v copy -map 0:v:0 -map 1:a:0 -shortest karaoke.mp4';
    const melodicInstCommand = '-i mr.mp3 -i melody.mp3 -filter_complex amix=inputs=2:duration=longest:dropout_transition=0 -c:a mp3 melodicinst.mp3';
    const melodicKaraokeCommand = '-i singalong.mp4 -i melodicinst.mp3 -c:v copy -map 0:v:0 -map 1:a:0 -shortest melodickaraoke.mp4';

    if (product.music?.type.startsWith("video/")){
        message = "(3/7) 프레임 시퀀스를 비디오로 변환 중...";
        message = "(4/7) 따라부르기 영상 만드는 중...";
        await ffmpeg.exec(singAlongMVCommand.split(" "));
        message = "(5/7) 노래방 영상 만드는 중..."
        await ffmpeg.exec(karaokeMVCommand.split(" "));
        message = "(6/7) 보컬 멜로디가 있는 반주 만드는 중..."
        await ffmpeg.exec(melodicInstCommand.split(" "));
        message = "(7/7) 보컬 멜로디가 있는 노래방 영상 만드는 중...";
        await ffmpeg.exec(melodicKaraokeCommand.split(" "));
    }
    else {
        message = "(3/7) 프레임 시퀀스를 비디오로 변환 중..."
        await ffmpeg.exec(animationCommand.split(" "));
        message = "(4/7) 따라부르기 영상 만드는 중..."
        await ffmpeg.exec(singAlongCommand.split(" "));
        message = "(5/7) 노래방 영상 만드는 중..."
        await ffmpeg.exec(karaokeCommand.split(" "));
        message = "(6/7) 보컬 멜로디가 있는 반주 만드는 중...";
        await ffmpeg.exec(melodicInstCommand.split(" "));
        message = "(7/7) 보컬 멜로디가 있는 노래방 영상 만드는 중...";
        await ffmpeg.exec(melodicKaraokeCommand.split(" "));
    }

    const singAlong = await ffmpeg.readFile("singalong.mp4") as Uint8Array<ArrayBuffer>;
    const karaoke = await ffmpeg.readFile("karaoke.mp4") as Uint8Array<ArrayBuffer>;
    const melodicInst = await ffmpeg.readFile("melodicinst.mp3") as Uint8Array<ArrayBuffer>;
    const melodicKaraoke = await ffmpeg.readFile("melodickaraoke.mp4") as Uint8Array<ArrayBuffer>;

    return {
        singAlong: new Blob([singAlong.buffer], { type: "video/mp4" }),
        karaoke: new Blob([karaoke.buffer], { type: "video/mp4" }),
        music: product.music!,
        mr: product.mr!,
        syncData: product.dataJson!,
        melodicInst: new Blob([melodicInst.buffer], { type: "audio/mpeg" }),
        melodicKaraoke: new Blob([melodicKaraoke.buffer], { type: "video/mp4" })
    }
}

function toBlobAsync(canvas:HTMLCanvasElement){
    return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve)
    })
}
async function getBlobs(canvas:HTMLCanvasElement, draw:(time:number) => void, duration:number, options?:ConvertOptions){
    const blobs = [] as Blob[];
    const message = "(2/7) 프레임 받는 중...";
    const frameCount = Math.floor(duration * 24);

    for (let i = 0; i < frameCount; i++){
        draw(i / 24);
        const blob = await toBlobAsync(canvas);
        if (blob) blobs.push(blob);
        options?.onProgress?.({
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
export function frequencyToNoteName(freq:number|null) {
    if (!freq || isNaN(freq) || !isFinite(freq) || freq <= 0) return {noteNumber: null, note: "-", octave: null};
    const A4 = 440;
    const noteNames = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];
    const n = Math.round(12 * Math.log2(freq / A4)) + 57; // MIDI note number
    const noteNumber = n % 12;
    const note = noteNames[noteNumber];
    const octave = Math.max(Math.floor(n / 12), 0);
    return { noteNumber, note, octave };
}

export async function generateMelodies(syncData: Article<SyncInfo>, duration: number, onProgress?:(progress:{percent:number, message:string})=>void) {
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    const syncArr = syncData.map(_ => _).flat();
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = "sine";
    osc.connect(gain).connect(offlineCtx.destination);
    osc.start();
    osc.stop(duration);
    gain.gain.value = 0;

    for (let i = 0; i < syncArr.length; i++) {
        const sync = syncArr[i];
        const prevSync = syncArr[i - 1];
        const nextSync = syncArr[i + 1];
        
        if (prevSync && Math.abs(sync.start - prevSync.end) < 0.0001) 
            gain.gain.setValueAtTime(0.3, sync.start);
        else 
            gain.gain.setValueAtTime(0, sync.start);
        gain.gain.linearRampToValueAtTime(0.6, sync.start + 0.05);
        gain.gain.linearRampToValueAtTime(0.5, sync.end - 0.05);
        if (nextSync && Math.abs(nextSync.start - sync.end) < 0.0001)
            gain.gain.linearRampToValueAtTime(0.3, sync.end);
        else 
            gain.gain.linearRampToValueAtTime(0, sync.end);

        if (Math.abs(nextSync?.start - sync.end) < 0.0001){
            osc.frequency.linearRampToValueAtTime(sync.pitch, sync.start);
            osc.frequency.linearRampToValueAtTime(sync.pitch, sync.end - 0.03);
            osc.frequency.linearRampToValueAtTime(nextSync.pitch, sync.end);
        }
        else {
            osc.frequency.linearRampToValueAtTime(sync.pitch, sync.start);
            osc.frequency.linearRampToValueAtTime(sync.pitch, sync.end);
        }
    };

    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
    const samples = new Int16Array(channelData.length);

    for (let i = 0; i < channelData.length; i++) {
        samples[i] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
    }

    const mp3Data: Uint8Array<ArrayBuffer>[] = [];
    const blockSize = 1152;
    for (let i = 0; i < samples.length; i += blockSize) {
        const chunk = samples.subarray(i, i + blockSize);
        const mp3buf = mp3encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) {
            mp3Data.push(new Uint8Array(mp3buf));
        }
        onProgress?.({
            message: "(1/7) 보컬 멜로디 작업 중...",
            percent: i / samples.length
        })
        if ((i / blockSize) % 20 === 0) await new Promise(resolve => setTimeout(resolve, 0))
    }
    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) {
        mp3Data.push(new Uint8Array(endBuf));
    }

    return new Blob(mp3Data, { type: "audio/mpeg" });
}