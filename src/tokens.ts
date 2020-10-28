type BaseToken<TYPE extends string> = {
  type: TYPE;
  idx: number;
};

export type TextToken = BaseToken<"TEXT"> & {
  script: string;
};

export type PauseToken = BaseToken<"PAUSE"> & {
  duration: number;
};

export type NewParagraphToken = BaseToken<"PARAGRAPH"> & {
  duration: number;
  raw: string;
}

export type NothingToken = BaseToken<"NOTHING"> & {
  raw: string;
}

export type SilenceToken = PauseToken | NewParagraphToken;
export type NonTextToken = SilenceToken | NothingToken;

export type ScriptToken = TextToken | NonTextToken;



export type TimingToken = BaseToken<"TIMING"> & Omit<TextToken, "type"> & {
  timings: {
    start: number,
    end: number
  }
};

export type ProcessingToken = TimingToken | NonTextToken;

export type AudioToken = BaseToken<"AUDIO"> & {start: number; duration: number; buffer: AudioBuffer; stop: () => void;};

export type EditorToken = NonTextToken | AudioToken;

export type VisibleToken = AudioToken | SilenceToken;

export type WaveformToken = BaseToken<"WAVE"> & {start: number; duration: number;};

export type DrawToken = SilenceToken | WaveformToken;