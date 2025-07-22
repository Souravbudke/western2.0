import { NextResponse } from "next/server";

// Generate an access token using the client ID and secret
async function generateAccessToken() {
  try {
    // Use credentials from environment variables
    const clientIdRaw = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecretRaw = process.env.PAYPAL_SECRET_KEY;
    
    if (!clientIdRaw || !clientSecretRaw) {
      throw new Error('PayPal credentials are missing in environment variables');
    }
    
    // Clean up the credentials - remove any whitespace or unexpected characters
    const clientId = clientIdRaw.trim();
    const clientSecret = clientSecretRaw.trim();
    
    console.log('Client ID length:', clientId.length);
    console.log('Client Secret length:', clientSecret.length);
    
    // Create Basic auth string
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Use api-m.sandbox.paypal.com for authentication ALWAYS
    const tokenUrl = 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
    
    console.log('Using PayPal token URL:', tokenUrl);
    console.log('Requesting PayPal access token');
    
    // Log the credentials being used (partially masked)
    console.log('Using PayPal credentials:', {
      clientId: clientId ? `${clientId.substring(0, 8)}...` : 'missing',
      clientSecret: 'provided (masked)'
    });
    
    // Make token request with improved error handling
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayPal token request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }

    // Parse the response
    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Empty response when requesting access token');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse token response:', responseText);
      throw new Error('Invalid JSON in token response');
    }

    if (!data.access_token) {
      console.error('No access token in response:', data);
      throw new Error('Access token not found in response');
    }

    return data.access_token;
  } catch (error) {
    console.error("Error generating access token:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Parse and validate request
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('PayPal create-order request body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const { items, amount, cartTotal, shippingAddress } = requestBody;
    
    console.log('Processing order with total:', { amountUSD: amount, cartTotalINR: cartTotal });
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty items array" },
        { status: 400 }
      );
    }
    
    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }
    
    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.streetAddress ||
        !shippingAddress.city || !shippingAddress.postalCode) {
      return NextResponse.json(
        { error: "Incomplete shipping address" },
        { status: 400 }
      );
    }
    
    // Get access token
    let accessToken;
    try {
      accessToken = await generateAccessToken();
    } catch (tokenError) {
      console.error('Failed to generate PayPal access token:', tokenError);
      return NextResponse.json(
        { error: "Failed to authenticate with PayPal" },
        { status: 500 }
      );
    }
    
    // Set up the PayPal order request
    const apiUrl = 'https://api-m.sandbox.paypal.com';
    const orderUrl = `${apiUrl}/v2/checkout/orders`;
    
    
    console.log('Creating PayPal order at:', orderUrl);
    
    // Convert country to 2-letter ISO code
    let countryCode = "US"; // Default
    if (shippingAddress.country) {
      if (shippingAddress.country === "India") {
        countryCode = "IN";
      } else if (shippingAddress.country === "United States" || shippingAddress.country === "USA") {
        countryCode = "US";
      } else if (shippingAddress.country.length === 2) {
        // Assume it's already a valid 2-letter code
        countryCode = shippingAddress.country.toUpperCase();
      }
    }
    
    // For PayPal, we're using USD (amount is already converted from frontend)
    // Note: In production, use a real-time currency conversion API
    const usdAmount = amount; // Amount is already in USD from the frontend
    
    // Calculate item total from the items (which are already in USD)
    const itemTotal = items.reduce((total: number, item: any) => {
      // Use the price directly from the item since we're not sending unit_amount from frontend
      const itemPrice = parseFloat(item.price) * 0.012; // Convert INR to USD
      return total + (itemPrice * parseInt(item.quantity));
    }, 0);
    
    console.log(`Payment details: ${usdAmount.toFixed(2)} USD (original: ${cartTotal} INR)`);
    
    console.log(`Amount in USD: ${usdAmount.toFixed(2)} USD`);
    console.log(`Item total in USD: ${itemTotal.toFixed(2)}`);
    
    // Map PayPal items (convert from INR to USD)
    const paypalItems = items.map((item: any) => {
      // Convert price from INR to USD
      const priceUSD = (parseFloat(item.price) * 0.012).toFixed(2);
      
      return {
        name: item.name.substring(0, 127), // PayPal has character limits
        quantity: item.quantity.toString(),
        unit_amount: {
          currency_code: "USD",
          value: priceUSD,
        },
      };
    });
    
    // Create order payload
    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: usdAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: itemTotal.toFixed(2),
              },
              shipping: {
                currency_code: "USD",
                value: "0.00",
              },
            },
          },
          items: paypalItems,
          shipping: {
            name: {
              full_name: shippingAddress.fullName.substring(0, 300), // PayPal has character limits
            },
            address: {
              address_line_1: shippingAddress.streetAddress.substring(0, 300),
              admin_area_2: shippingAddress.city.substring(0, 120),
              admin_area_1: shippingAddress.state ? shippingAddress.state.substring(0, 120) : "",
              postal_code: shippingAddress.postalCode.substring(0, 60),
              country_code: countryCode,
            },
          },
        },
      ],
      application_context: {
        brand_name: "WesternStreet",
        shipping_preference: "SET_PROVIDED_ADDRESS",
        user_action: "PAY_NOW",
        return_url: request.headers.get("origin") ? 
          `${request.headers.get("origin")}/store/checkout/payment` : 
          'http://localhost:3000/store/checkout/payment',
        cancel_url: request.headers.get("origin") ? 
          `${request.headers.get("origin")}/store/checkout/payment` : 
          'http://localhost:3000/store/checkout/payment',
      },
    };
    
    // Make API request
    let response;
    try {
      response = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      console.error('Network error calling PayPal API:', fetchError);
      return NextResponse.json(
        { error: "Network error when contacting PayPal" },
        { status: 500 }
      );
    }
    
    // Get response as text first
    let responseText;
    try {
      responseText = await response.text();
      console.log('PayPal API response status:', response.status);
    } catch (textError) {
      console.error('Error reading PayPal response:', textError);
      return NextResponse.json(
        { error: "Error reading PayPal response" },
        { status: 500 }
      );
    }
    
    // Parse JSON response if available
    let data;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Invalid JSON in PayPal response:', responseText);
        return NextResponse.json(
          { error: "Invalid response format from PayPal" },
          { status: 500 }
        );
      }
    } else {
      console.error('Empty response from PayPal');
      return NextResponse.json(
        { error: "Empty response from PayPal" },
        { status: 500 }
      );
    }
      
    // Process response based on status
    if (response.ok) {
      console.log('PayPal order created successfully:', data.id);
      return NextResponse.json(data);
    } else {
      // Handle PayPal API errors
      console.error('PayPal order creation failed:', data);
      
      // Extract meaningful error message
      let errorMessage = "Failed to create PayPal order";
      if (data.details && data.details.length > 0) {
        errorMessage = data.details.map((detail: any) => detail.issue || detail.description).join('; ');
      } else if (data.message) {
        errorMessage = data.message;
      }
      
      return NextResponse.json(
        { error: errorMessage, details: data },
        { status: response.status }
      );
    }
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error creating PayPal order:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 