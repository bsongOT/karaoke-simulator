import { merge } from "./hangul";
import {
  getNasalSound,
  hiraganaToKatakana,
  isFull,
  isNN,
  isSutegana,
  kanaToHangul,
  suteganaMergeTable,
  suteganaToHangul,
} from "./kana";
import { tokenize } from "./tokenizer";

export function kanaStringToHangul(kanaString: string) {
  return tokenize(kanaString)
    .map((token) => {
      if (token.type === "Hiragana") return kanaWordToHangul(token.value);
      if (token.type === "Katakana") return kanaWordToHangul(token.value);
      if (token.type === "Alphabet") return token.value;
      if (token.type === "Other") return token.value;
    })
    .join("");
}

function kanaWordToHangul(word: string) {
  const chars = [...word];
  const result: string[] = [];
  let cursor = 0;

  while (cursor < word.length) {
    let forElse = true;
    for (const processor of kanaToHangulProcessors) {
      const res = processor(chars, cursor);
      if (res == null) continue;
      consume(res.char, res.stride);
      forElse = false;
      break;
    }
    if (forElse) throw new Error(`Exhaustive type check: ${word[cursor]} at ${cursor}`);
  }

  return result.join("");

  function consume(char: string, stride: number) {
    result.push(char);
    cursor += stride;
  }
}

export const kanaToHangulProcessors: ((
  chars: string[],
  cursor: number,
) => { char: string; stride: number } | undefined)[] = [
  function 두글자스테가나(chars, cursor) {
    const [char, next1, next2, next3] = chars.slice(cursor, cursor + 4);
    const match = suteganaMergeTable.get(hiraganaToKatakana(char + next1 + next2));
    if (match == null) return;

    if (isNN(next3)) {
      return consume(merge(match, getNasalSound(next3)), 4);
    }
    return consume(merge(match), 3);
  },
  function 한글자스테가나(chars, cursor) {
    const [char, next1, next2] = chars.slice(cursor, cursor + 3);
    const match = suteganaMergeTable.get(hiraganaToKatakana(char + next1));
    if (match == null) return;
    if (isNN(next2)) {
      return consume(merge(match, getNasalSound(next2)), 3);
    }
    if (isSutegana(next2)) {
      return consume(merge(match, suteganaToHangul.get(next2)!), 3);
    }
    return consume(merge(match), 2);
  },
  function 세글자가나(chars, cursor) {
    const [char, next1, next2] = chars.slice(cursor, cursor + 3);
    if (
      !(
        char != null &&
        next1 != null &&
        next2 != null &&
        isFull(char) &&
        isSutegana(next1) &&
        (isSutegana(next2) || isNN(next2))
      )
    )
      return;
    const originalChar = kanaToHangul.get(char)!;
    const override1 = suteganaToHangul.get(next1)!;
    const override2 = isNN(next2) ? getNasalSound(char) : suteganaToHangul.get(next2)!;
    const composed = merge(originalChar, override1, override2);

    return consume(composed, 3);
  },
  function 두글자가나(chars, cursor) {
    const [char, next1] = chars.slice(cursor, cursor + 2);
    if (!(char != null && next1 != null && isFull(char) && (isSutegana(next1) || isNN(next1))))
      return;
    const originalChar = kanaToHangul.get(char)!;
    const override = isNN(next1) ? getNasalSound(char) : suteganaToHangul.get(next1)!;
    const composed = merge(originalChar, override);

    return consume(composed, 2);
  },
  function 한글자가나(chars, cursor) {
    const [char] = chars.slice(cursor, cursor + 1);
    const kana = kanaToHangul.get(char);
    if (kana != null) return consume(kana, 1);
    return consume("", 1);
  },
];
function consume(char: string, stride: number) {
  return { char, stride };
}
