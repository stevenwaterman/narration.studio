<script lang="ts">
  import type { ScriptToken } from "./tokens";

  let script: string = "";

  const delays = {
    "\n": 0.25,
    ".": 0.25,
    ";": 0.1,
    "!": 0.25,
    "?": 0.25,
    "-": 0.1
  };
  const paragraphDelay = 0.7;

  let matches: RegExpMatchArray[];
  $: matches = Array.from(script.trim().matchAll(/[\n.;!?-]/g));

  let lineBoundaries: number[];
  $: lineBoundaries = matches.map(match => match.index).filter(index => index !== undefined) as number[];

  let allLineBoundaries: number[];
  $: allLineBoundaries = [
    0, ...lineBoundaries.flatMap(boundary => [boundary, boundary+1]), script.length
  ].reduce((acc: number[], elem: number) => 
    acc[acc.length - 1] === elem ? acc : [...acc, elem], []
  ).sort((a,b) => a - b);

  let slices: {start: number; end: number}[];
  $: slices = allLineBoundaries.reduce(
    (acc: {start: number; end: number}[], elem: number) => {
      const last = acc[acc.length - 1].end;
      const content = {start: last, end: elem};
      return [...acc, content];
    }
    , [{start: 0, end: 0}])
    .filter(slice => slice.end > slice.start);

  let basicTokens: (ScriptToken | null)[];
  $: basicTokens = slices.map(({start, end}, idx) => {
    const raw = script.slice(start, end);
    const trimmed = raw.trim().toLowerCase();
    const lettersOnly = trimmed.replace(/[^a-z]/g, "");
    if (lettersOnly) {
      return {
        type: "TEXT",
        idx,
        script: script.slice(start, end).trim(),
        raw
      }
    } else {
      return {
        type: "PAUSE",
        idx,
        delay: delays[raw as keyof typeof delays],
        raw
      }
    }
  })

  let nonNullTokens: ScriptToken[];
  $: nonNullTokens = basicTokens.filter(token => token !== null) as ScriptToken[];

  let combinedPauses: ScriptToken[];
  $: combinedPauses = nonNullTokens.reduce((acc: ScriptToken[], elem: ScriptToken) => {
    if (acc.length) {
      const last = acc[acc.length - 1];
      if (elem.type === "PAUSE" && last.type === "PAUSE") {
        last.delay = Math.max(last.delay, elem.delay);
        if (last.raw.endsWith("\n") && elem.raw.endsWith("\n")) {
          last.delay = paragraphDelay;
        }
        last.raw += elem.raw;
        return acc;
      }
    }
    return [...acc, elem];
  }, []);

  let appendScript: ScriptToken[];
  $: appendScript = combinedPauses.reduce((acc: ScriptToken[], elem: ScriptToken) => {
    if (acc.length) {
      const last = acc[acc.length - 1];
      if (elem.type === "PAUSE" && last.type === "TEXT") {
        last.script += elem.raw;
      }
    }
    return [...acc, elem];
  }, []);

  let noFinalPause: ScriptToken[];
  $: noFinalPause = appendScript.length && appendScript[appendScript.length - 1].type === "PAUSE" ? appendScript.slice(0, appendScript.length - 1) : appendScript;

  export let tokens: ScriptToken[];
  $: tokens = noFinalPause;
</script>

<style>
  textarea {
    width: 100%;
    height: 50%;
  }
</style>

<p>Script:</p>
<textarea bind:value={script}/>
<ol>
  {#each tokens as token}
    {#if token.type === "TEXT"}
      <li>{token.script}</li>
    {:else if token.type === "PAUSE"}
      <li>&lt;{token.delay}s pause&gt;</li>
    {/if}
  {/each}
</ol>