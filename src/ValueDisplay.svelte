<script lang="ts">
  import type {SplitValue} from "./types";
  export let value: SplitValue;
</script>

<div>
  {value.left} vs {value.right}
</div>