import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  const buffer = Buffer.from(await file.arrayBuffer());

  const pinataApiKey = process.env.PINATA_API_KEY!;
  const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY!;

  console.log("Pinata API Key:", pinataApiKey);
  console.log("Pinata Secret API Key:", pinataSecretApiKey);

  const form = new FormData();
  form.append("file", new Blob([buffer]), file.name);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
    body: form,
  });

  const result = await res.json();
  return NextResponse.json(result);
}
