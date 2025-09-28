import FileDropzone from "@/app/components/FileDropZone";
import { Article } from "@/data-struct/Article";
import { SyncInfo } from "@/SyncInfo";
import { Product } from "@/types";
import JSZip from "jszip";
import { useRef, useState } from "react";

type ZipProgressProps = {
    submit:(p:Product, sd:Article<SyncInfo>) => void
}
export function ZipProgress(props:ZipProgressProps){
  const [ready, setReady] = useState(false);
  const zipFileRef = useRef<File>(null);

  const onUpload = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const zipFile = e.target.files?.[0];
    if (!zipFile) return;
    zipFileRef.current = zipFile;
    setReady(true);
  }
  const onSubmit = async () => {
    const zipFile = zipFileRef.current;
    if (!zipFile) return;
    const jszip = new JSZip();
    const files = Object.values((await jszip.loadAsync(zipFile)).files).filter(f => !f.dir);

    if (!files) return;

    const music = await files.find(f => f.name.endsWith("music.mp3"))?.async("blob");
    const mr = await files.find(f => f.name.endsWith("mr.mp3"))?.async("blob");
    const json = await files.find(f => f.name.endsWith("sync.json"))?.async("blob");

    if (!music || !mr || !json) return;

    const musicSrc = URL.createObjectURL(music);
    const mrSrc = URL.createObjectURL(mr);

    const product = {
      name: zipFile.name.slice(0, zipFile.name.lastIndexOf(".")),
      youtube: "",
      music: music,
      src: musicSrc,
      mr: mr,
      mrSrc: mrSrc,
      vocal: undefined,
      vocalSrc: "",
      karaokeVideo: undefined,
      singAlongVideo: undefined,
      dataJson: json
    }
    const sd = new Article<SyncInfo>(JSON.parse(await json.text()));
    props.submit(product, sd);
  }

  return (
    <div className="progress-main">
      <ul className="progress-list">
        <li>1. 압축 해제</li>
        <li>2. 채보 수정</li>
        <li>3. 최종 결과물 다운로드</li>
      </ul>
      <FileDropzone type="file" onChange={onUpload} accept=".zip"/>
      <button 
        className={"start-btn" + (ready ? "" : " disabled")}
        onClick={onSubmit}
      >시작</button>
    </div> 
  )
}