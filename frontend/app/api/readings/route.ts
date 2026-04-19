import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'telemetry.json');

if (!fs.existsSync(dbPath)) {
     fs.writeFileSync(dbPath, JSON.stringify([]));
}

export async function POST(req: Request) {
     try {
          const data = await req.json();

          const newData = {
               ...data,
               timestamp: new Date().toISOString(),
               lat: 21.15,
               lng: 79.09,
          };

          const fileContent = fs.readFileSync(dbPath, 'utf8');
          const logs = JSON.parse(fileContent);

          logs.unshift(newData);

          if (logs.length > 100) logs.pop();

          fs.writeFileSync(dbPath, JSON.stringify(logs, null, 2));

          return NextResponse.json({ message: 'Success', data: newData }, { status: 200 });
     } catch (error) {
          console.error('Error processing POST:', error);
          return NextResponse.json({ error: 'Failed to save telemetry' }, { status: 500 });
     }
}

export async function GET() {
     try {
          const fileContent = fs.readFileSync(dbPath, 'utf8');
          return NextResponse.json(JSON.parse(fileContent), { status: 200 });
     } catch (error) {
          return NextResponse.json([], { status: 500 });
     }
}