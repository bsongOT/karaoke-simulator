export function Checkmark(props:{size:number|string}){
    return (
        <svg className="checkmark" viewBox="0 0 52 52" width={props.size} height={props.size}>
            <circle className="checkmark__circle" cx="50%" cy="50%" r="50%" fill="none"/>
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
    )
}