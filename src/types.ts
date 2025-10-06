import { useResultOption } from "./custom-hooks"

export type Product = {
  name: string,
  music: Blob | undefined,
  src: string | undefined,
  mr: Blob | undefined,
  vocal: Blob | undefined,
  karaokeVideo: Blob | undefined,
  singAlongVideo: Blob | undefined,
  dataJson: Blob | undefined
}
export enum Slide {
  Submit = 0,
  Main = 1,
  Build = 2
}
export enum Shortcut {
  Left,
  Right,
  Space,
  Backspace,
  A,
  S
}
export type ResultOption = ReturnType<typeof useResultOption>;