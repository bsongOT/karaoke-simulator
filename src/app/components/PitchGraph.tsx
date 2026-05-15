import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { Product } from "@/types";
import React, { useState, useRef, useEffect } from "react";
import { LuActivity, LuMic, LuMicOff } from "react-icons/lu";
import { PitchDetector } from "pitchy";
import { AudioManager } from "@/AudioManager";
import { frequencyToNoteName } from "@/utils";
import { context, getAudioContext, getGain, getOSC } from "@/context";

const C2 = 65;
const C3 = 130;

export function PitchGraph(props:{audio:AudioManager | null, product:Product, syncData:Article<SyncInfo>, setMelodyStatus:(v:"pending" | "ready")=>void, isRecording:boolean, setIsRecording:(v:boolean)=>void}){
  const framesRef = useRef<{freq:number|null, clarity:number}[]>([]);
  const workerRef = useRef<Worker>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array>>(null);
  const [octaves, setOctaves] = useState(new Array<{noteNumber: number|null, note: string, octave: number|null}>());
  const [sampleRate, setSampleRate] = useState(1);
  const [syncChangeTrigger, setSyncChangeTrigger] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [mode, setMode] = useState("melody" as "melody" | "mike");
  const {isRecording, setIsRecording} = props;
  const [mikeTotalPitches, setMikeTotalPitches] = useState(new Array<number>())
  const modeRef = useRef("melody" as "melody" | "mike");
  const isRecordingRef = useRef(false);
  const mikeTotalPitchesRef = useRef(new Array<number>());
  const mikeContextRef = useRef<{analyser: AnalyserNode, dataArray:Float32Array<ArrayBuffer>}>(null);
  const syncDataRef = useRef<Article<SyncInfo>>(props.syncData);
  const frameSize = 1024;
  const [octaveRange, setOctaveRange] = useState([0, 8]);
  const octaveRangeTurnRef = useRef<0|1>(0);
  const [hoverIndex, setHoverIndex] = useState<number>();
  useEffect(() => {
    const audioContext = getAudioContext();
    const osc = getOSC();
    osc.type = "sine";
    const gain = getGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
  }, [])
  useEffect(() => {syncDataRef.current = props.syncData}, [props.syncData])
  useEffect(() => {
    let loop:NodeJS.Timeout;
    (async () => {
    if (!props.product.vocal) return;
    if (!props.audio) return;

    const audioContext = getAudioContext();
    const osc = getOSC();
    const gain = getGain();

    const arrayBuffer = await props.product.vocal.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);

    setSampleRate(audioContext.sampleRate);

    if (!workerRef.current){
      workerRef.current = new Worker(new URL("../../pitchWorker.ts", import.meta.url));
      framesRef.current = Array.from({length: Math.floor(channelData.length / frameSize)}).fill(0).map(() => ({freq: null, clarity: 0}));
      let pitchCount = 0;

      for (let i = 0; i < channelData.length; i += frameSize * 20){
        const arr = channelData.slice(i, i + frameSize * 20);
        workerRef.current.postMessage(
            {frameSize, sampleRate: audioContext.sampleRate, audioBuffer: arr.buffer, start: i / frameSize},
            [arr.buffer]
        );
      }
      workerRef.current.onmessage = e => {
        for (let i = 0; i < 20; i++){
          if (framesRef.current.length <= e.data.start + i) break;
          framesRef.current[e.data.start + i] = e.data.frames[i];
          pitchCount++;
        }
        if (pitchCount >= Math.floor(channelData.length / frameSize) - 1) {
          props.setMelodyStatus("ready");
        }
      }
    }
    
    loop = setInterval(async () => {
      const syncData = syncDataRef.current;
      const syncArr = syncData.map(_ => _).flat();
      const frames = framesRef.current;
      if (modeRef.current === "melody"){
        for (const si of syncArr){
            if (si.start < 0) continue;
            if (si.end < 0) continue;
            if (!isNaN(si.pitch) && si.pitch > 65) continue;
            const start = Math.floor(si.start * audioContext.sampleRate / frameSize);
            const end = Math.floor(si.end * audioContext.sampleRate / frameSize);
            const part = frames
              .slice(start, end)
              .filter(f => f.freq && !isNaN(f.freq) && isFinite(f.freq) && f.freq > C3 && f.freq < 1175)
              .sort((a, b) => a.freq! - b.freq!);
            if (part.length >= 1){
              const weights = part.map(p => p.clarity / (1.01 - p.clarity));
              const mid = weights.reduce((a, b) => a + b, 0) / 2;
              let sum = 0;
              let idx = 0;
              for (idx = 0; idx < weights.length; idx++){
                sum += weights[idx];
                if (sum >= mid) break;
              }
              si.pitch = part[idx].freq ?? 0;
            }
        }
        setOctaves(frames.map(f => frequencyToNoteName(f.freq)));
        const syncIdx = syncArr.findIndex(s => s.start <= props.audio!.currentTime && props.audio!.currentTime <= s.end);
        const sync = syncArr[syncIdx];
        const pitch = sync?.pitch;
        if (sync && pitch) {
          osc.frequency.value = pitch;
          gain.gain.value = context.melodyVolume;
        }
        else {
          gain.gain.value = 0;
        }
      }
      const mikePitches = Array.from({length: syncArr.length}).fill(0).map(() => 0);
      const mikeAllPitches = mikeTotalPitchesRef.current;
      const pitchDetector = pitchDetectorRef.current;
      
      for (let i = 0; i < syncArr.length; i++){
          const sd = syncArr[i];
          const range = mikeAllPitches.slice(Math.floor(sd.start * 40), Math.floor(sd.end * 40)).filter(v => !isNaN(v) && isFinite(v) && v > C3 && v < 4186).sort();
          mikePitches[i] = range[Math.floor(range.length / 2)];
      }
      if (Math.abs(mikeAllPitches.length - props.audio!.duration * 40) > 10){
          mikeTotalPitchesRef.current = Array.from({length: Math.floor(props.audio!.duration * 40)}).fill(0).map(() => 0);
      }
      if (!mikeContextRef.current) return;
      if (isRecordingRef.current && pitchDetector){
          gain.gain.value = 0;
          mikeContextRef.current.analyser.getFloatTimeDomainData(mikeContextRef.current.dataArray);
          const [pitch, clarity] = pitchDetector.findPitch(mikeContextRef.current.dataArray, audioContext.sampleRate);
          
          if (clarity > 0.85) {
            mikeAllPitches[Math.floor(props.audio!.currentTime * 40)] = pitch;
          }
      }
      else if (modeRef.current === "mike") {
          const pitchIndex = syncArr.findIndex(s => s.start <= props.audio!.currentTime && props.audio!.currentTime <= s.end);
          if (pitchIndex !== -1){
              if (mikePitches[pitchIndex] >= C2){
                  osc.frequency.value = mikePitches[pitchIndex];
              }
              gain.gain.value = context.melodyVolume;
          }
          else {
              gain.gain.value = 0;
          }
      }
      setMikeTotalPitches([...mikeAllPitches]);
      setSyncChangeTrigger(!syncChangeTrigger);
    }, 25)
    })();

    return () => {
      clearInterval(loop);
    }
  }, [props.audio, props.product])
  useEffect(() => {modeRef.current = mode}, [mode]);
  useEffect(() => {isRecordingRef.current = isRecording}, [isRecording]);
  useEffect(() => {mikeTotalPitchesRef.current = mikeTotalPitches}, [mikeTotalPitches])
  function raiseCurrentSyncPitch(amount:number, sc?:SyncInfo){
    const sync = sc ?? props.syncData.map(_ => _).flat().find(s => s.start <= props.audio!.currentTime && props.audio!.currentTime <= s.end);
    if (!sync) return;
    sync.pitch *= Math.pow(2, amount / 12);
    if (sync.pitch <= 65 || isNaN(sync.pitch)) sync.pitch = 130;
    setSyncChangeTrigger(!syncChangeTrigger)
  }
  function clickOctaveRange(octave:number){
    if (octaveRangeTurnRef.current === 0) setOctaveRange([octave, octaveRange[1]])
    else setOctaveRange([octaveRange[0], octave])
    octaveRangeTurnRef.current = (1 - octaveRangeTurnRef.current) as 0 | 1;
  }
  return (
    <div className={"pitch-graph" + (collapsed ? " collapsed" : "")}>
      <button 
        className={"toggle-button window-toggle" + (collapsed ? "" : " active")} 
        onClick={() => { setCollapsed(!collapsed)}}
        onMouseDown={(e:React.MouseEvent) => e.preventDefault()}
        onFocus={(e:React.FocusEvent<HTMLButtonElement>)=>e.target.blur()}
      >
          <LuActivity size={20}/>
      </button>
      <div className="pitch-graph-menu">
        <button className={"toggle-button" + (isRecording ? " active" : "")} 
          onClick={async () => {
            if (!isRecording && !mikeContextRef.current){
              const audioContext = getAudioContext();
              const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
              const source = audioContext.createMediaStreamSource(mic);
              const analyser = audioContext.createAnalyser();
              source.connect(analyser);
              analyser.fftSize = frameSize;
              const bufferLength = analyser.fftSize;
              const dataArray = new Float32Array(bufferLength);
              mikeContextRef.current = {analyser, dataArray}
              pitchDetectorRef.current = PitchDetector.forFloat32Array(frameSize);
            }
            setIsRecording(!isRecording)
          }}
          onFocus={(e:React.FocusEvent<HTMLButtonElement>)=>e.target.blur()}
        >
          {isRecording ? <LuMic size={20}/> : <LuMicOff size={20}/>}
        </button>
        <div className="button-container">
          <button className={"pitch-view-select" + (mode === "melody" ? " active" : "")} onClick={() => {setMode("melody")}} onFocus={(e:React.FocusEvent<HTMLButtonElement>)=>e.target.blur()}>멜로디</button>
          <button className={"pitch-view-select" + (mode === "mike" ? " active" : "")} onClick={() => {setMode("mike")}} onFocus={(e:React.FocusEvent<HTMLButtonElement>)=>e.target.blur()}>마이크</button>
        </div>
        <div className="button-container">
          <button className="pitch-changer" onFocus={(e:React.FocusEvent<HTMLButtonElement>) => e.target.blur()} onClick={() => raiseCurrentSyncPitch(1)}>+1</button>
          <button className="pitch-changer" onFocus={(e:React.FocusEvent<HTMLButtonElement>) => e.target.blur()} onClick={() => raiseCurrentSyncPitch(-1)}>-1</button>
          <button className="pitch-changer" onFocus={(e:React.FocusEvent<HTMLButtonElement>) => e.target.blur()} onClick={() => raiseCurrentSyncPitch(12)}>+12</button>
          <button className="pitch-changer" onFocus={(e:React.FocusEvent<HTMLButtonElement>) => e.target.blur()} onClick={() => raiseCurrentSyncPitch(-12)}>-12</button>
        </div>
        <div className="button-container">
          {
            ...Array.from({length: 6}).fill(0).map((_, i) => (
              <button className={(Math.min(...octaveRange) <= i && i <= Math.max(...octaveRange)) ? "active" : ""} key={i} onClick={() => clickOctaveRange(i)}>{i}</button>
            ))
          }
        </div>
      </div>
      <svg width="780" height="120">
        <path fill="none" stroke="black" d="M390 0 L390 500"></path>
        { mode === "melody" &&
        <g strokeLinecap="round">
            <path fill="none" stroke="#ccc" d={
            octaves.map((o, i) => {
                if (!props.audio) return "0 0"
                if (!o.octave || isNaN(o.octave)) return "";
                if (!o.noteNumber || isNaN(o.noteNumber)) return "";
                if (o.octave - 2 < Math.min(...octaveRange)) return "";
                if (o.octave - 2 > Math.max(...octaveRange)) return "";
                const x = 390 + (i * frameSize / sampleRate - props.audio.currentTime) * 195;
                const y = 110 - 8 * (o.noteNumber % 12)
                return `${x} ${y}`
            })
            .slice(
                Math.max(Math.floor(((props.audio?.currentTime ?? 0) - 2) * sampleRate / frameSize), 0),
                Math.min(Math.floor(((props.audio?.currentTime ?? 0) + 2) * sampleRate / frameSize), octaves.length - 1)
            )
            .map((v, i, arr) => (!arr[i - 1] || arr[i - 1] === "") ? `M${v}` : `L${v}`)
            .filter(xy => xy !== "M" && xy !== "L")
            .join(" ")
            }></path>
            <g>
            {
                ...props.syncData
                  .map(_ => _)
                  .flat()
                  .map((sd, i) => {
                if (!props.audio) return null;
                const startX = Math.round(390 + (sd.start - props.audio.currentTime) * 195);
                const endX = Math.round(390 + (sd.end - props.audio.currentTime) * 195);
                if (endX < 0 || startX > 780) return null;
                const pitchInfo = frequencyToNoteName(sd.pitch);
                const y = 110 - 8 * (pitchInfo.noteNumber ?? -1);
                const color = ["purple", "blue", "skyblue", "green", "yellow", "orange", "red"][(pitchInfo.octave ?? 0) - 1] ?? "black";
                return (
                  <g key={i} onMouseOver={() => setHoverIndex(i)} onMouseOut={() => setHoverIndex(-1)}>
                    <rect width={endX - startX} height="120" x={startX} y="0" fill="#00000000"></rect>
                    {
                      hoverIndex !== i ?
                      <text fontSize={11} x={startX} y={y - 5}>{pitchInfo.note}</text> :
                      <>
                      <text fontSize={11} x={startX} y={y - 15} onClick={() => raiseCurrentSyncPitch(12, sd)}>+12</text>
                      <text fontSize={11} x={startX} y={y - 5} onClick={() => raiseCurrentSyncPitch(1, sd)}>+1</text>
                      <text fontSize={11} x={startX} y={y + 15} onClick={() => raiseCurrentSyncPitch(-1, sd)}>-1</text>
                      <text fontSize={11} x={startX} y={y + 25} onClick={() => raiseCurrentSyncPitch(-12, sd)}>-12</text>
                      </>  
                    }
                    <path
                      fill="none" stroke={color} strokeWidth="4px"
                      d={`M${startX} ${y} L${endX} ${y}`}
                    />
                  </g>
                )
                })
            }
            </g>
        </g>}
        <g strokeLinecap="round">
            <path fill="none" stroke="#ccc" d={
            mikeTotalPitches.map((o, i) => {
                if (!props.audio) return "0 0"
                if (o < 1) return "0 0";
                if (isNaN(o)) return "0 0";
                const x = 390 + (i / 40 - props.audio.currentTime) * 195;
                const y = 110 - 8 * ((frequencyToNoteName(o).noteNumber ?? -1) % 12)
                return `${x} ${y}`
            })
            .slice(
                Math.max(Math.floor(((props.audio?.currentTime ?? 0) - 2) * 40), 0),
                Math.min(Math.floor(((props.audio?.currentTime ?? 0) + 2) * 40), mikeTotalPitches.length - 1)
            )
            .map((v, i) => i === 0 ? `M${v}` : `L${v}`)
            .filter(v => v !== "L0 0")
            .join(" ")
            }></path>
            <g>
            {
                ...props.syncData.map(_ => _).flat().map((sd, i) => {
                if (!props.audio) return <path key={i}></path>;
                const startX = Math.round(390 + (sd.start - props.audio.currentTime) * 195);
                const endX = Math.round(390 + (sd.end - props.audio.currentTime) * 195);
                const range = mikeTotalPitches.slice(Math.floor(sd.start * 40), Math.floor(sd.end * 40)).filter(v => !isNaN(v) && v > 1 && v < 440 * 16).sort();
                const pitch = range[Math.floor(range.length / 2)];
                const y = 110 - 8 * (frequencyToNoteName(pitch).noteNumber ?? -1);
                const color = mode === "melody" ?
                  "#ccc" : 
                  (["purple", "blue", "skyblue", "green", "yellow", "orange", "red"][(frequencyToNoteName(pitch).octave ?? 0) - 1] ?? "black");
                return (
                <path
                    key={i}
                    fill="none" stroke={color} strokeWidth="4px"
                    d={`M${startX} ${y} L${endX} ${y}`}
                />)
                })
            }
            </g>
        </g>
      </svg>
    </div>
  )
}