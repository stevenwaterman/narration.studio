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

export type SilenceToken = PauseToken | NewParagraphToken;

export type ScriptToken = TextToken | SilenceToken;

export type TimingToken = BaseToken<"TIMING"> & Omit<TextToken, "type"> & {
  timings: {
    start: number,
    end: number
  }
};

export type ProcessingToken = TimingToken | SilenceToken;

export type AudioToken = BaseToken<"AUDIO"> & {offset: number; duration: number; buffer: AudioBuffer; stop: () => void;};

export type EditorToken = SilenceToken | AudioToken;

export type WaveformToken = BaseToken<"WAVE"> & {start: number; duration: number;};

export type DrawToken = SilenceToken | WaveformToken;