import { LyricToolBox } from "@/app/slides/MainSlide/Rightside/LyricToolBox"
import { LyricView } from "@/app/slides/MainSlide/Rightside/LyricVIew"
import { PitchGraph } from "@/app/components/PitchGraph"
import { Article } from "@/data-struct/Article"
import { ResourceStatusView } from "./Leftside/ResourceStatusView"
import { ResultOptionList } from "./Leftside/ResultOptionList"
import { VolumeController } from "./Leftside/VolumeController"
import { KeyboardBox } from "./Main/KeyboardBox"
import { Screen } from "@/app/components/Screen"
import { Product, Shortcut } from "@/types"
import { RefObject, useEffect, useRef, useState } from "react"
import { AudioManager } from "@/AudioManager"
import { SyncInfo } from "@/SyncInfo"
import { useKeys, useResultOption } from "@/custom-hooks"

type MainSlideProps = {
    musicFileStatus:"error" | "pending" | "ready",
    mrStatus:"error" | "pending" | "ready",
    melodyStatus:"pending" | "ready",
    setMelodyStatus:(st:"pending" | "ready") => void,
    product:Product,
    syncData:Article<SyncInfo>,
    setSyncData:(sd:Article<SyncInfo>)=>void,
    videoRef:RefObject<HTMLVideoElement | null>,
    audio:AudioManager | null,
    keyPress:ReturnType<typeof useKeys>[0],
    build:(duration:number) => Promise<void>,
    isEditting:boolean,
    openLyricSearcher:() => void,
    currentIndex:[number, number],
    setCurrentIndex:(v:[number, number]) => void,
    isRecording:boolean,
    setIsRecording:(v:boolean)=>void
}
export function MainSlide(props:MainSlideProps) {
    const {
        musicFileStatus,
        mrStatus,
        melodyStatus,
        setMelodyStatus,
        product,
        syncData,
        setSyncData,
        audio,
        keyPress,
        build,
        isEditting,
        openLyricSearcher,
        currentIndex,
        setCurrentIndex,
        videoRef,
        isRecording,
        setIsRecording
    } = props;
    const [resultOptions, setResultOptions] = useResultOption();

    const getBuildReady = () => {
        if (mrStatus !== "ready") return false;
        if (musicFileStatus !== "ready") return false;
        if (melodyStatus !== "ready") return false;
        if (!product.mr || !product.music || product.name === "" ||
            !syncData.map(_ => _).flat().every(si => si.start > 0 && si.end > 0)) return false;
        return true;
    }
    const startBuild = async () => {
        if (!getBuildReady()) return;
        build(audio?.duration ?? 0);
    }

    return (
        <div className="slide main">
            <aside className="left-side">
                <ResourceStatusView
                    musicFileStatus={musicFileStatus}
                    mrStatus={mrStatus}
                    melodyStatus={melodyStatus}
                    resultStatus={product.mr && product.music && product.name !== "" && syncData.map(_ => _).flat().every(si => si.start > 0 && si.end > 0) ? "ready" : "pending"}
                />
                <div className="section-title">음량 조절</div>
                <VolumeController
                    audio={audio}
                    mrStatus={mrStatus}
                    melodyStatus={melodyStatus}
                />
                <div className="section-title">결과물 옵션</div>
                <ResultOptionList setResultOptions={setResultOptions} resultOptions={resultOptions} />
                <button className={"build-btn" + (getBuildReady() ? "" : " disabled")} onClick={startBuild}>빌드 시작</button>
            </aside>
            <main className="main-view">
                <Screen
                    isRunningMode={isEditting}
                    audio={audio}
                    video={videoRef}
                    existsVideo={product.music?.type.startsWith("video/") ?? false}
                    syncData={syncData}
                />
                <video muted style={{ display: "none" }} ref={videoRef} src={product.src} controls></video>
                <KeyboardBox keyPress={keyPress} />
                <PitchGraph audio={audio} product={product} syncData={syncData} setMelodyStatus={setMelodyStatus} isRecording={isRecording} setIsRecording={setIsRecording}/>
            </main>
            <aside className="lyric-panel">
                <LyricView
                    syncData={syncData}
                    rerenderSync={() => { setSyncData(new Article(syncData.map(_ => _))) }}
                    currentIndex={currentIndex} 
                    setCurrentIndex={setCurrentIndex}
                />
                <LyricToolBox
                    syncData={syncData}
                    setSyncData={setSyncData}
                    setCurrentIndex={setCurrentIndex}
                    openSearcher={openLyricSearcher}
                />
            </aside>
        </div>
    )
}