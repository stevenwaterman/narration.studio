export type MarkedToken = Space | Code | Heading | Table | Hr | Blockquote | BlockquoteStart | BlockquoteEnd | List | ListItem | Paragraph | HTML | Text | Def | Escape | Tag | Image | Link | Strong | Em | Codespan | Br | Del;

interface Space {
    type: 'space';
    raw: string;
}

interface Code {
    type: 'code';
    raw: string;
    codeBlockStyle?: 'indented';
    lang?: string;
    text: string;
}

interface Heading {
    type: 'heading';
    raw: string;
    depth: number;
    text: string;
}

interface Table {
    type: 'table';
    raw: string;
    header: string[];
    align: Array<'center' | 'left' | 'right' | null>;
    cells: string[][];
}

interface Hr {
    type: 'hr';
    raw: string;
}

interface Blockquote {
    type: 'blockquote';
    raw: string;
    text: string;
    tokens: MarkedToken[];
}

interface BlockquoteStart {
    type: 'blockquote_start';
    raw: string;
}

interface BlockquoteEnd {
    type: 'blockquote_end';
    raw: string;
}

interface List {
    type: 'list';
    raw: string;
    ordered: boolean;
    start: boolean;
    loose: boolean;
    items: ListItem[];
}

interface ListItem {
    type: 'list_item';
    raw: string;
    task: boolean;
    checked: boolean;
    loose: boolean;
    text: string;
}

interface Paragraph {
    type: 'paragraph';
    raw: string;
    pre?: boolean;
    text: string;
    tokens: MarkedToken[];
}

interface HTML {
    type: 'html';
    raw: string;
    pre: boolean;
    text: string;
}

interface Text {
    type: 'text';
    raw: string;
    text: string;
}

interface Def {
    type: 'def';
    raw: string;
    href: string;
    title: string;
}

interface Escape {
    type: 'escape';
    raw: string;
    text: string;
}

interface Tag {
    type: 'text' | 'html';
    raw: string;
    inLink: boolean;
    inRawBlock: boolean;
    text: string;
}

interface Link {
    type: 'link';
    raw: string;
    href: string;
    title: string;
    text: string;
    tokens?: Text[];
}

interface Image {
    type: 'image';
    raw: string;
    href: string;
    title: string;
    text: string;
}

interface Strong {
    type: 'strong';
    raw: string;
    text: string;
}

  interface Em {
      type: 'em';
      raw: string;
      text: string;
  }

  interface Codespan {
      type: 'codespan';
      raw: string;
      text: string;
  }

  interface Br {
    type: 'br';
    raw: string;
  }

  interface Del {
      type: 'del';
      raw: string;
      text: string;
  }