import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { download, getSyncDataBlob, toNotes } from "@/utils";
import { useRef } from "react";

export function LyricToolBox(props:{syncData:Article<SyncInfo>, setSyncData:(syncData:Article<SyncInfo>)=>void, setCurrentIndex: (index:[number, number]) => void, openSearcher:()=>void}){
    const file = useRef<HTMLInputElement>(null);
    async function loadSync(e:React.ChangeEvent<HTMLInputElement>){
        const text = await e.target.files?.[0].text();
        if (!text) return;
        const sd = new Article<SyncInfo>(JSON.parse(text));
        props.setSyncData(sd);
        props.setCurrentIndex(sd.lastIndex);
        e.target.value = '';
    }
    async function saveSync(){
        download(URL.createObjectURL(await getSyncDataBlob(props.syncData)), "sync.json")
    }
    function splitLine(){
        const syncData = props.syncData;
        for (let i = 0; i < syncData.map(_ => _).length; i++){
            const line = syncData.lineAt(i);
            const sentence = line.map(si => si.word).join("");

            if (getSentenceWidth(sentence) <= 12) continue;
            
            syncData.removeLine(i);
            syncData.insertLine(i, ...splitSentence(sentence).map(s => toNotes(s)));
	    }
        props.setSyncData(new Article(syncData.map(_ => _)));
    }
    return (
        <div className="lyric-tool-box">
            <input className="sync-file-input" onChange={loadSync} ref={file} type="file" accept=".json"/>
            <button onClick={() => file.current?.click()}>로드</button>
            <button onClick={saveSync}>저장</button>
            <button onClick={props.openSearcher}>가사 검색</button>
            <button onClick={splitLine}>가사 분리</button>
        </div>
    )
}

function getSentenceWidth(sentence:string){
	return sentence.split("").map<number>(l => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(l) ? 1 : 0.5).reduce((a, b) => a + b);
}

function splitSentence(sentence:string){
	let splitWidth = 0;
    let beforeSplitIndex = -1;
	let splitIndex = 0;
    const sentences = [];
	const totalWidth = getSentenceWidth(sentence);
	const averageWidth = totalWidth / Math.ceil(totalWidth / 14);

	for (let j = 0; j < sentence.length; j++){
		splitWidth += /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(sentence[j]) ? 1 : 0.5;
        if (sentence[j] === ' ') splitIndex = j;
		if (splitWidth > averageWidth) {
            sentences.push(sentence.slice(beforeSplitIndex + 1, splitIndex));
            beforeSplitIndex = splitIndex;
            splitWidth = 0;
        }
	}
    if (beforeSplitIndex !== sentence.length - 1){
        sentences.push(sentence.slice(beforeSplitIndex + 1))
    }

	return sentences.filter(s=> s !== "");
}