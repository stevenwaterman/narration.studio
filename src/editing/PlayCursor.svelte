<script lang="ts">
  import { create_in_transition } from "svelte/internal";
  import { audioStatusStore } from "./processor";

  export let duration: number;
  export let zoom: number;

  function traverse(
    node: Element,
    {offset}: {offset: number}
  ) {
    const transTime: number = (duration - offset) * 1000;
    const style = ((node as unknown) as ElementCSSInlineStyle).style;
    return {
      duration: transTime,
      tick: (t: number) => {
        const startPx: number = offset * zoom;
        const endPx: number = duration * zoom;
        const transPx: number = endPx - startPx;
        const x: number = startPx + t * transPx;
        style.left = `${x}px`;
        node.scrollIntoView({
          inline: "center"
        });
      },
    };
  }

  let element: HTMLDivElement | undefined;
  let transition: {
    start: () => void;
    invalidate: () => void;
    end: () => void;
  };
  let hidden: boolean = true;

  audioStatusStore.subscribe(status => {
    if (transition) transition.end();
    hidden = status === null;
    if (!hidden && element) {
      transition = create_in_transition(element, traverse, status);
      transition.start();
    }
  });
</script>

<style>
  .line {
    position: absolute;
    width: 2px;
    top: 0;
    bottom: 0;
    background-color: red;
    pointer-events: none;
  }
</style>

<div 
  bind:this={element}
  on:introend={() => {
    hidden = true;
  }} 
  class="line" 
  hidden={hidden} 
/>