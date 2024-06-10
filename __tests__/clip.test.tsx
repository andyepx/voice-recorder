/**
 * @jest-environment jsdom
 */

import {screen} from '@testing-library/dom'
import {render} from '@testing-library/react'
import {Clip} from "../src/components/clip/clip";
import {Recording} from "../src/types";

test('Display a clip', async () => {
    const recording: Recording = {
        label: "Test label",
        transcription: "Nice transcription",
        url: "https://test.audio",
        transcriptionStatus: "done"
    };

    render(
        <Clip recording={recording} deleteRecording={() => {
        }}/>
    );

    const title = await screen.findByText(recording.label, {selector: "h3"});
    expect(title).toBeDefined();

    const audio: HTMLAudioElement = await screen.findByTestId('audio-player') as HTMLAudioElement;
    expect(audio.src).toContain(recording.url);

    const buttons = await screen.findAllByRole('button');
    expect(buttons).toHaveLength(2);
})