import { NextResponse } from "next/server";

// Generate an access token using the client ID and secret
async function generateAccessToken() {
  try {
    const clientIdRaw = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecretRaw = process.env.PAYPAL_SECRET_KEY;
    
    if (!clientIdRaw || !clientSecretRaw) {
      throw new Error("PayPal client ID or secret key is missing");
    }
    
    // Clean up the credentials - remove any whitespace or unexpected characters
    const clientId = clientIdRaw.trim();
    const clientSecret = clientSecretRaw.trim();
    
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate PayPal access token:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { orderID } = await request.json();
    
    if (!orderID) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Generate access token
    const accessToken = await generateAccessToken();
    
    // Capture the order payment
    const url = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data);
    } else {
      console.error("PayPal capture failed:", data);
      return NextResponse.json(
        { error: "Failed to capture PayPal payment", details: data },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Error capturing PayPal payment:", error);
    return NextResponse.json(
      { error: "An error occurred while capturing the payment" },
      { status: 500 }
    );
  }
} 