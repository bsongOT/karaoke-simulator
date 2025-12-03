"use client";

import { useEffect, useRef, useState } from "react";
import { Article } from "../data-struct/Article";
import { goBack, goForward, togglePlay, eraseSync, insertSync, closeSync, gotoNextSync, gotoPrevSync, raiseCurrentSyncPitch, setCurrentIndexByTime } from "@/behaviors";
import JSZip from "jszip";
import { SyncInfo } from "@/SyncInfo";
import { Product, Shortcut, Slide } from "@/types";
import { convert, download, getSyncDataBlob } from "@/utils";
import { SubmitSlide } from "./slides/SubmitSlide/SubmitSlide";
import { BuildSlide } from "./slides/BuildSlide/BuildSlide";
import { LyricSearcher } from "./components/LyricSearcher";
import { AudioManager } from "@/AudioManager";
import { MainSlide } from "./slides/MainSlide/MainSlide";
import { KeyboardManager } from "@/Facades/KeyboardManager";
import { useKeys } from "@/custom-hooks";

export default function Home() {
  const [slide, setSlide] = useState(Slide.Submit);
  const [product, setProduct] = useState<Product>({
    name: "",
    music: undefined,
    src: undefined,
    mr: undefined,
    vocal: undefined,
    karaokeVideo: undefined,
    singAlongVideo: undefined,
    dataJson: undefined
  })
  const [musicFileStatus, setMusicFileStatus] = useState("pending" as "pending" | "error" | "ready");
  const [mrStatus, setMrStatus] = useState("pending" as "pending" | "error" | "ready");
  const [melodyStatus, setMelodyStatus] = useState("pending" as "pending" | "ready");
  const [keyPress, setKeyPress] = useKeys();

  const [isRecording, setIsRecording] = useState(false);
  const [syncData, setSyncData] = useState(new Article<SyncInfo>([[new SyncInfo(" ", -1, -1)]]))
  const [currentIndex, setCurrentIndex] = useState([0, 0] as [number, number]);
  //const syncDataSRef = useStateRef(new Article<SyncInfo>([[new SyncInfo(" ", -1, -1)]]));
  //const currentIndexSRef = useStateRef<[number, number]>([0, 0]);
  const canvasForBuildRef = useRef<HTMLCanvasElement>(null);
  const drawForBuildRef = useRef<(time:number)=>void>(null);
  const audio = useRef<AudioManager>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [buildMessage, setBuildMessage] = useState("");
  const [buildProgress, setBuildProgress] = useState(0);
  const [isLyricSearcherOpened, setIsLyricSearcherOpened] = useState(false);
  const handleKey = (e:KeyboardEvent) => {
    if (e.code === "Escape") {
      setIsLyricSearcherOpened(false);
    }
    if (document.activeElement !== document.body) return;
    if (!audio.current) return;
    if (e.code in setKeyPress){
      setKeyPress[e.code as keyof typeof setKeyPress](true);
    }
    switch(e.code){
      case "ArrowLeft": return goBack(audio.current);
      case "ArrowRight": return goForward(audio.current);
      case "Space": return togglePlay(audio.current);
      case "Backspace": return eraseSync(syncData, currentIndex, setCurrentIndex, () => setSyncData(new Article(syncData.map(_ => _))));
      case "KeyA": return insertSync(syncData, currentIndex, setCurrentIndex, audio.current, () => setSyncData(new Article(syncData.map(_ => _))));
      case "KeyS": return closeSync(syncData, currentIndex, audio.current, () => setSyncData(new Article(syncData.map(_ => _))));
      case "Comma": return gotoPrevSync(audio.current, syncData);
      case "Period": return gotoNextSync(audio.current, syncData);
      case "ArrowUp": 
        if (e.shiftKey) return raiseCurrentSyncPitch(syncData, audio.current.currentTime, 12, () => setSyncData(new Article(syncData.map(_ => _))));
        return raiseCurrentSyncPitch(syncData, audio.current.currentTime, 1, () => setSyncData(new Article(syncData.map(_ => _))));
      case "ArrowDown": 
        if (e.shiftKey) return raiseCurrentSyncPitch(syncData, audio.current.currentTime, -12, () => setSyncData(new Article(syncData.map(_ => _))));
        return raiseCurrentSyncPitch(syncData, audio.current.currentTime, -1, () => setSyncData(new Article(syncData.map(_ => _))));
      case "Enter": return setCurrentIndexByTime(setCurrentIndex, syncData, audio.current.currentTime);
      case "KeyR": return setIsRecording(!isRecording);
    }
  }
  const handleKeyUp = (e:KeyboardEvent) => {
    if (e.code in setKeyPress){
      setKeyPress[e.code as keyof typeof setKeyPress](false);
    }
  }

  useEffect(() => {
    if (audio.current) return;

    audio.current = new AudioManager(new AudioContext());
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      audio.current?.quit();
    }
  }, [])
  useEffect(
    () => {
      document.addEventListener("keydown", handleKey);
      return () => {
        document.removeEventListener("keydown", handleKey);
      }
    }, [syncData, currentIndex, isRecording]
  )
  const fetchMR = async (token:string, pd:Product) => {
    if (token === "") return;
    const formData = new FormData();
    formData.append("token", token);
    const res = await fetch("/api/fetch-seperate-result", {
      method: "POST",
      body: formData
    });
    if (res.headers.get("content-type")?.includes("application/json")) {
      const json = await res.json();
      if (json.error) {
          setMrStatus("error");
          return;
      }
      if (json.pending) {
          setMrStatus("pending");
      }
    }
    const zipFile = await res.blob();
    const jszip = new JSZip();
    const files = Object.values((await jszip.loadAsync(zipFile)).files).filter(f => !f.dir);

    const vocal = await files.find(f => f.name.endsWith("vocal.mp3"))?.async("blob");
    const mr = await files.find(f => f.name.endsWith("mr.mp3"))?.async("blob");

    if (!vocal || !mr) return;
    
    pd.vocal = vocal;
    pd.mr = mr;

    await audio.current?.register(mr);
    audio.current?.setVolume(1, 0);
    await audio.current?.register(vocal);
    audio.current?.setVolume(0, 0);
    audio.current?.setVolume(1, 1);

    setProduct({ ...pd });
    setMrStatus("ready");
  }

  const submit = async (p:Product, sd?:Article<SyncInfo>) => {
    setProduct(p);
    if (sd){
      setSyncData(sd);
      setCurrentIndex(sd.lastIndex);
    }
    setSlide(Slide.Main);
    if (!p.music) return;

    await audio.current?.register(p.music);
    setMusicFileStatus("ready");
    
    if (!p.mr || !p.vocal) return;

    audio.current?.setVolume(0, 0);
    await audio.current?.register(p.mr);
    await audio.current?.register(p.vocal);
    setMrStatus("ready");
  }

  const build = async (duration:number) => {
      setSlide(Slide.Build);
      product.dataJson = await getSyncDataBlob(syncData);
      const result = await convert(product, syncData, canvasForBuildRef.current!, drawForBuildRef.current!, duration, 
      {
        onProgress: progress => {
          setBuildMessage(progress.message);
          setBuildProgress(progress.percent);
        }
      });
      const zip = new JSZip();
      
      zip.file("sing-along.mp4", result.singAlong);
      zip.file("karaoke.mp4", result.karaoke);
      zip.file("music.mp3", result.music);
      zip.file(`${product.name} melodic.mp3`, result.melodicInst);
      zip.file("melodic-karaoke.mp4", result.melodicKaraoke);
      zip.file(`${product.name} mr.mp3`, result.mr);
      zip.file("sync.json", result.syncData);
  
      const zipBlob = await zip.generateAsync({type: 'blob'});
      download(URL.createObjectURL(zipBlob), `${product.name}.zip`);
      window.onbeforeunload = null;
  }

  return (
    <div className="app" style={{translate: `0 calc(${-100 * slide}% - ${40 * slide}px)`}}>
      <SubmitSlide 
        submit={submit} 
        setToken={fetchMR}
      />
      <MainSlide
        build={build}
        openLyricSearcher={() => { setIsLyricSearcherOpened(true); } } 
        musicFileStatus={musicFileStatus} 
        mrStatus={mrStatus} 
        melodyStatus={melodyStatus} 
        setMelodyStatus={setMelodyStatus}
        product={product} 
        syncData={syncData} 
        setSyncData={setSyncData}
        videoRef={videoRef} 
        audio={audio.current} 
        keyPress={keyPress}
        isEditting={slide === Slide.Main}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
      />
      <BuildSlide 
        message={buildMessage} 
        progress={buildProgress} 
        syncData={syncData}
        video={videoRef.current} 
        setCanvas={cv => canvasForBuildRef.current = cv} 
        setDraw={dr => drawForBuildRef.current = dr} 
        startsBuild={slide === Slide.Build}
      />
      {isLyricSearcherOpened && <LyricSearcher setSyncData={setSyncData} closeLyricSearcher={()=>setIsLyricSearcherOpened(false)}/>}
    </div>
  );
}