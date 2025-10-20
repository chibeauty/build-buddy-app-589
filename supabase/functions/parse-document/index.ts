import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let extractedText = '';
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // Handle different file types
    if (fileExtension === 'txt' || fileExtension === 'md') {
      // Plain text files
      const decoder = new TextDecoder('utf-8');
      extractedText = decoder.decode(uint8Array);
    } else if (fileExtension === 'pdf') {
      // For PDFs, extract text using basic parsing
      // This is a simplified approach - for production, consider using a proper PDF parser
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(uint8Array);
      
      // Try to extract readable text between common PDF markers
      const textMatches = text.match(/[a-zA-Z0-9\s.,;:!?'"()\-\[\]{}]{50,}/g);
      if (textMatches) {
        extractedText = textMatches.join(' ').replace(/\s+/g, ' ').trim();
      }
      
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Could not extract readable text from PDF. The file may be image-based or encrypted.');
      }
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      // For DOCX files, try to extract text
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(uint8Array);
      
      // Extract text from DOCX XML structure
      const textMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (textMatches) {
        extractedText = textMatches
          .map(match => match.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // Fallback to general text extraction
      if (!extractedText || extractedText.length < 100) {
        const fallbackMatches = text.match(/[a-zA-Z0-9\s.,;:!?'"()\-\[\]{}]{50,}/g);
        if (fallbackMatches) {
          extractedText = fallbackMatches.join(' ').replace(/\s+/g, ' ').trim();
        }
      }
      
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Could not extract readable text from Word document. Please try converting to TXT format.');
      }
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '')) {
      // For images, we would need OCR
      throw new Error('Image OCR is not yet supported. Please convert your image to text first or use a PDF with embedded text.');
    } else {
      throw new Error(`Unsupported file type: .${fileExtension}`);
    }

    console.log('Successfully extracted text, length:', extractedText.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        text: extractedText,
        length: extractedText.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing document:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to parse document' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
