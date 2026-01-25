Code Hustlers is an AI-powered web application designed to combat misinformation in the digital age. It leverages advanced AI (Google Gemini) to provide real-time analysis of articles, images, and online trends, helping users distinguish fact from fiction with confidence.

## Features

- **Article Analysis**: Paste article text or URLs to evaluate credibility and detect potential misinformation.
- **Image Verification**: Upload or link images to check for manipulation or misleading context.
- **Trend Monitoring**: Analyze social media trends and news feeds for accuracy.
- **Real-time Results**: Powered by Google Gemini for fast, insightful AI-driven evaluations.
- **User-Friendly Interface**: Built with React for a smooth and intuitive experience.

## Demo

View the original app prototype: https://ai-powered-tool-for-misinformation-41599320306.us-west1.run.app/

## Technologies Used

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **AI Integration**: Google Gemini SDK (`@google/genai`)
- **Other**: Responsive design with custom components

## Prerequisites

- Node.js (v18 or higher recommended)
- A Google Gemini API key (free tier available)

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create or select a project
3. Generate an API key from the dashboard

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ramasaikiran/TechSprint.git
   cd TechSprint
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a file named `.env.local` in the root directory with the following content:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   > Note: The app uses `VITE_` prefix for client-side environment variables in Vite.

4. **Run the app locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) (or the port shown in the console) in your browser.

## Usage

- Launch the app and navigate through the interface.
- Input article text/URLs, image links, or trend queries.
- Review the AI-generated analysis for misinformation indicators, sources, and explanations.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory. Preview with:
```bash
npm run preview
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request
5. 
For any questions, feel free to open an issue on this repository!
