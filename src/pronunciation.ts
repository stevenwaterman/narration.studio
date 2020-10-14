import cmu from "cmu-pronouncing-dictionary";

const phonemeMap = {
  AA: "A",
  AE: "B",
  AH: "C",
  AO: "D",
  AW: "E",
  AY: "F",
  B: "G",
  CH: "H",
  D: "I",
  DH: "J",
  EH: "K",
  ER: "L",
  EY: "M",
  F: "N",
  G: "O",
  HH: "P",
  IH: "Q",
  IY: "R",
  JH: "S",
  K: "T",
  L: "U",
  M: "V",
  N: "W",
  NG: "X",
  OW: "Y",
  OY: "Z",
  P: "1",
  R: "2",
  S: "3",
  SH: "4",
  T: "5",
  TH: "6",
  UH: "7",
  UW: "8",
  V: "9",
  W: "0",
  Y: "/",
  Z: "*",
  ZH: "+",
  "_": "_",
  " ": " "
} as const;

export function toPronunciation(sentence: string): string {
  const words: string[] = sentence.split(" ").map(word => {
    const lower = word.toLowerCase();
    const clean = lower.replace(/[^a-z']/g, '');
    return clean;
  });
  const wordsPronunciation: string[] = words.map(word => {
    if (word in cmu) {
      const pronunciation = cmu[word as keyof typeof cmu] as string;
      return pronunciation.replace(/[^A-Z ]/g, '');
    } else {
      return "_";
    }
  });
  const pronunciation = wordsPronunciation.flatMap(word => [...word.split(" "), " "]);
  const mapped = pronunciation.map((phoneme: string) => phonemeMap[phoneme as keyof typeof phonemeMap]);
  const joined = mapped.join("");
  return joined;
}