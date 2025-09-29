import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        return await new Promise<NextResponse>(async resolve => {
            const url = (await req.formData()).get("url") as string;
            const ytdl = spawn("./node_modules/youtube-dl-exec/bin/yt-dlp", [
                "-f", "best", 
                "-o", "-", url, 
                "--no-warnings", 
                "--user-agent", 
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            ]);
            const chunks: Buffer[] = [];
            const errChunks: Buffer[] = [];

            console.log(url);
            ytdl.stdout.on("data", (chunk) => chunks.push(chunk));
            ytdl.stderr.on("data", (chunk) => {
                errChunks.push(chunk);
                console.log(chunk.toString());
            });

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
                    resolve(NextResponse.json({error: "execution fail with code " + code}));
                }
            })
        });
    }
    catch (e:unknown){
        return NextResponse.json({error: (e as {message:string}).message});
    }
}