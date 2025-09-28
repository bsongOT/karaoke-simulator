import { Screen } from "@/app/components/Screen"
import { AudioManager } from "@/AudioManager"
import { Article } from "@/data-struct/Article"
import { SyncInfo } from "@/SyncInfo"
import { useRef } from "react"

type BuildSlideProps = {
    message:string,
    progress:number,
    syncData:Article<SyncInfo>,
    video?:HTMLVideoElement,
    audio:AudioManager|null
}
export function BuildSlide(props:BuildSlideProps){
    return (
        <div className="slide build">
            <div className="build-container">
                <Screen
                    isRunningMode={false}
                    audio={props.audio} 
                    video={useRef(props.video ?? null)} 
                    existsVideo={false} 
                    syncData={props.syncData}
                />
                <div className="build-message-display">{props.message}</div>
                <div className="build-progress-bar">
                    <div className="build-progress-gauge" style={{width: `${Math.floor(props.progress * 1000) / 10}%`}}></div>
                </div>
            </div>
        </div>
    )
}