import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest, res:NextResponse){
    try {
        const url = "https://spleeter-aea3mfyqpq-du.a.run.app/fetch-result";
        const reqForm = await req.formData();
        const form = new URLSearchParams();
        form.append("token", reqForm.get("token") as string);
        const result = await fetch(url, {
            method: "POST",
            body: form
        })
        if (result.headers.get("content-type")?.includes("application/json")){
            return NextResponse.json(await result.json());
        }
        const blob = await result.blob();
        const arrBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrBuffer);

        return new NextResponse(buffer);
    }
    catch (e:any){
        return NextResponse.json({error: e.message});
    }
}