import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get('f');
  if (!filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  }

  // Sanitize: only allow tts-*.wav files from /tmp
  const safeName = path.basename(filename);
  if (!safeName.startsWith('tts-') || !safeName.endsWith('.wav')) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  const filePath = path.join('/tmp', safeName);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);

  // Clean up after serving
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    },
  });
}
