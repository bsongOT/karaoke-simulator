import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { toNotes } from "@/utils";
import { useState } from "react"

export function LyricSearcher(props:{setSyncData:(sd:Article<SyncInfo>)=>void, closeLyricSearcher:()=>void}){
    const [url, setUrl] = useState<string>("");
    const [lyricLines, setLyricLines] = useState<string[]>([])
    return (
        <div className="lyric-searcher" onClick={props.closeLyricSearcher}>
            <div className="search-wrapper" onClick={(e:React.MouseEvent) => e.stopPropagation()}>
                <div className="search">
                    <input
                        className="search-input"
                        onInput={(e:React.InputEvent<HTMLInputElement>) => {
                            setUrl((e.target as HTMLInputElement).value)
                        }}
                        placeholder="우타텐 URL을 입력하세요.(예시: https://utaten.com/lyric/qk19044046/)"
                    />
                    <button onClick={() => {
                        window.open("https://utaten.com/");
                    }}>
                        탐색
                    </button>
                    <button onClick={async () => {
                        if (url.trim() === "") return;
                        const form = new FormData();
                        form.append("url", url);
                        const res = await fetch("/api/search-jpop", {
                            method: "POST",
                            body: form
                        });
                        const json = await res.json();
                        setLyricLines(json.lyric.split("\n"));
                    }}>불러오기</button>
                </div>
            </div>
            <div className="lyric-container">
                {...lyricLines.map(l => <div>{l}</div>)}
            </div>
            <button onClick={() => {
                props.setSyncData(
                    new Article<SyncInfo>(lyricLines.map(l => toNotes(l)))
                );
                props.closeLyricSearcher();
            }}>적용</button>
        </div>
    )
}