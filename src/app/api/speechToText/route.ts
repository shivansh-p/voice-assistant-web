import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface RequestBody {
  audio: string;
}

export async function POST(request: { json: () => Promise<RequestBody> }) {
  try {
    const req = await request.json();
    const base64Audio = req.audio;
    const audio = Buffer.from(base64Audio, "base64");

    const text = await convertAudioToText(audio);

    return NextResponse.json({ result: text }, { status: 200 });
  } catch (error) {
    handleErrorResponse(error);
  }
}

async function convertAudioToText(audioData: Buffer) {
  const outputPath = "/tmp/input.webm";
  fs.writeFileSync(outputPath, audioData);

  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "whisper-1",
    });

    return response.text;
  } finally {
    fs.unlinkSync(outputPath);
  }
}

function handleErrorResponse(error: any) {
  if (error.response) {
    console.error(error.response.status, error.response.data);
    return NextResponse.json({ error: error.response.data }, { status: 500 });
  } else {
    console.error(`Error with OpenAI API request: ${error.message}`);
    return NextResponse.json(
      { error: "An error occurred during your request." },
      { status: 500 }
    );
  }
}
