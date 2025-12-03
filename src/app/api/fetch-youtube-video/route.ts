import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        return await new Promise<NextResponse>(async resolve => {
            const url = (await req.formData()).get("url") as string;
            const ytdl = spawn("yt-dlp", [
                "-S", "+filesize,+filesize_approx",
                "-f", "b[filesize>10M]/b[filesize_approx>10M]/b*[filesize<=10M]/b*[filesize_approx<=10M]", 
                "-o", "-", url, 
                "--no-warnings"
            ]);
            const chunks: Buffer[] = [];

            ytdl.stdout.on("data", (chunk) => chunks.push(chunk));
            ytdl.stderr.on("data", (chunk) => console.log(chunk.toString()));

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