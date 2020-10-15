<script lang="ts">
  import { onMount } from "svelte";
  import leven from "fast-levenshtein";
  import { toPronunciation } from "./pronunciation";
  import type { TextToken, TimingToken } from "../tokens";

  export let textTokens: TextToken[];
  export let timingTokens: TimingToken[] = [];
  export let data: Blob | null = null;

  let currentTokenNumber: number = 0;
  let currentToken: TextToken;
  $: currentToken = textTokens[currentTokenNumber];
  let currentLine: string | undefined;
  $: currentLine = currentToken === undefined ? undefined : currentToken.script;
  let currentLinePronunciation: string | undefined;
  $: currentLinePronunciation = currentLine === undefined ? undefined : toPronunciation(currentLine);

  let prevTokenNumber: number | undefined;
  $: prevTokenNumber = currentTokenNumber ? currentTokenNumber - 1 : undefined;
  let prevToken: TextToken | undefined;
  $: prevToken = prevTokenNumber === undefined ? undefined : textTokens[prevTokenNumber];
  let prevLine: string | undefined;
  $: prevLine = prevToken === undefined ? undefined : prevToken.script;
  let prevLinePronunciation: string | undefined;
  $: prevLinePronunciation = prevLine === undefined ? undefined : toPronunciation(prevLine);

  let atEnd: boolean;
  $: atEnd = currentLine === undefined;
  let completed: () => void = () => {};

  let bounds: {
    currDistanceLowerBound: number;
    currDistance: number;
    currDistanceUpperBound: number;
    prevDistanceLowerBound: number;
    prevDistance: number;
    prevDistanceUpperBound: number;
  } = {} as any;

  let speechOffset: number = 0;
  let speechStart: number = 0;

  //@ts-ignore
  const recognition: SpeechRecognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-GB";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    recognition.stop();
    const results = event.results;
    const item = results.item(0);
    const {transcript, confidence} = item.item(0);

    console.log(transcript);
    if (atEnd && transcript.toLowerCase() === "completed") {
      completed();
      return;
    }

    const pronunciation = toPronunciation(transcript);
    const prevDistance = prevLinePronunciation === undefined ? 1000 : leven.get(pronunciation, prevLinePronunciation) / prevLinePronunciation.length;
    const currDistance = currentLinePronunciation === undefined ? 1000 : leven.get(pronunciation, currentLinePronunciation) / currentLinePronunciation.length;

    const nonZeroConfidence = confidence || 1;

    const prevDistanceLowerBound = prevDistance * nonZeroConfidence;
    const prevDistanceUpperBound = prevDistance / nonZeroConfidence;

    const currDistanceLowerBound = currDistance * nonZeroConfidence;
    const currDistanceUpperBound = currDistance / nonZeroConfidence;

    const maxLower = Math.max(prevDistanceLowerBound, currDistanceLowerBound);
    const minUpper = Math.min(prevDistanceUpperBound, currDistanceUpperBound);

    console.log(prevDistance, currDistance, confidence);
    
    if (maxLower > minUpper) {
      if (prevDistance !== undefined && (currDistance === undefined || prevDistance < currDistance)) {
        if (prevDistanceUpperBound !== undefined && prevDistanceUpperBound < 0.5) {
          const lastToken = timingTokens[timingTokens.length - 1];
          lastToken.timings.start = speechStart - speechOffset;
          lastToken.timings.end = event.timeStamp - speechOffset;
        }
      } else {
        if (currDistanceUpperBound !== undefined && currDistanceUpperBound < 0.5) {
          timingTokens = [...timingTokens, {
            ...currentToken,
            timings: {
              start: speechStart - speechOffset,
              end: event.timeStamp - speechOffset
            },
            type: "TIMING"
          }];
          currentTokenNumber++;
        }
      }
    }

    bounds = {
      currDistanceLowerBound: currDistanceLowerBound || 0, 
      currDistance: currDistance || 0, 
      currDistanceUpperBound: currDistanceUpperBound || 0,
      prevDistanceLowerBound: prevDistanceLowerBound || 0,
      prevDistance: prevDistance || 0,
      prevDistanceUpperBound: prevDistanceUpperBound || 0
    };
  }

  let listening: boolean = false;
  let hearing: boolean = false;
  recognition.onerror = console.log;
  recognition.onstart = (event: Event) => {
    listening = true;
    if (speechOffset === 0) {
      speechOffset = event.timeStamp;
    }
  }
  recognition.onend = () => {
    listening = false;
    hearing = false;
    console.log("Restarting");
    recognition.start();
  }
  recognition.onspeechstart = (event) => {
    speechStart = event.timeStamp;
    hearing = true;
  }
  recognition.onspeechend = () => hearing = false;

  onMount(() => recognition.start());

  navigator.mediaDevices.getUserMedia({audio: {
    echoCancellation: false,
    noiseSuppression: false
  }, video: false})
    .then(stream => {
      //@ts-ignore
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=pcm"
      });
      recorder.start();
      console.log("Started recorder");
      completed = () => recorder.stop();
      recorder.ondataavailable = (event: any) => {
        console.log("Done");
        data = event.data;
        recognition.onend = () => {};
        recognition.stop();
      }
    });
</script>

{#if prevLine !== undefined}
  <p>
    Previous Line ({prevTokenNumber}): {prevLine}
  </p>
{/if}

{#if currentLine !== undefined}
  <p>
    Current Line ({currentTokenNumber}): {currentLine}
  </p>
{/if}

{#if atEnd}
  <p>
    To end, say "Completed"
  </p>
{/if}

<p>
  Listening: {listening}
</p>

<p>
  Hearing: {hearing}
</p>

<p>
  Timings:
</p>

<ol>
  {#each Object.values(timingTokens) as time}
    <li>{time.timings.start} - {time.timings.end}</li>
  {/each}
</ol>

<div style={`background-color: green; position: fixed; bottom: 30px; height: 10px; left: ${Math.min(Math.max(bounds.prevDistanceLowerBound*100, 0), 95)}vw; right: ${100 - Math.max(Math.min(bounds.prevDistanceUpperBound*100, 100), 5)}vw;`}/>
<div style={`background-color: red; position: fixed; bottom: 10px; height: 10px; left: ${Math.min(Math.max(bounds.currDistanceLowerBound*100, 0), 95)}vw; right: ${100 - Math.max(Math.min(bounds.currDistanceUpperBound*100, 100), 5)}vw;`}/>

{speechOffset}