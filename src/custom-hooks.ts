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
    ]
}