"use client";

import { useEffect, useRef, useState } from "react";
import { LyricView } from "./components/LyricVIew";
import { Screen } from "./components/Screen";
import { Article } from "../data-struct/Article";
import { goBack, goForward, togglePlay, eraseSync, insertSync, closeSync } from "@/behaviors";
import JSZip from "jszip";
import { SyncInfo } from "@/SyncInfo";
import { Product, Shortcut, Slide } from "@/types";
import { convert, download, generateMelodies, getSyncDataBlob, wait } from "@/utils";
import { LyricToolBox } from "./components/LyricToolBox";
import { PitchGraph } from "./components/PitchGraph";
import { SubmitSlide } from "./slides/SubmitSlide/SubmitSlide";
import { ResourceStatusView } from "./slides/MainSlide/Leftside/ResourceStatusView";
import { BuildSlide } from "./slides/BuildSlide/BuildSlide";
import { LyricSearcher } from "./components/LyricSearcher";
import { AudioManager } from "@/AudioManager";
import { VolumeController } from "./slides/MainSlide/Leftside/VolumeController";
import { ResultOptionList } from "./slides/MainSlide/Leftside/ResultOptionList";
import { KeyboardBox } from "./slides/MainSlide/Main/KeyboardBox";

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
  const [keyPress, setKeyPress] = useState<Set<Shortcut>>();
  const keyPressRef = useRef<Set<Shortcut>>(null);

  const [syncData, setSyncData] = useState(new Article<SyncInfo>([[new SyncInfo(" ", -1, -1)]]))
  const [currentIndex, setCurrentIndex] = useState([0, 0] as [number, number]);
  const [isRunningMode, setIsRunningMode] = useState(true);
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
    if (!keyPressRef.current) return;
    const key = keyPressRef.current;
    switch(e.code){
      case "ArrowLeft": 
        setKeyPress(new Set(key.add(Shortcut.Left)));
        return goBack(audio.current);
      case "ArrowRight": 
        setKeyPress(new Set(key.add(Shortcut.Right)));
        return goForward(audio.current);
      case "Space":
        setKeyPress(new Set(key.add(Shortcut.Space)));
        return togglePlay(audio.current);
      case "Backspace": 
        setKeyPress(new Set(key.add(Shortcut.Backspace)));
        return eraseSync(syncData, currentIndex, setCurrentIndex, () => setSyncData(new Article(syncData.map(_ => _))));
      case "KeyA":
        setKeyPress(new Set(key.add(Shortcut.A)));
        return insertSync(syncData, currentIndex, setCurrentIndex, audio.current, () => setSyncData(new Article(syncData.map(_ => _))));
      case "KeyS": 
        setKeyPress(new Set(key.add(Shortcut.S)));
        return closeSync(syncData, currentIndex, audio.current, () => setSyncData(new Article(syncData.map(_ => _))));
    }
  }
  const handleKeyUp = (e:KeyboardEvent) => {
    const key = keyPressRef.current;
    if (!key) return;
    switch(e.code){
      case "ArrowLeft": 
        key.delete(Shortcut.Left);
        return setKeyPress(new Set(key));
      case "ArrowRight": 
        key.delete(Shortcut.Right);
        return setKeyPress(new Set(key));
      case "Space": 
        key.delete(Shortcut.Space);
        return setKeyPress(new Set(key));
      case "Backspace": 
        key.delete(Shortcut.Backspace);
        return setKeyPress(new Set(key));
      case "KeyA": 
        key.delete(Shortcut.A);
        return setKeyPress(new Set(key));
      case "KeyS": 
        key.delete(Shortcut.S);
        return setKeyPress(new Set(key));
    }
  }

  useEffect(() => {
    setKeyPress(new Set());
    audio.current = new AudioManager(new AudioContext());
    document.addEventListener("keyup", handleKeyUp);
  }, [])
  useEffect(() => {keyPressRef.current = keyPress ?? null}, [keyPress])
  useEffect(
    () => {
      document.addEventListener("keydown", handleKey);
      return () => {
        document.removeEventListener("keydown", handleKey);
      }
    }, [keyPress, syncData, currentIndex]
  )
  const fetchMR = async (token:string, pd:Product) => {
    if (token === "") return;
    const formData = new FormData();
    formData.append("token", token);
    const res = await fetch("/api/fetch-seperate-result", {
      method: "POST",
      body: formData
    })
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
  const getBuildReady = () => {
    if (mrStatus !== "ready") return false;
    if (musicFileStatus !== "ready") return false;
    if (melodyStatus !== "ready") return false;
    if (!product.mr || !product.music || product.name === "" ||
        !syncData.map(_ => _).flat().every(si => si.start > 0 && si.end > 0)) return false;
    return true;
  }
  const build = async () => {
    if (!getBuildReady()) return;

    setIsRunningMode(false);
    product.dataJson = await getSyncDataBlob(syncData);
    setSlide(Slide.Build);
    const result = await convert(product, syncData, canvasForBuildRef.current!, drawForBuildRef.current!, audio.current?.duration ?? 0, 
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
  }

  const submit = async (p:Product, sd?:Article<SyncInfo>) => {
    setProduct(p);
    if (sd){
      setSyncData(sd);
      setCurrentIndex(sd.lastIndex);
    }
    setSlide(Slide.Main);
    if (p.music) {
      await audio.current?.register(p.music);
      setMusicFileStatus("ready");
    }
    if (p.mr && p.vocal) {
      audio.current?.setVolume(0, 0);
      await audio.current?.register(p.mr);
      await audio.current?.register(p.vocal);
      setMrStatus("ready");
    }
  }

  return (
    <div className="app" style={{translate: `0 calc(${-100 * slide}% - ${40 * slide}px)`}}>
      <SubmitSlide 
        submit={submit} 
        setToken={fetchMR}
      />
      <div className="slide main">
        <div className="left-side">
          <ResourceStatusView 
            musicFileStatus={musicFileStatus}
            mrStatus={mrStatus}
            melodyStatus={melodyStatus}
            resultStatus={product.mr && product.music && product.name !== "" && syncData.map(_ => _).flat().every(si => si.start > 0 && si.end > 0) ? "ready" : "pending"}
          />
          <div className="section-title">음량 조절</div>
          <VolumeController
            audio={audio.current}
            mrStatus={mrStatus}
            melodyStatus={melodyStatus}
          />
          <div className="section-title">결과물 옵션</div>
          <ResultOptionList/>
          <button className={"build-btn" + (getBuildReady() ? "" : " disabled")} onClick={build}>빌드 시작</button>
        </div>
        <main className="main-view">
          <Screen 
            isRunningMode={isRunningMode} 
            audio={audio.current} 
            video={videoRef}
            existsVideo={product.music?.type.startsWith("video/") ?? false}
            syncData={syncData}
          />
          <video muted style={{display: "none"}} ref={videoRef} src={product.src} controls></video>
          <KeyboardBox keyPress={keyPress}/>
          <PitchGraph audio={audio.current} product={product} syncData={syncData} setMelodyStatus={setMelodyStatus}/>
        </main>
        <aside className="lyric-panel">
          <LyricView
            syncData={syncData}
            rerenderSync={() => {setSyncData(new Article(syncData.map(_ => _)))}}
            currentIndex={currentIndex} setCurrentIndex={setCurrentIndex}
          />
          <LyricToolBox 
            syncData={syncData}
            setSyncData={setSyncData}
            setCurrentIndex={setCurrentIndex}
            openSearcher={() => {setIsLyricSearcherOpened(true)}}
          />
        </aside>
      </div>
      <BuildSlide 
        message={buildMessage} 
        progress={buildProgress} 
        syncData={syncData} 
        audio={audio.current}
        video={videoRef.current} 
        setCanvas={cv => canvasForBuildRef.current = cv} 
        setDraw={dr => drawForBuildRef.current = dr} 
        startsBuild={!isRunningMode}
      />
      {isLyricSearcherOpened && <LyricSearcher setSyncData={setSyncData} closeLyricSearcher={()=>setIsLyricSearcherOpened(false)}/>}
    </div>
  );
}