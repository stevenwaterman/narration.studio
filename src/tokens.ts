type BaseToken<TYPE extends string> = {
  type: TYPE;
  idx: number;
};

export type TextToken = BaseToken<"TEXT"> & {
  script: string;
  raw: string;
};

export type PauseToken = BaseToken<"PAUSE"> & {
  delay: number;
  raw: string;
};

export type ScriptToken = TextToken | PauseToken;

export type TimingToken = BaseToken<"TIMING"> & Omit<TextToken, "type"> & {
  timings: {
    start: number,
    end: number
  }
};

export type ProcessingToken = TimingToken | PauseToken;