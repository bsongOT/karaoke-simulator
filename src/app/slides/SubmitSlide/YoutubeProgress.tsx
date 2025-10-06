import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { Product } from "@/types";
import React, { useState } from "react";

type YoutubeProgressProps = {
    submit:(p:Product, sd?:Article<SyncInfo>)=>void,
    setToken:(token:string, pd:Product)=>void
}
export function YoutubeProgress(props:YoutubeProgressProps){
  const [ready, setReady] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="progress-main">
      <ul className="progress-list">
        <li className="progress-list-item">1. 유튜브 영상 다운로드</li>
        <li className="progress-list-item">2. MR 분리</li>                
        <li className="progress-list-item">3. 멜로디 따기(반자동)</li>
        <li className="progress-list-item">4. 채보 작성</li>
        <li className="progress-list-item">5. 최종 결과물 다운로드</li>
      </ul>
      <input
        className="name-input"
        placeholder="노래 제목"
        value={name}
        onInput={(e:React.InputEvent<HTMLInputElement>) => {
          setName((e.target as HTMLInputElement).value);
        }}
      />
      <input 
        className="link-input" 
        placeholder="https://www.youtube.com/"
        value={url}
        onKeyUp={(e:React.KeyboardEvent) => {
          const v = (e.target as HTMLInputElement).value;
          setReady(v.startsWith("http://") || v.startsWith("https://"));
          setUrl(v);
        }}
        onInput={(e:React.InputEvent<HTMLInputElement>) => {
          const v = (e.target as HTMLInputElement).value;
          setReady(v.startsWith("http://") || v.startsWith("https://"));
          setUrl(v);
        }}
      />
      <button 
        className={"start-btn" + (ready ? "" : " disabled")}
        onClick={async () => {
          const product = {
            name: name.length === 0 ? "제목없음" : name,
            music: undefined as Blob | undefined,
            src: "",
            mr: undefined,
            vocal: undefined,
            karaokeVideo: undefined,
            singAlongVideo: undefined,
            dataJson: undefined
          };
          const sd = new Article<SyncInfo>([[new SyncInfo(" ", -1, -1)]]);
          props.submit(product, sd);

          const form = new FormData();
          form.append("url", url);
          const res = await fetch("/api/fetch-youtube-video", {
            method: "POST",
            body: form
          }).catch(() => {
            alert("유튜브 과정이 지원되지 않습니다.");
            location.reload();
            return {ytdlError: true};
          });
          if ("ytdlError" in res) return;
          const blob = await res.blob();

          product.music = blob;
          product.src = URL.createObjectURL(blob);
          window.addEventListener("beforeunload", e => {
            e.preventDefault();
          })

          props.submit(product);

          const formData = new FormData();
          formData.append("files", blob, "pending.mp3");
          const res2 = await fetch("/api/seperate", {
              method: "POST",
              body: formData
          })
          const json = await res2.json();
          props.setToken(json.token, product);
        }}
      >시작</button>
    </div> 
  )
}