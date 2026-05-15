import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { Product } from "@/types";
import { Dispatch, SetStateAction, useState } from "react";
import { YoutubeProgress } from "./YoutubeProgress";
import { FileProgress } from "./FileProgress";
import { ZipProgress } from "./ZipProgress";

type ProgressInputProps = {
    submit:(p:Product, sd?:Article<SyncInfo>)=>void,
    setToken:(token:string, pd:Product)=>void
}
export function ProgressInput(props:ProgressInputProps){
    const [audioReceiver, setAudioReceiver] = useState("file" as "youtube" | "file" | "zip");
    const {submit, setToken} = props;

    return (
        <div className="progress-window">
          <ProgressChoice audioReceiver={audioReceiver} setAudioReceiver={setAudioReceiver}/>
          <div>
            {{
              file: <FileProgress submit={submit} setToken={setToken}/>,
              youtube: <YoutubeProgress submit={submit} setToken={setToken}/>,
              zip: <ZipProgress submit={submit}/>
            }[audioReceiver]}
          </div>
        </div>
    )
}
type ProgressChoiceProps = {
    audioReceiver: "youtube" | "file" | "zip"
    setAudioReceiver: Dispatch<SetStateAction<"youtube" | "file" | "zip">>
}
function ProgressChoice(props:ProgressChoiceProps){
    const {audioReceiver, setAudioReceiver} = props;
    return (
        <div className="progress-choice">
            {/* <div 
                className={audioReceiver === "youtube" ? "selected progress-tab" : "progress-tab"} 
                onClick={() => setAudioReceiver("youtube")}>
                <div className="upper"></div>
                <div className="lower"></div>
                <div>유튜브</div>
            </div> */}
            <div 
                className={audioReceiver === "file" ? "selected progress-tab" : "progress-tab"} 
                onClick={() => setAudioReceiver("file")}>
                <div className="upper"></div>
                <div className="lower"></div>
                <div>파일</div>
            </div>
            <div
                className={audioReceiver === "zip" ? "selected progress-tab" : "progress-tab"}
                onClick={() => setAudioReceiver("zip")}>
                <div className="upper"></div>
                <div className="lower"></div>
                <div>채보 수정</div>
            </div>
        </div>
    )
}