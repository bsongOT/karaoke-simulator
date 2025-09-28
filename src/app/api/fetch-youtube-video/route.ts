import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        return await new Promise<NextResponse>(async resolve => {
            const url = (await req.formData()).get("url") as string;
            const ytdl = spawn("./node_modules/youtube-dl-exec/bin/yt-dlp", ["-f", "best", "-o", "-", url]);
            const chunks: Buffer[] = [];

            ytdl.stdout.on("data", (chunk) => chunks.push(chunk));
            ytdl.stderr.on("data", console.log);

            ytdl.on("close", (code) => {
                if (code === 0) {
                    const buffer = Buffer.concat(chunks);
                    
                    resolve(new NextResponse(buffer, {
                        headers: {
                            "Content-Type": "video/mp4"
                        }
                    }));
                } 
                else {
                    resolve(NextResponse.json({error: "execution fail"}));
                }
            })
        });
    }
    catch (e:unknown){
        return NextResponse.json({error: (e as {message:string}).message});
    }
}