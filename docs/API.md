# ExHub - API Documentation

## Edge Functions API Reference

All edge functions are deployed to Supabase and accessible via the Supabase client.

Base URL: `https://zsybxembykxiykgkdlth.supabase.co/functions/v1`

### Authentication

All edge functions (except those marked as public) require authentication via JWT token.

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* request body */ }
});
```

## Content Generation

### Generate Quiz

**Endpoint:** `generate-quiz`  
**Method:** POST  
**Authentication:** Required  
**Credits:** 10 per request

Generate a quiz from provided content.

**Request Body:**
```typescript
{
  content: string;           // Text content to generate quiz from
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;     // Number of questions (1-20)
  questionTypes?: string[];  // ['multiple_choice', 'true_false', 'short_answer']
  subject?: string;          // Subject category
}
```

**Response:**
```typescript
{
  quiz: {
    title: string;
    questions: Array<{
      question: string;
      type: string;
      options?: string[];    // For multiple choice
      correctAnswer: string;
      explanation?: string;
    }>;
  }
}
```

### Generate Flashcards

**Endpoint:** `generate-flashcards`  
**Method:** POST  
**Authentication:** Required  
**Credits:** 8 per request

Generate flashcards from content.

**Request Body:**
```typescript
{
  content: string;
  cardCount: number;         // Number of cards (1-50)
  subject?: string;
}
```

**Response:**
```typescript
{
  flashcards: Array<{
    front: string;
    back: string;
    hint?: string;
  }>
}
```

### Generate Study Plan

**Endpoint:** `generate-study-plan`  
**Method:** POST  
**Authentication:** Required  
**Credits:** 15 per request

Generate a personalized study plan.

**Request Body:**
```typescript
{
  subject: string;
  goalDescription: string;
  availableHoursPerDay: number;
  targetDate?: string;       // ISO date string
  currentLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningStyle?: string;
}
```

**Response:**
```typescript
{
  studyPlan: {
    title: string;
    description: string;
    totalDuration: number;   // In days
    sessions: Array<{
      day: number;
      topic: string;
      duration: number;      // In minutes
      activities: string[];
      resources?: string[];
    }>;
  }
}
```

### Summarize Content

**Endpoint:** `summarize-content`  
**Method:** POST  
**Authentication:** Required  
**Credits:** 5 per request

Summarize lengthy content.

**Request Body:**
```typescript
{
  content: string;
  summaryLength?: 'short' | 'medium' | 'long';
  focusAreas?: string[];     // Specific topics to emphasize
}
```

**Response:**
```typescript
{
  summary: string;
  keyPoints: string[];
  wordCount: number;
}
```

## Document Processing

### Parse Document

**Endpoint:** `parse-document`  
**Method:** POST  
**Authentication:** Required  
**Credits:** 3 per request

Parse and extract text from documents.

**Request Body:**
```typescript
{
  fileUrl: string;           // Supabase storage URL
  fileType: 'pdf' | 'docx' | 'txt';
}
```

**Response:**
```typescript
{
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
  }
}
```

### Parse Document Content

**Endpoint:** `parse-document-content`  
**Method:** POST  
**Authentication:** Required

Extract text from base64 encoded files.

**Request Body:**
```typescript
{
  fileData: string;          // Base64 encoded file
  fileType: string;          // MIME type
  fileName: string;
}
```

**Response:**
```typescript
{
  content: string;
}
```

## Communication

### Transcribe Audio

**Endpoint:** `transcribe-audio`  
**Method:** POST  
**Authentication:** Required  
**Credits:** 10 per request

Transcribe audio messages to text.

**Request Body:**
```typescript
{
  audioUrl: string;          // Supabase storage URL
}
```

**Response:**
```typescript
{
  transcription: string;
  duration: number;          // In seconds
  language?: string;
}
```

### Translate Message

**Endpoint:** `translate-message`  
**Method:** POST  
**Authentication:** Required  
**Credits:** 2 per request

Translate messages to different languages.

**Request Body:**
```typescript
{
  text: string;
  targetLanguage: string;    // ISO language code
  sourceLanguage?: string;   // Auto-detect if not provided
}
```

**Response:**
```typescript
{
  translatedText: string;
  detectedLanguage?: string;
}
```

## Integrations

### Google Calendar Sync

**Endpoint:** `google-calendar-sync`  
**Method:** POST  
**Authentication:** Required

Sync study plans with Google Calendar.

**Request Body:**
```typescript
{
  studyPlanId: string;
  accessToken: string;       // Google OAuth token
  action: 'create' | 'update' | 'delete';
}
```

**Response:**
```typescript
{
  success: boolean;
  calendarEventId?: string;
  message: string;
}
```

## Payments

### Initialize Payment

**Endpoint:** `initialize-payment`  
**Method:** POST  
**Authentication:** Required

Initialize a payment transaction.

**Request Body:**
```typescript
{
  amount: number;            // In smallest currency unit
  email: string;
  planType?: string;         // 'monthly' | 'annual' | 'credits'
  credits?: number;          // For credit purchases
}
```

**Response:**
```typescript
{
  authorizationUrl: string;
  reference: string;
}
```

### Verify Payment

**Endpoint:** `verify-payment`  
**Method:** POST  
**Authentication:** Required

Verify a payment transaction.

**Request Body:**
```typescript
{
  reference: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    status: string;
    amount: number;
    paidAt: string;
  }
}
```

### Manage Subscription

**Endpoint:** `manage-subscription`  
**Method:** POST  
**Authentication:** Required

Manage user subscriptions.

**Request Body:**
```typescript
{
  action: 'cancel' | 'reactivate' | 'upgrade';
  newPlanType?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  subscription: {
    status: string;
    currentPlan: string;
    expiresAt: string;
  }
}
```

## Error Responses

All endpoints follow this error format:

```typescript
{
  error: string;             // Error message
  details?: any;             // Additional error details
  code?: string;             // Error code
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid JWT)
- `402` - Payment Required (insufficient credits)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limits

- General endpoints: 60 requests per minute
- AI endpoints: 20 requests per minute
- Payment endpoints: 10 requests per minute

## Credits System

Each AI operation consumes credits:

| Operation | Credits |
|-----------|---------|
| Generate Quiz | 10 |
| Generate Flashcards | 8 |
| Generate Study Plan | 15 |
| Summarize Content | 5 |
| Parse Document | 3 |
| Transcribe Audio | 10 |
| Translate Message | 2 |

Free users receive 50 credits on signup.
Premium users receive 500 credits/month.
