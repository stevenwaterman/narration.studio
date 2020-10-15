type BaseToken<TYPE extends string> = {
  type: TYPE;
  idx: number;
  raw: string;
};

export type TextToken = BaseToken<"TEXT"> & {
  script: string;
};

export type PauseToken = BaseToken<"PAUSE"> & {
  duration: number;
  newParagraph: boolean;
};

export type ScriptToken = TextToken | PauseToken;

export type TimingToken = BaseToken<"TIMING"> & Omit<TextToken, "type"> & {
  timings: {
    start: number,
    end: number
  }
};

export type ProcessingToken = TimingToken | PauseToken;

export type AudioToken = BaseToken<"AUDIO"> & {offset: number; duration: number; buffer: AudioBuffer; stop: () => void;};

export type EditorToken = PauseToken | AudioToken;