<script lang="ts">
  import { onMount } from "svelte";
  import leven from "fast-levenshtein";
  import { toPronunciation } from "./pronunciation";
  import type { TextToken, TimingToken } from "../tokens";
  import { tweened } from "svelte/motion";

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

    analysis = null;

    const duration = event.timeStamp - speechStart;
    if (duration < 500) {
      analysis = {
        transcript,
        decision: "SHORT"
      };
      return;
    }

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

    if (maxLower > minUpper) {
      if (prevDistance !== undefined && (currDistance === undefined || prevDistance < currDistance)) {
        if (prevDistanceUpperBound !== undefined && prevDistanceUpperBound < 0.5) {
          const lastToken = timingTokens[timingTokens.length - 1];
          lastToken.timings.start = speechStart - speechOffset;
          lastToken.timings.end = event.timeStamp - speechOffset;
          analysis = {
            transcript,
            decision: "PREVIOUS"
          };
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
          analysis = {
            transcript,
            decision: "CURRENT"
          };
        }
      }
    }
    
    if (analysis === null) {
      analysis = {
        transcript,
        decision: "UNCLEAR"
      }
    }
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
      completed = () => recorder.stop();
      recorder.ondataavailable = (event: any) => {
        data = event.data;
        recognition.onend = () => {};
        recognition.stop();
      }
    });

  let analysis: null | {
    transcript: string;
    decision: "PREVIOUS" | "CURRENT" | "UNCLEAR" | "SHORT"
  } = null;

  let progress: number;
  $: progress = 100 * currentTokenNumber / textTokens.length;

  const tweenedProgress = tweened(progress);
  $: tweenedProgress.set(progress);
</script>

<style>
  .circleContainer {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .circle {
    width: 20px;
    height: 20px;
    border: 1px solid black;
    border-radius: 50%;
    margin: 20px;
  }

  .red {
    background-color: red;
  }

  .green {
    background-color: green;
  }

  .column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    height: 100%;
  }

  .prompt {
    font-size: 20px;
    margin: 20px 20px 10px 20px;
  }

  .script {
    font-size: 36px;
    margin: 20px;
    text-align: center;
  }

  .transcript {
    font-size: 20px;
    margin: 20px
  }

  .decision {
    font-size: 20px;
    margin: 20px
  }

  .spacer {
    height: 100px;
    flex-shrink: 1;
    flex-grow: 1;
  }

  .bar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;

    background-color: green;
  }

  .barContainer {
    position: relative;
    width: 100%;
    height: 10px;
    flex-shrink: 0;
    flex-grow: 0;
  }
</style>

<div class="column">
  {#if currentTokenNumber === 0}
    <div class="prompt">
      To begin, say:
    </div>

    <div class="script">
      {@html currentLine}
    </div>
  {:else if !atEnd}
    <div class="prompt">
      If you didn't like your delivery of the last line, say it again:
    </div>

    <div class="script">
      {@html prevLine}
    </div>

    <div class="spacer"/>

    <div class="prompt">
      Or say the next line to move on:
    </div>

    <div class="script">
      {@html currentLine}
    </div>
  {:else}
    <div class="prompt">
      If you didn't like your delivery of the last line, say it again:
    </div>

    <div class="script">
      {@html prevLine}
    </div>

    <div class="spacer"/>

    <div class="prompt">
      Or if you're done, say:
    </div>

    <div class="script">
      Completed
    </div>
  {/if}

  <div class="spacer"/>

  <div class="circleContainer">
    <div class="circle" class:red={listening}/>
    <div class="circle" class:green={hearing}/>
  </div>

  {#if analysis !== null}
    <div class="transcript">
      I heard <b>{analysis.transcript}</b>.
    </div>

    <div class="decision">
      {#if analysis && analysis.decision === "UNCLEAR"}
        I can't tell which line that is.
      {:else if analysis && analysis.decision === "SHORT"}
        I didn't notice you start talking. Try waiting a second longer between lines.
      {:else if analysis && analysis.decision === "CURRENT"}
        I think that was the new line.
      {:else if analysis && analysis.decision === "PREVIOUS"}
        I think that was the old line.
      {/if}
    </div>
  {/if}

  <div class="spacer"/>

  <div class="barContainer">
    <div class="bar" style={`width: ${$tweenedProgress}%`}/>
  </div>
</div>



