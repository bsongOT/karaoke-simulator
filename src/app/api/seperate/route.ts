import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest, res:Response){
    try {
        const url = "https://spleeter-aea3mfyqpq-du.a.run.app/seperate";
        const form = await req.formData();
        const result = await fetch(url, {
            method: "POST",
            body: form
        })

        return NextResponse.json(await result.json())
    }
    catch (e:any){
        return NextResponse.json({token: "-", error: e.message})
    }
}