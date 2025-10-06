import { AudioManager } from "@/AudioManager";
import { useRef, useState } from "react";

export function VolumeController(props:{audio:AudioManager | null, mrStatus:"ready" | "pending" | "error", melodyStatus:"ready" | "pending"}) {
    const {audio, mrStatus, melodyStatus} = props;

    return (
        <div>
            {mrStatus !== "ready" ?
                <VolumeSlider 
                    title="볼륨" 
                    value={audio?.volume[0] ?? 0} 
                    setValue={v => audio?.setVolume(0, v)}
                /> : <>
                <VolumeSlider 
                    title="MR 볼륨" 
                    value={audio?.volume[1] ?? 0} 
                    setValue={v => audio?.setVolume(1, v)}
                />
                <VolumeSlider
                    title="보컬 볼륨"
                    value={audio?.volume[2] ?? 0} 
                    setValue={v => audio?.setVolume(2, v)}
                />
                {melodyStatus === "ready" &&
                <VolumeSlider
                    title="멜로디 볼륨"
                    value={audio?.volume[3] ?? 0} 
                    setValue={v => audio?.setVolume(3, v)}
                />
                }
                </>
            }
        </div>
    )
}
type VolumeSliderProps = {
    title:string,
    value: number,
    setValue: (v: number) => void
}
function VolumeSlider(props: VolumeSliderProps) {
    const isDraggingRef = useRef<boolean>(false);
    const [draggingValue, setDraggingValue] = useState(0);

    return (
        <div>
            <div>{props.title}</div>
            <input
                type="range"
                step="0.01"
                min="0"
                max="1"
                value={isDraggingRef.current ? draggingValue : props.value}
                onInput={(e: React.InputEvent<HTMLInputElement>) => {
                    const val = Number((e.target as HTMLInputElement).value);
                    setDraggingValue(val);
                    props.setValue(val);
                }}
                onMouseDown={() => {
                    isDraggingRef.current = true;
                }}
                onMouseUp={(e:React.MouseEvent<HTMLInputElement>) => {
                    isDraggingRef.current = false;
                    (e.target as HTMLElement).blur();
                }}
                onFocus={(e:React.FocusEvent) => {(e.target as HTMLElement).blur();}}
            />
        </div>
    )
}