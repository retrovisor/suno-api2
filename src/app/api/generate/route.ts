import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers'
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      // Parse the incoming JSON request body
      const body = await req.json();
      const { prompt, make_instrumental, model, wait_audio } = body;

      // Validate the required fields
      if (!prompt || typeof prompt !== 'string') {
        return new NextResponse(JSON.stringify({ error: 'Invalid or missing "prompt" field.' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Generate the audio using the sunoApi
      const audioInfo = await (await sunoApi((await cookies()).toString())).generate(
        prompt,
        Boolean(make_instrumental),
        model || DEFAULT_MODEL,
        Boolean(wait_audio)
      );

      // Return the successful response
      return new NextResponse(JSON.stringify(audioInfo), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      // Initialize default error message and status
      let errorMessage = 'Internal server error.';
      let statusCode = 500;

      // Enhanced logging for different error scenarios
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.error('Error generating custom audio:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });

        // Handle specific status codes
        if (error.response.status === 402) {
          errorMessage = error.response.data.detail || 'Payment Required.';
          statusCode = 402;
        } else {
          errorMessage = error.response.data.detail
            ? `Internal server error: ${error.response.data.detail}`
            : 'Internal server error.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response received from the server.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up the request:', error.message || error);
        errorMessage = error.message || 'An unexpected error occurred.';
      }

      // Return the appropriate error response to the client
      return new NextResponse(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } else {
    // Handle unsupported HTTP methods
    return new NextResponse('Method Not Allowed', {
      headers: {
        Allow: 'POST',
        ...corsHeaders
      },
      status: 405
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
