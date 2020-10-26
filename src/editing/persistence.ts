import { EditorToken, SilenceToken } from "../tokens";
import { processRawAudio } from "./processor";

const audioStoreName = "audio" as const;
const tokensStoreName = "tokens" as const;

const audioStoreKey = "singleton" as const;

export async function saveAudio(data: Blob): Promise<void>  {
  const db = await getDB();
  await replaceAudio(db, data);
}

export async function saveTokens(tokens: EditorToken[]): Promise<void>  {
  const db = await getDB();
  const simplifiedTokens = tokens.map(toSimplifiedToken);
  await replaceTokens(db, simplifiedTokens);
}

export async function saveChangedToken(token: EditorToken): Promise<void> {
  const db = await getDB();
  const simplifiedToken = toSimplifiedToken(token);
  await patchToken(db, simplifiedToken);
}

export async function canLoad(): Promise<boolean> {
  const db = await getDB();
  return await audioDataExists(db);
}

export async function load(): Promise<{
  audio: AudioBuffer;
  tokens: EditorToken[];
}> {
  const db = await getDB();
  const blob = await getAudio(db);
  const audio  = await processRawAudio(blob);

  const simplifiedTokens = await getTokens(db);
  const tokens = simplifiedTokens
    .map(token => toEditorToken(token, audio))
    .sort((a,b) => a.idx - b.idx);

  return { audio, tokens };
}

type SimplifiedToken = SilenceToken | {
  idx: number;
  type: "AUDIO";
  start: number;
  duration: number;
}

function toSimplifiedToken(token: EditorToken): SimplifiedToken {
  if(token.type === "AUDIO") {
    return {
      idx: token.idx,
      type: token.type,
      start: token.start,
      duration: token.duration
    }
  }
  return token;
}

function toEditorToken(token: SimplifiedToken, buffer: AudioBuffer): EditorToken {
  if(token.type === "AUDIO") {
    return {
      ...token,
      buffer,
      stop: () => {}
    }
  }
  return token;
}

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("narration.studio", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      createObjectStores(db);
    }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Error opening DB");
  })
}

async function createObjectStores(db: IDBDatabase): 
  Promise<
    Record<
      typeof audioStoreName | typeof tokensStoreName, 
      IDBObjectStore
    >
  > 
{
  const audioPromise = new Promise<IDBObjectStore>((resolve, reject) => {
    const audio = db.createObjectStore("audio");
    audio.transaction.oncomplete = () => resolve(audio);
    audio.transaction.onabort = () => reject("Aborted creating audio store");
    audio.transaction.onerror = () => reject("Error creating audio store");
  });

  const tokensPromise = new Promise<IDBObjectStore>((resolve, reject) => {
    const tokens = db.createObjectStore("tokens", { keyPath: "idx" });
    tokens.transaction.oncomplete = () => resolve(tokens);
    tokens.transaction.onabort = () => reject("Aborted creating tokens store");
    tokens.transaction.onerror = () => reject("Error creating tokens store");
  });

  return Promise
    .all([audioPromise, tokensPromise])
    .then(([audio, tokens]) => ({audio, tokens}));
}

async function replaceAudio(db: IDBDatabase, data: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([audioStoreName], "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject("Saving audio aborted");
    transaction.onerror = () => reject("Saving audio error");

    const store = transaction.objectStore(audioStoreName);
    store.add(data, audioStoreKey);
  });
}

async function replaceTokens(db: IDBDatabase, tokens: SimplifiedToken[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([tokensStoreName], "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject("Saving audio token aborted");
    transaction.onerror = () => reject("Saving audio token error");

    const store = transaction.objectStore(tokensStoreName);
    store.clear();
    tokens.forEach(token => store.add(token));
  });
}

async function patchToken(db: IDBDatabase, token: SimplifiedToken): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([tokensStoreName], "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject("Saving audio token aborted");
    transaction.onerror = () => reject("Saving audio token error");

    const store = transaction.objectStore(tokensStoreName);
    store.add(token);
  });
}

async function audioDataExists(db: IDBDatabase): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([audioStoreName], "readonly");
    transaction.onabort = () => reject("Counting audio aborted");
    transaction.onerror = () => reject("Counting audio transaction error");

    const store = transaction.objectStore(audioStoreName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result > 0);
    request.onerror = () => reject("Counting audio error");
  });
}

async function getAudio(db: IDBDatabase): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([audioStoreName], "readonly");
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject("Getting audio aborted");
    transaction.onerror = () => reject("Getting audio transaction error");

    const store = transaction.objectStore(audioStoreName);
    const audio: IDBRequest<Blob> = store.get(audioStoreKey);
    audio.onsuccess = () => resolve(audio.result);
    audio.onerror = () => reject("Getting audio error");
  });
}

async function getTokens(db: IDBDatabase): Promise<SimplifiedToken[]> {
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([tokensStoreName], "readonly");
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject("Getting audio aborted");
    transaction.onerror = () => reject("Getting audio error");

    const store = transaction.objectStore(tokensStoreName);
    const tokens: SimplifiedToken[] = await getAll(store);
    resolve(tokens);
  });
}

async function getAll(store: IDBObjectStore): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const data: any[] = [];
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        data.push(cursor.value);
        cursor.continue();
      }
      else resolve(data);
    }
    cursorRequest.onerror = () => reject("Opening cursor error");
  })
}

