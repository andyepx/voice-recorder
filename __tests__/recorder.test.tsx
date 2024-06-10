/**
 * @jest-environment jsdom
 */

import {screen} from '@testing-library/dom'
import {render} from '@testing-library/react'
import {Recorder} from "../src/components/recorder/recorder";

test('Only one button is displayed before recording starts', async () => {
    render(
        <Recorder recordingSaved={(clipName, audio) => {
            console.log(clipName, audio);
        }}/>
    );

    const buttons = await screen.findAllByRole('button');
    expect(buttons).toHaveLength(1);
})