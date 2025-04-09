# Angata Sugar Mills Call Center

An AI-powered call center application for Angata Sugar Mills that helps farmers get instant support for their sugarcane farming needs. The application uses voice input, processes it using advanced AI, and provides voice responses.

## Features

- 🎤 Voice Recording: Record farmer inquiries directly through the browser
- 🗣️ Speech-to-Text: Convert voice recordings to text using OpenAI's Whisper
- 🤖 AI Analysis: Analyze farmer inquiries using GPT-4
- 🔊 Text-to-Speech: Generate natural voice responses using ElevenLabs
- 📊 Call History: Store and track all farmer interactions
- 🎯 Smart Categorization: Automatically categorize farmer issues
- 😊 Sentiment Analysis: Understand farmer sentiment

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- OpenAI (Whisper & GPT-4)
- ElevenLabs
- Supabase

## Setup

1. Clone the repository:
```bash
git clone https://github.com/sjshamji/callcenter.git
cd callcenter
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your API keys:
```env
# OpenAI API Key (Required)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-api-key

# ElevenLabs API Key (Optional - for better text-to-speech)
# Get from: https://elevenlabs.io
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Supabase Configuration (Required)
# Get from: Supabase project settings -> API
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the Supabase database:
```sql
create table calls (
  id uuid default uuid_generate_v4() primary key,
  transcript text not null,
  summary text not null,
  categories text[] not null,
  sentiment float not null,
  timestamp timestamptz not null default now()
);
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click the microphone button to start recording
2. Speak your farming-related question or concern
3. Click the stop button when finished
4. Wait for the AI to process and analyze your message
5. Listen to the AI's response
6. View the analysis including categories and sentiment

## Environment Variables

- `OPENAI_API_KEY` (Required): Your OpenAI API key for Whisper and GPT-4
- `ELEVENLABS_API_KEY` (Optional): Your ElevenLabs API key for better text-to-speech
- `NEXT_PUBLIC_SUPABASE_URL` (Required): Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Required): Your Supabase anonymous key

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
