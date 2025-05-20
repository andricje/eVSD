"use server";

export async function uploadToPinata(fileData: FormDataEntryValue) {
  try {
    const file = fileData as File;
    const buffer = Buffer.from(await file.arrayBuffer());

    const pinataApiKey = process.env.PINATA_API_KEY!;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY!;

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

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Pinata upload failed:", errorText);
      throw new Error(`Pinata upload failed: ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
