const tokenizeRe =
  /(?<hiragana>\p{Script=Hiragana}+)|(?<katakana>\p{Script=Katakana}+)|(?<alphabet>\p{Script=Latin}+)|(?<other>.+?)/gu;
export function tokenize(str: string) {
  return str
    .matchAll(tokenizeRe)
    .map((x) => {
      const match = x.groups!;
      if (match.hiragana != null) {
        return Hiragana(match.hiragana);
      } else if (match.katakana != null) {
        return Katakana(match.katakana);
      } else if (match.alphabet != null) {
        return Alphabet(match.alphabet);
      } else if (match.other != null) {
        return Other(match.other);
      } else {
        throw new Error("Exhaustive type check");
      }
    })
    .toArray();
}

function Hiragana(value: string) {
  return {
    type: "Hiragana" as const,
    value,
  };
}
function Katakana(value: string) {
  return {
    type: "Katakana" as const,
    value,
  };
}
function Alphabet(value: string) {
  return {
    type: "Alphabet" as const,
    value,
  };
}
function Other(value: string) {
  return {
    type: "Other" as const,
    value,
  };
}
