export interface Recording {
    label: string;
    url: string;
    transcription: string;
    transcriptionStatus: "unknown" | "done" | "in-progress" | "unavailable";
}

export interface RecordingData {
    audio: Blob;
    transcription: string;
}