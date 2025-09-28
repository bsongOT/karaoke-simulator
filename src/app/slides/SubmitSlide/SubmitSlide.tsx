import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { Product } from "@/types";
import { ProgressInput } from "./ProgressInput";

type SubmitSlideProps = {
    submit:(p:Product, sd?:Article<SyncInfo>)=>void,
    setToken:(token:string, pd:Product)=>void
}
export function SubmitSlide(props:SubmitSlideProps){
    return (
        <div className="slide submit">
            <div className="submit-container">
                <ProgressInput {...props}/>
            </div>
        </div>
    )
}