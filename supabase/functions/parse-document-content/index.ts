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
    const { fileContent, fileName, mimeType } = await req.json();
    
    if (!fileContent || !fileName) {
      throw new Error('Missing file content or filename');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    console.log('Parsing document:', fileName, 'Type:', mimeType);

    // Decode base64 to binary
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let extractedText = '';

    if (fileExtension === 'pdf') {
      // Parse PDF - extract text between stream objects
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      
      // Extract text content from PDF streams
      const streamRegex = /stream\s*(.*?)\s*endstream/gs;
      const matches = text.matchAll(streamRegex);
      
      const textParts: string[] = [];
      for (const match of matches) {
        const streamContent = match[1];
        // Try to extract readable text
        const readableText = streamContent.match(/[a-zA-Z0-9\s.,;:!?'"()\-\[\]{}]+/g);
        if (readableText) {
          textParts.push(...readableText);
        }
      }
      
      // Also try to extract text objects
      const textObjectRegex = /\((.*?)\)\s*Tj/g;
      const textMatches = text.matchAll(textObjectRegex);
      for (const match of textMatches) {
        textParts.push(match[1]);
      }
      
      extractedText = textParts.join(' ').replace(/\s+/g, ' ').trim();
      
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Could not extract sufficient text from PDF. The file may be image-based or use unsupported encoding.');
      }
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      // Parse DOCX - it's a ZIP file containing XML
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      
      // Extract text from word/document.xml content
      const textRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
      const matches = text.matchAll(textRegex);
      
      const textParts: string[] = [];
      for (const match of matches) {
        textParts.push(match[1]);
      }
      
      extractedText = textParts.join(' ').replace(/\s+/g, ' ').trim();
      
      // Fallback: try general text extraction
      if (!extractedText || extractedText.length < 100) {
        const fallbackMatches = text.match(/[a-zA-Z0-9\s.,;:!?'"()\-]{50,}/g);
        if (fallbackMatches) {
          extractedText = fallbackMatches.join(' ').replace(/\s+/g, ' ').trim();
        }
      }
      
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Could not extract sufficient text from Word document. Please try saving as PDF or TXT format.');
      }
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '')) {
      throw new Error('Image OCR is not yet supported. Please convert your image to text using an OCR tool first, or upload a PDF with embedded text.');
    } else {
      throw new Error(`Unsupported file type: .${fileExtension}`);
    }

    console.log(`Successfully extracted ${extractedText.length} characters from ${fileName}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        content: extractedText,
        length: extractedText.length,
        fileName: fileName
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
