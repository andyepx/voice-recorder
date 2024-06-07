import {useEffect, useState} from 'react'
import './App.css'

const DB_NAME = "recordings";

function App() {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordings, setRecordings] = useState<{ label: string, value: string }[]>([]);
    const [recordingState, setRecordingState] = useState<RecordingState>("inactive");

    useEffect(() => {
        const request = window.indexedDB.open(DB_NAME);
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
                    value: window.URL.createObjectURL(r.value),
                    label: String(r.key),
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

                            request.onupgradeneeded = (event: any) => {
                                const db = event.target.result;
                                if (!db.objectStoreNames.contains(DB_NAME)) {
                                    db.createObjectStore(DB_NAME);
                                }
                            };

                            request.onsuccess = (e) => {
                                const db = request.result;
                                const transaction = db.transaction([DB_NAME], "readwrite");
                                transaction.objectStore(DB_NAME).put(blob, clipName).onsuccess
                                transaction.objectStore(DB_NAME).get(clipName).onsuccess = function (event) {
                                    const r = (event.target! as any).result;
                                    setRecordings(p => [...p, {
                                        value: window.URL.createObjectURL(r),
                                        label: clipName,
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
                            <audio key={ix} controls src={r.value}/>
                        </div>
                    ))}
            </div>
        </>
    )
}

export default App
