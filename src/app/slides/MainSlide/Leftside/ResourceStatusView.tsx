import { Checkmark } from "@/app/components/Icons"
import { GoXCircleFill } from "react-icons/go"
import { ClipLoader } from "react-spinners"

type ResourceStatusViewProps = {
    musicFileStatus: "error" | "pending" | "ready",
    mrStatus:"error" | "pending" | "ready",
    melodyStatus:"pending" | "ready",
    resultStatus:"pending" | "ready"
}
export function ResourceStatusView(props:ResourceStatusViewProps){
    return (
        <div className="resource-status-view">
            <div className={`status-item ${props.musicFileStatus}`}>{{
                pending: <><ClipLoader color="var(--inactive-color)" size="1em"/>&nbsp;음악 파일</>,
                error: <><GoXCircleFill strokeWidth="1px" fill="red"/>&nbsp;음악 파일</>,
                ready: <><Checkmark size="1em"/>&nbsp;음악 파일</>
            }[props.musicFileStatus]}</div>
            <div className={`status-item ${props.mrStatus}`}>{{
                pending: <><ClipLoader color="var(--inactive-color)" size="1em"/>&nbsp;MR</>,
                error: <><GoXCircleFill strokeWidth="1px" fill="red"/>&nbsp;MR</>,
                ready: <><Checkmark size="1em"/>&nbsp;MR</>
            }[props.mrStatus]}</div>
            <div className={`status-item ${props.melodyStatus}`}>{{
                pending: <><ClipLoader color="var(--inactive-color)" size="1em"/>&nbsp;멜로디</>,
                ready: <><Checkmark size="1em"/>&nbsp;멜로디</>                
            }[props.melodyStatus]}</div>
            <div className={`status-item ${props.resultStatus}`}>{{
                pending: <><ClipLoader color="var(--inactive-color)" size="1em"/>&nbsp;결과물</>,
                ready: <><Checkmark size="1em"/>&nbsp;결과물</>
            }[props.resultStatus]}</div>
        </div>
    )
}