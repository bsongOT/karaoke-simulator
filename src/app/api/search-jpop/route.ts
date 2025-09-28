import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { toHiragana } from "wanakana";
import { kanaStringToHangul } from "@/kana-hangul/converter";

export async function POST(req: NextRequest) {
  try {
    const url = ((await req.formData()).get("url") ?? "") as string;
    if (url === "") return NextResponse.json({ error: "invalid url" });
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    const $ = cheerio.load(data);
    const container = $(".hiragana");
    let lyric = "";
    container.contents().each((_, r) => {
        if (r.type === "text") lyric += $(r).text().trim();
        else if ($(r).hasClass("ruby")) lyric += " " + $(r).find(".rt").text();
        else lyric += "\n";
    });
    lyric = lyric.split("\n")
      .filter(sen => sen.trim().length >= 1)
      .map(sen => toHiragana(sen.trim()))
      .map(sen => kanaStringToHangul(sen))
      .map(sen => {
        const arr = new Array<string>();
        const words = sen.split(" ");
        let str = "";
        let current = 0;
        for (let i = 0; i < words.length; i++){
          str += " " + words[i];
          current += words[i].length;
          if (current + (words[i + 1] ?? "").length > 12 || i === words.length - 1){
            arr.push(str.trim());
            str = "";
            current = 0;
          }
        }
        return arr;
      })
      .flat()
      .join("\n");
    return NextResponse.json({ lyric });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}