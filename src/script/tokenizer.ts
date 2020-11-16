import { ScriptToken, NewParagraphToken } from "../tokens";
import { lexer, MarkedOptions } from "marked";
import { MarkedToken } from "./markedTokens";
import { v4 as uuid} from "uuid";

type ParagraphToken = {
  text?: string;
  raw: string;
};

type ChunkedToken = {
  raw: string;
  text: string[];
}

const paragraphDelay = 1;
const sentenceDelay = 0.3;

export function computeScriptTokens(script: string): ScriptToken[] {
  const {cleaned, replacements} = cleanupScript(script);

  const tokens: MarkedToken[] = lexer(cleaned, {gfm: true}) as unknown as MarkedToken[];
  console.log(JSON.stringify(tokens));
  const paragraphTokens: ParagraphToken[] = tokens.flatMap(toParagraphToken);
  const chunkedTokens: ChunkedToken[] = paragraphTokens.map(token => {
    if(token.text === undefined) return {raw: token.raw, text: []};

    const chunks = token.text.split(/([.?!]+\s+)|\n+/g);
    const definedChunks = chunks.filter(chunk => chunk !== undefined);
    const textChunks = definedChunks.filter((_, idx) => idx % 2 === 0);
    const trimmed = textChunks.map(chunk => chunk.trim());
    const nonEmpty = trimmed.filter(chunk => chunk.length);
    
    let raw = token.raw;
    for(const searchTerm in replacements) {
      const replacement = replacements[searchTerm];
      raw = raw.replace(searchTerm, replacement);
    }

    return {
      raw: raw,
      text: nonEmpty
    };
  });

  const scriptTokens: ScriptToken[] = chunkedTokens.flatMap(toScriptToken);
  scriptTokens.forEach((token, idx) => token.idx = idx);
  for(let token of scriptTokens) {
    if(token.type === "PARAGRAPH") {
      token.duration = 0.1;
      break;
    }
  }

  return scriptTokens;
}

function cleanupScript(script: string): {cleaned: string, replacements: Record<string, string>} {
  const regexp = /\{\{.*\}\}/g;
  const matches = Array.from(script.matchAll(regexp));
  const sections: string[] = [];
  const replacements: Record<string, string> = {};

  let idx = 0;
  matches.forEach(match => {
    const matchStartIdx = match.index;
    if (matchStartIdx === undefined) return;
    sections.push(script.slice(idx, matchStartIdx));

    const replacement = uuid().replace(/-/g, ".");
    replacements[replacement] = match[0];
    sections.push(replacement);

    idx = matchStartIdx + match[0].length;
  });

  sections.push(script.slice(idx));

  const cleaned = sections.join("");
  return {cleaned, replacements}
}

function toParagraphToken(token: MarkedToken): ParagraphToken {
  if(token.type === "heading") return token;
  if(token.type === "codespan") return token;
  if(token.type === "text") return token;
  if(token.type === "strong") return token;
  if(token.type === "em") return token;
  if(token.type === "escape") return token;
  if(token.type === "link") return token;
  if(token.type === "list_item") return token;
  if(token.type === "image") return token;
  
  if(token.type === "code") return {raw: token.raw, text: "pause now if you want to look at the code"};
  if(token.type === "table") return {raw: token.raw, text: "pause now if you want to look at the table"};

  if(token.type === "paragraph") return combineChildren(token);
  if(token.type === "blockquote") return combineChildren(token);
  if(token.type === "list") return combineList(token);
  
  return {
    raw: token.raw
  };
}

function combineList(token: Extract<MarkedToken, {type: "list"}>) : ParagraphToken {
  const raw = token.raw;
  const text = token.items.map(toParagraphToken).map(token => token.text).join("\n");
  return {raw, text};
}

function combineChildren(token: Extract<MarkedToken, {tokens: MarkedToken[]}>): ParagraphToken {
  const raw = token.raw;
  const text = token.tokens.map(toParagraphToken).map(token => token.text).join("");
  return {raw, text};
}

function toScriptToken(token: ChunkedToken): ScriptToken[] {
  const tokens: ScriptToken[] = [];

  if(token.text.length === 0) {
    tokens.push({
      idx: -1,
      type: "NOTHING",
      raw: token.raw
    });
  } else {
    tokens.push({
      idx: -1,
      type: "PARAGRAPH",
      duration: paragraphDelay,
      raw: token.raw
    });
  
    token.text.forEach((text, idx) => {
      tokens.push({
        idx: -1,
        type: "TEXT" as const,
        script: text
      });
  
      if(idx < token.text.length - 1) {
        tokens.push({
          idx: -1,
          type: "PAUSE" as const,
          duration: sentenceDelay
        });
      }
    });
  }

  return tokens;
}