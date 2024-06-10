export interface Recording {
    label: string;
    url: string;
    transcription: string;
}

export interface RecordingData {
    audio: Blob;
    transcription: string;
}