import FileDropzone from "@/app/components/FileDropZone";
import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { Product } from "@/types";
import { useState, useEffect, useRef } from "react";

type FileProgressProps = {
    submit: (p: Product, sd: Article<SyncInfo>) => void,
    setToken: (token:string, pd:Product)=>void
}
export function FileProgress(props: FileProgressProps) {
    const [ready, setReady] = useState(false);
    const fileRef = useRef<File>(null);

    const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setReady(false);
            return;
        }
        fileRef.current = file;

        setReady(true);
    };
    const onSubmit = async () => {
        if (!ready) return;
        if (!fileRef.current) return;
        const file = fileRef.current;
        const url = URL.createObjectURL(file);
        const product = {
            name: file.name.slice(0, file.name.lastIndexOf(".")),
            music: file,
            src: url,
            mr: undefined,
            vocal: undefined,
            karaokeVideo: undefined,
            singAlongVideo: undefined,
            dataJson: undefined
        } satisfies Product;
        const sd = new Article<SyncInfo>([[new SyncInfo(" ", -1, -1)]]);

        props.submit(product, sd);

        const formData = new FormData();
        formData.append("files", file, "pending.mp3");
        const res = await fetch("/api/seperate", {
            method: "POST",
            body: formData
        })
        const json = await res.json();
        props.setToken(json.token, product);
        window.addEventListener("beforeunload", e => {
            e.preventDefault();
        })
    }

    return (
        <div className="progress-main">
            <ul className="progress-list">
                <li className="progress-list-item">1. MR 분리</li>
                <li className="progress-list-item">2. 멜로디 따기(반자동)</li>
                <li className="progress-list-item">3. 채보 작성</li>
                <li className="progress-list-item">4. 최종 결과물 다운로드</li>
            </ul>
            <FileDropzone type="file" onChange={onUpload} accept=".mp3, .mp4"/>
            <button
                className={"start-btn" + (ready ? "" : " disabled")}
                onClick={onSubmit}
            >시작</button>
        </div>
    )
}