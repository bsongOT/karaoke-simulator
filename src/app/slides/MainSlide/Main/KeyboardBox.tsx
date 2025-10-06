import { Shortcut } from "@/types";

type KeyboardBoxProps = {
    keyPress?:Set<Shortcut>
}
export function KeyboardBox(props: KeyboardBoxProps) {
    const {keyPress} = props;
    return (
        <div className="keyboard-box">
            <div>
                <div className="key-description">1초 전으로</div>
                <button className={"keyboard key-arrow-left" + (keyPress?.has(Shortcut.Left) ? " pressed" : "")} title="Go 1 second ago">←</button>
            </div>
            <div>
                <div className="key-description">정지/재생</div>
                <button className={"keyboard key-spacebar" + (keyPress?.has(Shortcut.Space) ? " pressed" : "")} title="Stop audio">Space</button>
            </div>
            <div>
                <div className="key-description">1초 후로</div>
                <button className={"keyboard key-arrow-right" + (keyPress?.has(Shortcut.Right) ? " pressed" : "")} title="Go 1 second later">→</button>
            </div>
            <div>
                <div className="key-description">채보 열기</div>
                <button className={"keyboard key-a" + (keyPress?.has(Shortcut.A) ? " pressed" : "")} title="Open new sync">A</button>
            </div>
            <div>
                <div className="key-description">채보 닫기</div>
                <button className={"keyboard key-s" + (keyPress?.has(Shortcut.S) ? " pressed" : "")} title="Close current sync">S</button>
            </div>
            <div>
                <div className="key-description">채보 지우기</div>
                <button className={"keyboard key-backspace" + (keyPress?.has(Shortcut.Backspace) ? " pressed" : "")} title="Delete current sync">←Backspace</button>
            </div>
        </div>
    )
}