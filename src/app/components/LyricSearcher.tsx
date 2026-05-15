import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { toNotes } from "@/utils";
import { useRef, useState } from "react"

export function LyricSearcher(props:{setSyncData:(sd:Article<SyncInfo>)=>void, closeLyricSearcher:()=>void}){
    const artistRef = useRef("");
    const titleRef = useRef("");
    const [lyricLines, setLyricLines] = useState<string[]>([])
    return (
        <div className="lyric-searcher" onClick={props.closeLyricSearcher}>
            <div className="search-wrapper" onClick={(e:React.MouseEvent) => e.stopPropagation()}>
                <div className="search">
                    <input
                        className="search-input"
                        onInput={(e:React.InputEvent<HTMLInputElement>) => {
                            artistRef.current = (e.target as HTMLInputElement).value
                        }}
                        placeholder="가수명을 입력하세요."
                    />
                    <div className="seperate-slash"> / </div>
                    <input
                        className="search-input"
                        onInput={(e:React.InputEvent<HTMLInputElement>) => {
                            titleRef.current = (e.target as HTMLInputElement).value
                        }}
                        placeholder="노래 제목을 입력하세요."
                    />
                    <button 
                        onClick={async () => {
                            if (artistRef.current.trim() === "") return;
                            const form = new FormData();
                            form.append("artist", artistRef.current);
                            form.append("title", titleRef.current);
                            const res = await fetch("/api/search-jpop", {
                                method: "POST",
                                body: form
                            });
                            const json = await res.json();
                            setLyricLines(json.lyric.split("\n"));
                        }}
                        onFocus={(e:React.FocusEvent<HTMLButtonElement>)=>e.target.blur()}
                    >
                        불러오기
                    </button>
                </div>
            </div>
            <div className="lyric-main" onClick={(e:React.MouseEvent) => e.stopPropagation()}>
                <div className="lyric-container">
                    {...lyricLines.map((l, i) => <div key={i}>{l}</div>)}
                </div>
                <button 
                    onClick={() => {
                        props.setSyncData(
                            new Article<SyncInfo>(lyricLines.map(l => toNotes(l)))
                        );
                        props.closeLyricSearcher();
                    }}
                    onFocus={(e:React.FocusEvent<HTMLButtonElement>)=>e.target.blur()}
                >
                    적용
                </button>
            </div>
        </div>
    )
}