import {useEffect, useState} from 'react'
import './App.css'
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: "",
    dangerouslyAllowBrowser: true
});

const DB_NAME = "recordings";

function App() {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordings, setRecordings] = useState<{ label: string, url: string, transcription: string }[]>([]);
    const [recordingState, setRecordingState] = useState<RecordingState>("inactive");

    const [online, setOnline] = useState<boolean>(navigator.onLine);

    window.addEventListener("online", () => {
        setOnline(true);
    });

    window.addEventListener("offline", () => {
        setOnline(false);
    });

    useEffect(() => {
        recordings.forEach(r => {
            if (r.transcription === "") {
                transcribe(r.label);
            }
        })
    }, [online]);

    const transcribe = (clipName: string, blob?: Blob) => {
        if (!blob) {
            const request = window.indexedDB.open(DB_NAME);
            request.onsuccess = (e) => {
                const db = request.result;
                const transaction = db.transaction([DB_NAME]);
                transaction.objectStore(DB_NAME).get(clipName).onsuccess = function (ev) {
                    const r = (ev.target! as any).result as {
                        audio: Blob,
                        transcription: string,
                    };
                    transcribe(clipName, r.audio);
                };
            };
            return;
        }

        openai.audio.transcriptions.create({
            file: new File([blob], "audio.ogg"),
            model: "whisper-1",
        }).then((result) => {
            const r = window.indexedDB.open(DB_NAME);
            r.onsuccess = (e) => {
                const d = r.result;
                const t = d.transaction([DB_NAME], "readwrite");

                t.objectStore(DB_NAME).put({
                    transcription: result.text,
                    audio: blob
                }, clipName);

                setRecordings(p => [
                    ...p.filter(x => x.label !== clipName),
                    {
                        ...p.find(x => x.label === clipName)!,
                        transcription: result.text
                    }
                ]);

            };
        });
    }

    useEffect(() => {
        const request = window.indexedDB.open(DB_NAME);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(DB_NAME)) {
                db.createObjectStore(DB_NAME);
            }
        };

        request.onsuccess = (e) => {
            const db = request.result;
            const transaction = db.transaction([DB_NAME]);
            const query = transaction.objectStore(DB_NAME).openCursor();
            query.onsuccess = function (ev) {
                const r = this.result;
                if (!r) {
                    db.close();
                    return;
                }
                setRecordings(p => [...p, {
                    url: window.URL.createObjectURL(r.value.audio),
                    label: String(r.key),
                    transcription: r.value.transcription
                }]);
                r.continue();
            };
        };
    }, []);

    const startRecording = () => {
        if (!mediaRecorder) {
            navigator.mediaDevices
                .getUserMedia({audio: true})
                .then((stream) => {
                        const recorder = new MediaRecorder(stream)

                        let chunks: Blob[] = [];
                        recorder.ondataavailable = (e) => {
                            chunks.push(e.data);
                        };

                        recorder.onstop = (e) => {
                            console.log("recorder stopped");

                            const clipName = new Date().toString();
                            const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"});
                            chunks = [];

                            const request = window.indexedDB.open(DB_NAME);

                            request.onsuccess = (e) => {
                                const db = request.result;
                                const transaction = db.transaction([DB_NAME], "readwrite");
                                transaction.objectStore(DB_NAME).put({
                                    transcription: "",
                                    audio: blob
                                }, clipName);

                                if (openai.apiKey && navigator.onLine) {
                                    transcribe(clipName, blob);
                                }

                                transaction.objectStore(DB_NAME).get(clipName).onsuccess = function (event) {
                                    const r = (event.target! as any).result as {
                                        audio: Blob,
                                        transcription: string,
                                    };

                                    setRecordings(p => [...p, {
                                        url: window.URL.createObjectURL(r.audio),
                                        label: clipName,
                                        transcription: r.transcription,
                                    }]);

                                    db.close();
                                };

                            };
                            stream.getTracks().forEach(t => t.stop());
                            setMediaRecorder(null);
                        };

                        recorder.start();
                        setRecordingState(recorder.state);

                        setMediaRecorder(recorder);
                    }
                );
        }
    }

    const stopRecording = () => {
        if (!mediaRecorder) return;
        mediaRecorder.stop();
        setRecordingState(mediaRecorder.state);
    }

    const pauseResumeRecording = () => {
        if (!mediaRecorder) return;

        if (recordingState === "paused") {
            mediaRecorder.resume();
            setRecordingState(mediaRecorder.state);
        } else {
            mediaRecorder.pause();
            setRecordingState(mediaRecorder.state);
        }
    }

    return (
        <>
            {mediaRecorder ? <div>
                <button onClick={stopRecording}>Stop</button>
                <button onClick={pauseResumeRecording}>
                    {recordingState === "paused" ? "Resume" : "Pause"}
                </button>
            </div> : <div>
                <button onClick={startRecording}>Record</button>
            </div>}
            <div>
                <br/>
                {recordings
                    .sort((a, b) => b.label.localeCompare(a.label))
                    .map((r, ix) => (
                        <div key={r.label}>
                            {r.label}
                            <br/>
                            <audio key={ix} controls src={r.url}/>
                            <br/>
                            {
                                r.transcription === "" ?
                                    <button onClick={() => transcribe(r.label)}>Transcribe</button>
                                    : r.transcription
                            }
                        </div>
                    ))}
            </div>
        </>
    )
}

export default App
