import { NextResponse } from 'next/server';

// This route is deprecated - using Clerk authentication instead
export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'This authentication endpoint is deprecated. Please use Clerk authentication.' },
    { status: 410 } // Gone status code
  );
}

export async function GET(request: Request) {
  // Redirect to Clerk sign-in page
  return NextResponse.redirect(new URL('/sign-in', request.url));
}