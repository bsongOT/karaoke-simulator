import { useKeys } from "@/custom-hooks";

type KeyboardBoxProps = {
    keyPress:ReturnType<typeof useKeys>[0]
}
export function KeyboardBox(props: KeyboardBoxProps) {
    const {keyPress} = props;
    return (
        <div className="keyboard-box">
            <div>
                <div className="key-description">1초 전으로</div>
                <button className={"keyboard key-arrow-left" + (keyPress.ArrowLeft ? " pressed" : "")} title="1초 전으로 이동한다.">←</button>
            </div>
            <div>
                <div className="key-description">정지/재생</div>
                <button className={"keyboard key-spacebar" + (keyPress.Space ? " pressed" : "")} title="오디오를 멈추거나 재생한다.">Space</button>
            </div>
            <div>
                <div className="key-description">1초 후로</div>
                <button className={"keyboard key-arrow-right" + (keyPress.ArrowRight ? " pressed" : "")} title="1초 후로 이동한다.">→</button>
            </div>
            <div>
                <div className="key-description">채보 열기</div>
                <button className={"keyboard key-a" + (keyPress.KeyA ? " pressed" : "")} title="채보의 시작 지점을 설정한다.">A</button>
            </div>
            <div>
                <div className="key-description">채보 닫기</div>
                <button className={"keyboard key-s" + (keyPress.KeyS ? " pressed" : "")} title="채보의 끝 지점을 설정한다.">S</button>
            </div>
            <div>
                <div className="key-description">채보 지우기</div>
                <button className={"keyboard key-backspace" + (keyPress.Backspace ? " pressed" : "")} title="현재 채보를 지우고 포커스를 전 채보로 이동한다.">←Backspace</button>
            </div>
        </div>
    )
}