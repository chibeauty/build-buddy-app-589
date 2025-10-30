# AI Module Workflows

## Overview

ExHub leverages AI capabilities through the Lovable AI Gateway to power personalized learning features. All AI operations are executed through secure Supabase Edge Functions to protect API keys and manage credits.

## AI Integration Architecture

```
User Request → Frontend → Edge Function → Lovable AI Gateway → Response Processing → User Interface
```

### Key Principles

- **Backend-First**: All AI calls go through edge functions, never directly from the client
- **Credit Management**: AI credits are tracked and deducted per operation
- **Error Handling**: Rate limits (429) and payment errors (402) are surfaced to users
- **Security**: API keys remain on the backend, never exposed to clients

## AI Features & Workflows

### 1. Quiz Generation

**Endpoint**: `generate-quiz`  
**Model**: `google/gemini-2.5-flash` (default)  
**Credits**: Variable based on content size

**Workflow**:
1. User provides content (upload file, paste text, or select topic)
2. Frontend sends request to `/functions/v1/generate-quiz`
3. Edge function:
   - Validates user has sufficient AI credits
   - Constructs prompts with difficulty level and question type preferences
   - Calls Lovable AI Gateway
   - Parses JSON response and validates structure
   - Returns generated questions
4. Frontend displays quiz preview with edit options

**Input Parameters**:
```typescript
{
  content: string;           // Source material
  subject: string;           // Topic/category
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;     // Number of questions to generate
  questionTypes: string[];   // ['multiple_choice', 'true_false', 'short_answer']
}
```

**Output Format**:
```typescript
{
  questions: [
    {
      question: string;
      type: string;
      options?: string[];    // For multiple choice
      correct_answer: string;
      explanation: string;
    }
  ]
}
```

### 2. Flashcard Generation

**Endpoint**: `generate-flashcards`  
**Model**: `google/gemini-2.5-flash`  
**Credits**: Variable based on content size

**Workflow**:
1. User uploads content or selects material
2. Frontend sends request with content and card count
3. Edge function:
   - Validates content and parameters
   - Creates prompts optimized for spaced repetition
   - Calls AI Gateway
   - Returns structured flashcard data
4. Frontend creates deck and displays cards

**Input Parameters**:
```typescript
{
  content: string;
  subject: string;
  cardCount: number;
}
```

**Output Format**:
```typescript
{
  flashcards: [
    {
      front: string;
      back: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }
  ]
}
```

### 3. Study Plan Generation

**Endpoint**: `generate-study-plan`  
**Model**: `google/gemini-2.5-flash`  
**Credits**: ~10-20 per plan

**Workflow**:
1. User inputs goals, subject, available time
2. Frontend collects learning preferences and constraints
3. Edge function:
   - Constructs detailed prompt with user constraints
   - Calls AI Gateway for personalized plan
   - Parses and validates plan structure
   - Returns daily/weekly breakdown
4. Frontend displays plan with progress tracking

**Input Parameters**:
```typescript
{
  subject: string;
  goalType: 'exam' | 'skill' | 'certification';
  availableTime: number;     // Minutes per day
  duration: number;          // Total weeks
  preferences: string[];
}
```

**Output Format**:
```typescript
{
  plan: {
    title: string;
    duration_weeks: number;
    weekly_schedule: [
      {
        week: number;
        topics: string[];
        daily_sessions: [
          {
            day: number;
            topic: string;
            duration_minutes: number;
            activities: string[];
          }
        ]
      }
    ]
  }
}
```

### 4. Content Summarization

**Endpoint**: `summarize-content`  
**Model**: `google/gemini-2.5-flash`  
**Credits**: Variable based on content length

**Workflow**:
1. User uploads document or provides text
2. Frontend sends content to summarization endpoint
3. Edge function:
   - Parses document (if PDF/DOCX)
   - Extracts text content
   - Calls AI Gateway with summarization prompt
   - Returns concise summary with key points
4. Frontend displays summary with original content link

**Input Parameters**:
```typescript
{
  content: string;
  length: 'short' | 'medium' | 'detailed';
  format: 'bullet_points' | 'paragraph';
}
```

### 5. Document Parsing

