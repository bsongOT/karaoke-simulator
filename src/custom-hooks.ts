import { useEffect, useRef, useState } from "react";

export function useStateRef<T>(defaultValue:T){
    const ref = useRef<T>(defaultValue);
    const [state, setState] = useState<T>(defaultValue);

    useEffect(() => {ref.current = state}, [state]);

    return {
        get current(){
            return ref.current;
        },
        set current(v){
            setState(v);
            ref.current = v;
        }
    }
}
export function useForceUpdate(){
    const [toggle, setToggle] = useState(0);

    return () => setToggle(1 - toggle);
}
export function useKeys(){
    const [ArrowLeft, setArrowLeft] = useState(false);
    const [ArrowRight, setArrowRight] = useState(false);
    const [Space, setSpace] = useState(false);
    const [Backspace, setBackspace] = useState(false);
    const [KeyA, setKeyA] = useState(false);
    const [KeyS, setKeyS] = useState(false);

    return [
        {
            ArrowLeft,
            ArrowRight,
            Space,
            Backspace,
            KeyA,
            KeyS
        },
        {
            ArrowLeft: setArrowLeft,
            ArrowRight: setArrowRight,
            Space: setSpace,
            Backspace: setBackspace,
            KeyA: setKeyA,
            KeyS: setKeyS
        }
    ] as const
}
export function useStatuses(){
    const [musicFileStatus, setMusicFileStatus] = useState("pending" as "pending" | "error" | "ready");
    const [mrStatus, setMrStatus] = useState("pending" as "pending" | "error" | "ready");
    const [melodyStatus, setMelodyStatus] = useState("pending" as "pending" | "ready");

    return [
        {
            musicFileStatus,
            mrStatus,
            melodyStatus
        },
        {
            setMusicFileStatus,
            setMrStatus,
            setMelodyStatus
        }
    ] as const
}
export function useResultOption(){
    const [includesMusic, setIncludesMusic] = useState(true);
    const [includesMR, setIncludesMR] = useState(true);
    const [includesMelodicMR, setIncludesMelodicMR] = useState(true);
    const [includesMelodicKaraoke, setIncludesMelodicKaraoke] = useState(true);
    const [includesSingAlong, setIncludesSingAlong] = useState(true);
    const [includesData, setIncludesData] = useState(true);
    return [
        {
            includesMusic,
            includesMR,
            includesMelodicMR,
            includesMelodicKaraoke,
            includesSingAlong,
            includesData
        },
        {
            setIncludesMusic,
            setIncludesMR,
            setIncludesMelodicMR,
            setIncludesMelodicKaraoke,
            setIncludesSingAlong,
            setIncludesData
        }
    ] as const
}