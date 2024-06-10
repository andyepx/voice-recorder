import style from './style.module.scss';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {FrequencyChart} from "../frequencyChart/frequencyChart.tsx";
import {useEffect, useState} from "react";
import {getObjectStore} from "../../utils/objectStore.ts";
import {faMicrophone, faPause, faStop} from "@fortawesome/free-solid-svg-icons";

export function Recorder({recordingSaved}: { recordingSaved: (clipName: string, audio: Blob) => void }) {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const [recordingState, setRecordingState] = useState<RecordingState>("inactive");

    const startRecording = () => {
        if (recordingState !== "inactive") return;

        if (!mediaRecorder) {
            navigator.mediaDevices
                .getUserMedia({audio: true})
                .then((stream) => {
                        const recorder = new MediaRecorder(stream);

                        let chunks: Blob[] = [];
                        recorder.ondataavailable = (e) => {
                            chunks.push(e.data);
                        };

                        recorder.onstop = () => {
                            const date = new Date();
                            const clipName = date.toDateString() + " " + date.toLocaleTimeString();
                            const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"});
                            chunks = [];

                            getObjectStore().then(os => {
                                os.put({
                                    transcription: "",
                                    audio: blob
                                }, clipName);

                                os.get(clipName).onsuccess = function () {
                                    recordingSaved(clipName, blob);
                                };
                            });

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

    return <div className={style['recorder']}>
        <button className={style['small']} onClick={pauseResumeRecording}
                hidden={mediaRecorder === null}>
            <FontAwesomeIcon icon={faPause} size={"sm"}/>
        </button>
        <button>
            <FontAwesomeIcon icon={faMicrophone} size={"xl"} onClick={startRecording}/>
        </button>
        <button className={style['small']}
                hidden={mediaRecorder === null}>
            <FontAwesomeIcon icon={faStop} size={"sm"} onClick={stopRecording}/>
        </button>

        <FrequencyChart mediaRecorder={mediaRecorder}/>
    </div>;
}