**Endpoints**: `parse-document`, `parse-document-content`  
**Credits**: None (utility function)

**Workflow**:
1. User uploads PDF, DOCX, or text file
2. Frontend sends file to parsing endpoint
3. Edge function:
   - Detects file type
   - Extracts text using appropriate parser
   - Returns plain text content
4. Frontend uses extracted text for AI operations

**Supported Formats**:
- `.txt`, `.md` - Direct text extraction
- `.pdf` - PDF parsing with text extraction
- `.docx`, `.doc` - XML structure parsing
- Images - OCR not supported (error returned)

### 6. Audio Transcription

**Endpoint**: `transcribe-audio`  
**Model**: OpenAI Whisper API  
**Credits**: Variable based on audio length

**Workflow**:
1. User records or uploads audio
2. Frontend converts audio to base64
3. Edge function:
   - Processes base64 in chunks to avoid memory issues
   - Sends to OpenAI Whisper API
   - Returns transcribed text
4. Frontend displays transcription

**Input Parameters**:
```typescript
{
  audio: string;  // base64 encoded
  language?: string;
}
```

### 7. Message Translation

**Endpoint**: `translate-message`  
**Model**: Lovable AI Gateway  
**Credits**: ~1-5 per translation

**Workflow**:
1. User requests translation in group chat
2. Frontend sends message text and target language
3. Edge function:
   - Calls AI Gateway with translation prompt
   - Returns translated text
4. Frontend displays translation inline

**Input Parameters**:
```typescript
{
  text: string;
  targetLanguage: string;  // ISO language code
}
```

## Error Handling

### Rate Limiting (429)

**Cause**: Too many requests in short period  
**User Message**: "Rate limits exceeded, please try again later."  
**Solution**: Implement exponential backoff on retry

### Payment Required (402)

**Cause**: Insufficient AI credits  
**User Message**: "Payment required, please add funds to your Lovable AI workspace."  
**Solution**: Direct user to credit purchase page

### Generic API Errors (500)

**Cause**: AI Gateway failures, network issues  
**User Message**: "AI service temporarily unavailable"  
**Solution**: Log error details, allow retry

## Credit Management

### Credit Costs

| Feature | Average Cost | Range |
|---------|-------------|-------|
| Quiz Generation | 15 credits | 10-30 |
| Flashcard Generation | 10 credits | 5-20 |
| Study Plan | 15 credits | 10-25 |
| Summarization | 8 credits | 5-15 |
| Translation | 2 credits | 1-5 |
| Transcription | 20 credits | 10-40 |

### Credit Deduction Flow

1. Edge function checks user credit balance
2. Operation completes successfully
3. Credits deducted via `deduct_ai_credits()` function
4. Usage logged in `user_ai_usage` table
5. User notified if balance is low (<10 credits)

## Performance Optimization

### Caching Strategies

- **Generated Content**: Cache quiz/flashcard results for 24 hours
- **Summaries**: Store in database to avoid regeneration
- **Translations**: Cache common phrases and language pairs

### Batch Processing

- Group multiple small AI requests when possible
- Use queue system for bulk generation operations
- Process large documents in chunks

## Security Considerations

1. **API Key Protection**: Never expose `LOVABLE_API_KEY` to frontend
2. **Input Validation**: Sanitize all user inputs before AI processing
3. **Rate Limiting**: Implement per-user rate limits beyond AI Gateway
4. **Content Filtering**: Validate AI responses before storage
5. **Credit Fraud Prevention**: Monitor unusual usage patterns

## Monitoring & Logging

### Key Metrics

- AI request success/failure rates
- Average response times per feature
- Credit consumption per user
- Error rates by type (429, 402, 500)

### Logging Best Practices

```typescript
console.log(`[${feature}] User: ${userId}, Credits: ${creditsUsed}`);
console.error(`[${feature}] Error: ${error.message}, Status: ${status}`);
```

## Future Enhancements

1. **Model Selection**: Allow users to choose AI models per feature
2. **Streaming Responses**: Real-time token streaming for better UX
3. **Multi-modal Support**: Image analysis for visual learning materials
4. **Voice Synthesis**: Text-to-speech for flashcard study
5. **Personalization**: AI learns from user performance to optimize content
