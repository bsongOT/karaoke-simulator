import { AudioManager } from "@/AudioManager";
import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo.js";
import { frequencyToNoteName, lineSentenceWidth } from "@/utils";
import React, { RefObject, useEffect, useRef, useState } from "react";

type ScreenProps = {
    isRunningMode:boolean,
    audio?:AudioManager|null,
    video:RefObject<HTMLVideoElement | null>,
    existsVideo:boolean,
    syncData:Article<SyncInfo>,
    exportDraw?:(draw:(time:number)=>void)=>void,
    exportCanvas?:(canvas:HTMLCanvasElement)=>void
}
export function Screen(props:ScreenProps) {
    const screen = useRef<HTMLCanvasElement>(null);
    const cxRef = useRef<CanvasRenderingContext2D>(null);
    const isRunningModeRef = useRef<boolean>(true);
    const syncDataRef = useRef<Article<SyncInfo>>(null);
    const barSpeed = 150; //px per second

    function draw(time:number) {
        if (!screen.current) return;
        const cx = cxRef.current;
        if (!cx) return;
        const syncData = syncDataRef.current;
        if (!syncData) return;
        cx.clearRect(0, 0, screen.current.width, screen.current.height);
        cx.beginPath();

        const idx = syncData.findLastIndex(a => a.start < time && a.start > 0);
        const sync = syncData.at(idx);

        if (idx[0] < 0 && idx[1] < 0){
            const firstSentence = syncData.lineAt(0).map(s => s.word).join("");
            const secondSentence = syncData.lineAt(1)?.map(s => s.word).join("") ?? "";

            const firstTextX = (screen.current.width - cx.measureText(firstSentence).width) / 2;
            const secondTextX = (screen.current.width - cx.measureText(secondSentence).width) / 2;

            cx.globalCompositeOperation = "destination-over";
            cx.fillStyle = "white";
            cx.strokeStyle = "black";
            cx.fillText(firstSentence, firstTextX, 300);
            cx.strokeText(firstSentence, firstTextX, 300);
            cx.fillText(secondSentence, secondTextX, 400);
            cx.strokeText(secondSentence, secondTextX, 400);
            cx.fill();
            cx.closePath();
            cx.beginPath();
            cx.fillStyle = "white";

            if (props.existsVideo){
                if (props.video.current && props.isRunningMode){
                    const video = props.video.current;
                    if (Math.abs(video.currentTime - time) > 0.3) {
                        video.currentTime = time;
                    }
                    if (props.audio?.paused && !video.paused){
                        video.pause();
                    }
                    if (!props.audio?.paused && video.paused){
                        video.play();
                    }
                    cx.drawImage(video, 0, 0, 800, 450);
                }
            }
            else {
                cx.fillRect(0, 0, screen.current.width, screen.current.height);
            }
            cx.closePath();

            cx.strokeStyle = "#999";
            cx.lineWidth = 1;
            cx.beginPath();
            cx.globalCompositeOperation = "source-over";
            cx.fillStyle = "#ddd";
            const syncArr = syncData.map(_ => _).flat(1);
            for (let i = 0; i < syncArr.length; i++){
                if (syncArr[i].start < 0) continue;
                const pitchInfo = frequencyToNoteName(syncArr[i].pitch);
                const pitchHeight = !isNaN(pitchInfo.noteNumber!) && !isNaN(pitchInfo.octave!) && pitchInfo.octave! >= 3 ? 
                    (pitchInfo.noteNumber! + 12 * (pitchInfo.octave! - 3)) : 0;
                cx.roundRect(
                    400 + (syncArr[i].start - time) * barSpeed,
                    200 - 5 * pitchHeight,
                    ((syncArr[i].end > 0 ? syncArr[i].end : time) - syncArr[i].start) * barSpeed,
                    10, 10
                );
            }
            cx.fill();
            cx.stroke();
            cx.closePath();

            cx.beginPath();
            cx.fillStyle = "black";
            cx.rect(398, 10, 2, 200);
            cx.stroke();
            cx.fill();
            cx.closePath();
            cx.lineWidth = 4;

            return;
        }

        const before = lineSentenceWidth(cx, syncData, [idx[0], idx[1] - 1], false);
        const now = lineSentenceWidth(cx, syncData, idx, true);

        if (idx[0] < 0 || idx[1] < 0) return;

        const ratio = sync.end > 0 ? Math.min(1, (time - sync.start) / (sync.end - sync.start)) : 1;
        const progressWidth = before + (now - before) * ratio;

        const currentSentence = syncData.lineAt(idx[0]).map(s => s.word).join("");
        const nextSentence = syncData.lineAt(idx[0] + 1)?.map(s => s.word).join("") ?? "";

        const currentTextX = (screen.current.width - cx.measureText(currentSentence).width) / 2;
        const nextTextX = (screen.current.width - cx.measureText(nextSentence).width) / 2;

        cx.rect(currentTextX, 220 + 100 * (idx[0] % 2), progressWidth, 120);
        cx.fill();

        cx.globalCompositeOperation = "source-in";
        cx.fillStyle = "yellow";
        cx.fillText(currentSentence, currentTextX, 300 + 100 * (idx[0] % 2));

        cx.globalCompositeOperation = "destination-over";
        cx.fillStyle = "white";
        cx.strokeStyle = "black";
        if (idx[0] % 2 === 0) {
            cx.fillText(currentSentence, currentTextX, 300);
            cx.strokeText(currentSentence, currentTextX, 300);
            cx.fillText(nextSentence, nextTextX, 400);
            cx.strokeText(nextSentence, nextTextX, 400);
        }
        else {
            cx.fillText(nextSentence, nextTextX, 300);
            cx.strokeText(nextSentence, nextTextX, 300);
            cx.fillText(currentSentence, currentTextX, 400);
            cx.strokeText(currentSentence, currentTextX, 400);
        }
        cx.closePath();

        cx.beginPath();
        cx.globalCompositeOperation = "source-over";
        cx.fillStyle = "#ddd";
        cx.strokeStyle = "#999";
        cx.lineWidth = 1;
        const syncArr = syncData.map(_ => _).flat(1);
        for (let i = 0; i < syncArr.length; i++){
            if (syncArr[i].start < 0) continue;
            const pitchInfo = frequencyToNoteName(syncArr[i].pitch);
            const pitchHeight = !isNaN(pitchInfo.noteNumber!) && !isNaN(pitchInfo.octave!) && pitchInfo.octave! >= 3 ? 
                (pitchInfo.noteNumber! + 12 * (pitchInfo.octave! - 3)) : 0;
            cx.roundRect(
                400 + (syncArr[i].start - time) * barSpeed,
                200 - 5 * pitchHeight,
                ((syncArr[i].end > 0 ? syncArr[i].end : time) - syncArr[i].start) * barSpeed,
                10, 10
            );
        }
        cx.fill();
        cx.stroke();
        cx.closePath();

        cx.beginPath();
        cx.fillStyle = "gold";
        for (let i = 0; i < syncArr.length; i++){
            if (syncArr[i].start > time) continue;
            const pitchInfo = frequencyToNoteName(syncArr[i].pitch);
            const pitchHeight = !isNaN(pitchInfo.noteNumber!) && !isNaN(pitchInfo.octave!) && pitchInfo.octave! >= 3 ? 
                (pitchInfo.noteNumber! + 12 * (pitchInfo.octave! - 3)) : 0;
            cx.roundRect(
                400 + (syncArr[i].start - time) * barSpeed,
                200 - 5 * pitchHeight,
                Math.max(Math.min(syncArr[i].end, time) - syncArr[i].start, 0) * barSpeed,
                10, 10
            );
        }
        cx.fill();
        cx.stroke();
        cx.closePath();

        cx.beginPath();
        cx.fillStyle = "black";
        cx.rect(398, 10, 2, 200);
        cx.stroke();
        cx.fill();
        cx.closePath();
        cx.lineWidth = 4;

        cx.beginPath();
        cx.globalCompositeOperation = "destination-over";
        if (props.existsVideo){
            if (props.video.current && props.isRunningMode){
                const video = props.video.current;
                if (Math.abs(video.currentTime - time) > 0.3) {
                    video.currentTime = time;
                }
                if (props.audio?.paused && !video.paused){
                    video.pause();
                }
                if (!props.audio?.paused && video.paused){
                    video.play();
                }
                cx.drawImage(video, 0, 0, 800, 450);
            }
        }
        else {
            cx.fillStyle = "white";
            cx.fillRect(0, 0, screen.current.width, screen.current.height);
        }
        cx.closePath();
    }

    useEffect(() => {
        cxRef.current = screen.current?.getContext("2d") ?? null;
        const cx = cxRef.current;

        async function ready() {
            await document.fonts.load("50px Happiness");
            if (!cx) return;
            cx.font = "50px Happiness";
            cx.lineWidth = 4;
        }

        ready();

        props.exportDraw?.(draw);
        props.exportCanvas?.(screen.current as HTMLCanvasElement);

        const loop = setInterval(() => {
            if (!isRunningModeRef.current) {
                clearInterval(loop);
                return;
            }
            draw(props.audio?.currentTime ?? -1);
        }, 25);
        return () => {
            clearInterval(loop);
        }
    }, [props.existsVideo, props.audio])

    useEffect(() => {isRunningModeRef.current = props.isRunningMode}, [props.isRunningMode]);
    useEffect(() => {syncDataRef.current = props.syncData}, [props.syncData]);

    return (
        <div className="screen">
            <canvas ref={screen} width={800} height={450}></canvas>
            {props.isRunningMode && <PlayerController audio={props.audio ?? null}/>}
        </div>
    )
}
function PlayerController(props:{audio:AudioManager | null}) {
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(NaN);
    const [draggingTime, setDraggingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const totalTime = getMSS(duration);
    const isDraggingRef = useRef<boolean>(false);
    useEffect(() => {
        const loop = setInterval(() => {
            setTime(props.audio?.currentTime ?? 0);
            if (isNaN(duration) || duration <= 0) {
                setDuration(props.audio?.duration ?? NaN);
            }
        }, 25);
        return () => clearInterval(loop);
    }, [props.audio])
    useEffect(() => setIsPlaying(!props.audio?.paused), [props.audio?.paused])
    function getMSS(sec:number) {
        if (isNaN(sec) || !isFinite(sec)) return "-:--";
        return `${Math.floor(sec / 60)}:${("0" + Math.floor(sec % 60)).slice(-2)}`;
    }
    return (
        <div className="player-controls">
            <div className={`play-button ${isPlaying ? "pause" : "play"}`.trim()} onClick={() => {
                const audio = props.audio;
                if (!audio) return;
                setIsPlaying(audio.paused)
                if (audio.paused) audio.play();
                else audio.pause();
            }}>{isPlaying ? "⏸" : "▶"}</div>
            <input step="0.1" type="range" className="progress-bar" min="0" max={(props.audio?.duration ?? 1).toString()}
                value={isDraggingRef.current ? draggingTime : time}
                onInput={(e:React.ChangeEvent<HTMLInputElement>) => {
                    setDraggingTime(Number(e.target.value));
                }}
                onMouseDown={(e:React.MouseEvent<HTMLInputElement>) => {
                    isDraggingRef.current = true;
                }}
                onMouseUp={(e:React.MouseEvent<HTMLInputElement>) => {
                    if (!props.audio) return;
                    const audio = props.audio;
                    audio.currentTime = Number((e.target as HTMLInputElement).value);
                    isDraggingRef.current = false;
                    (e.target as HTMLElement).blur();
                }}
            />
            <div className="time-display">{`${getMSS(time)} / ${totalTime}`}</div>
        </div>
    )
}