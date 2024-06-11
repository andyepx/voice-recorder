# Voice Recorder

This is a simple voice recorder app built in React.

## Implementation

This app uses the [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) to record audio
and stores the recorded clips as `Blob` in the users' browsers
using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

The app also uses the OpenAI Whisper API to transcribe the recorded audio to text. As this API is not free to use, a key
is required to transcribe the clips correctly. You can provide your own API key by adding a `OPEANAI_API_KEY` query
parameter when loading the app.

## How to use

```bash
# Clone this repository
$ git clone

# Go into the repository
$ cd voice-recorder

# Install dependencies
$ npm install

# Run the app
$ npm start
```

## Demo

You can see a demo of this app at https://andyepx.github.io/voice-recorder/?OPENAI_API_KEY={YOUR_KEY}.

## Future improvements

- Implement a local light LLM model for offline transcription
- Add pagination for > 10 clips on one page
- Sorting / filtering of clips
- Add an option to export clips