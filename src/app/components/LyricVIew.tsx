import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { toNotes } from "@/utils";
import { useRef, useState } from "react";

export function LyricView(props:{syncData:Article<SyncInfo>, rerenderSync:()=>void, currentIndex:[number, number], setCurrentIndex:(idx:[number, number])=>void}){
    return (
        <ul className="lyric-view">
            {...props.syncData.map((_, i) => <Line key={i} syncData={props.syncData} index={i} currentIndex={props.currentIndex} rerenderSync={props.rerenderSync} setCurrentIndex={props.setCurrentIndex}/>)}
        </ul>
    );
}
function Line(props:{syncData:Article<SyncInfo>, index:number, currentIndex:[number, number], rerenderSync:()=>void, setCurrentIndex:(idx:[number, number])=>void}){
    const [isTyping, setIsTyping] = useState(false);
    const textfield = useRef<HTMLTextAreaElement>(null);
    const onClick = function(e:React.MouseEvent){
        if (e.altKey) return;
        setIsTyping(true);
        setTimeout(() => {
            if (!textfield.current) return;
            textfield.current.focus();
            textfield.current.value = props.syncData.lineAt(props.index).map(si => si.word).join("");
        })
    }
    const onStopTyping = function(){
        setIsTyping(false);
    }
    const onInput = function(e:React.InputEvent<HTMLTextAreaElement>){
        const text = e.target as HTMLTextAreaElement;
        const lines = (
            text.value
                .split("\n")
                .map(l => l.trim())
                .filter(l => l !== "")
        );

        const line = props.syncData.lineAt(props.index);
        line.splice(0, line.length);
        line.push(...toNotes(lines.length >= 1 ? lines[0] : "라라라라"));

        if (lines.length > 1){
            props.syncData.insertLine(props.index + 1, ...lines.slice(1).map(v => toNotes(v)));
        }
        props.rerenderSync();
    }
    const removeLine = function(e:React.MouseEvent){
        e.stopPropagation();
        if (props.syncData.lastIndex[0] === 0) return;
        props.syncData.removeLine(props.index);
        props.rerenderSync();
    }
    const addLine = function(e:React.MouseEvent){
        e.stopPropagation();
        props.syncData.insertLine(props.index + 1, "라라라라".split("").map(c => new SyncInfo(c, -1, -1)));
        props.rerenderSync();
    }
        
    return (
        <li className={"line" + (isTyping ? " typing" : "")} onClick={onClick}>
            <div className="line-display">
                {...props.syncData.lineAt(props.index).map(
                    (n, i) => (
                        <Letter 
                            key={i}
                            letter={n}
                            isCurrent={props.currentIndex[0] === props.index && props.currentIndex[1] === i}
                            index={[props.index, i]}
                            setCurrentIndex={props.setCurrentIndex}
                        />
                    )
                )}
            </div>
            <textarea ref={textfield} className="line-text" rows={1} onBlur={onStopTyping} onInput={onInput}></textarea>
            <button className="line-remover" onClick={removeLine}>−</button>
            <button className="line-adder" onClick={addLine}>+</button>
        </li>
    )
}

function Letter(props:{letter:SyncInfo, isCurrent:boolean, index:[number, number], setCurrentIndex:(idx:[number, number])=>void}){
    const className = (
        "letter" + 
        (props.letter.start >= 0 ? " synced-open" : "") + 
        (props.letter.end >= 0 ? " synced-close" : "") +
        (props.isCurrent ? " current" : "")
    )
    const onClick = (e:React.MouseEvent) => {
        if (!e.altKey) return;
        props.setCurrentIndex(props.index);
    }
    return (
        <span className={className} onClick={onClick}>{props.letter.word}</span>
    )
}