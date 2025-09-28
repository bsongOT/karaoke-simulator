import { final, finalCodes, initial, initialCodes, medial, medialCodes } from "./hangul-letter";

export type Decomposed = {
  initial: string;
  medial: string;
  final: string;
};

export function makeDecomposed(initial: string, medial: string, final: string): Decomposed {
  return {
    initial,
    medial,
    final,
  };
}

export function makeFinalOnly(final: string): Decomposed {
  return {
    initial: "",
    medial: "",
    final,
  };
}

const syllableStart = 0xac00;
const syllableEnd = 0xd7a3;

export function decompose(char: string) {
  const charCode = char.charCodeAt(0);

  if (char.length !== 1 || charCode < syllableStart || syllableEnd < charCode) {
    return null;
  } else {
    const syllableIndex = charCode - syllableStart;
    const initialIndex = (syllableIndex / (21 * 28)) | 0;
    const medialIndex = ((syllableIndex % (21 * 28)) / 28) | 0;
    const finalIndex = syllableIndex % 28;
    return {
      initial: assert(initial[initialIndex]),
      medial: assert(medial[medialIndex]),
      final: assert(final[finalIndex]),
    };
  }
}

export function compose(decomposed: Decomposed) {
  const initialCode = assert(initialCodes.get(decomposed.initial));
  const medialCode = assert(medialCodes.get(decomposed.medial));
  const finalCode = assert(finalCodes.get(decomposed.final));

  return String.fromCharCode(syllableStart + initialCode * 21 * 28 + medialCode * 28 + finalCode);
}

export function merge(...[first, ...rest]: (string | Decomposed)[]): string {
  const _first = assert(typeof first === "string" ? decompose(first) : first);
  return compose(rest.reduce(mergeDecomposed, _first) as Decomposed);
}

export function mergeDecomposed(a: string | Decomposed, b: string | Decomposed): Decomposed {
  const _a = assert(typeof a === "string" ? decompose(a) : a);
  const _b = assert(typeof b === "string" ? decompose(b) : b);

  return {
    initial: merge(_a.initial, _b.initial),
    medial: merge(_a.medial, _b.medial),
    final: merge(_a.final, _b.final),
  };
  function merge(a: string, b: string) {
    if (b !== "") return b;
    return a;
  }
}

/**
 * @deprecated
 */
export function composeOverride(originalChar: string, override: Decomposed) {
  const decomposed = decompose(originalChar);
  if (decomposed == null) throw new Error("originalChar cannot be decomposed");

  return compose({
    initial: select(override.initial, decomposed.initial),
    medial: select(override.medial, decomposed.medial),
    final: select(override.final, decomposed.final),
  });
  function select(a: string, b: string) {
    if (a !== "") return a;
    return b;
  }
}

/**
 * @deprecated
 */
export function composeOverride2(
  originalChar: string,
  override1: Decomposed,
  override2: Decomposed,
) {
  const decomposed = decompose(originalChar);
  if (decomposed == null) throw new Error("originalChar cannot be decomposed");

  return compose({
    initial: select(override1.initial, override2.initial, decomposed.initial),
    medial: select(override1.medial, override2.medial, decomposed.medial),
    final: select(override1.final, override2.final, decomposed.final),
  });

  function select(a: string, b: string, c: string) {
    if (a !== "" && b === "") return a;
    if (a === "" && b !== "") return b;
    return c;
  }
}

function assert<T>(x: T | null | undefined): T {
  if (x == null) throw new Error(`T is ${x}`);
  return x;
}
