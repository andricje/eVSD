import { NextRequest, NextResponse } from "next/server";
import { pinata } from "@/lib/config";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/file-services/proposal-file-service";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
        },
        { status: 413 }
      );
    }
    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid content type ${file.type}` },
        { status: 415 }
      );
    }
    const { cid } = await pinata.upload.public.file(file);
    return NextResponse.json(cid, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get("cid");
    if (!cid) {
      return NextResponse.json({ error: "CID is required" }, { status: 400 });
    }
    const { data, contentType } = await pinata.gateways.public.get(cid);
    if (!data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (!(data instanceof Blob)) {
      return NextResponse.json(
        { error: "File isn't a binary format" },
        { status: 400 }
      );
    }

    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type ${contentType}` },
        { status: 415 }
      );
    }
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
