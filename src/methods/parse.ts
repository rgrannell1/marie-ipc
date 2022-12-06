import { Triple } from "../types.ts";
import { MarieIpcState } from "../state.ts";
import { REL_KEYWORD, SRC_KEYWORD, TGT_KEYWORD } from "../constants.ts";

// Aliases associates some literal in a triple with a number "pointer"
const ALIAS = /^\d+$/;
const ALIAS_DECLARATION = /^\d+/;

// keywords used in marie-IPC
const KEYWORDS = new Set([
  SRC_KEYWORD,
  REL_KEYWORD,
  TGT_KEYWORD,
]);

/*
 * Parse an alias definition line
 *
 */
function parseAlias(state: MarieIpcState, line: string) {
  const [alias, ...value] = line.split(" ");

  // -- test for a valid alias
  if (!ALIAS.test(alias)) {
    throw new SyntaxError(
      `line ${state.line}: non-numeric content alias provided; ${alias}`,
    );
  }

  // -- minimise id exhaustion and other weirdness by just allowing incremental ids for content
  const aliasId = parseInt(alias);
  const nextFreeAlias = state.maxId + 1;

  if (aliasId !== nextFreeAlias) {
    throw new SyntaxError(
      `line ${state.line}: content alias ${aliasId} was not ${nextFreeAlias} as expected`,
    );
  }

  try {
    var parsed = JSON.parse(value.join(" "));
    if (typeof parsed === "number") {
      parsed = `${parsed}`;
    }
  } catch (err) {
    throw new Error(
      `line ${state.line}: failed to parse value ${value} as JSON`,
    );
  }

  if (typeof parsed !== "string") {
    throw new SyntaxError(
      `line ${state.line}: non-string triple provided`,
    );
  }
  if (state.iso.hasLeft(aliasId)) {
    throw new SyntaxError(
      `line ${state.line}: mapping for ${alias} already present, cannot override`,
    );
  }

  state.maxId = aliasId;
  state.iso.set(aliasId, parsed);

  return undefined;
}

/*
 *
 */
function parseRelation(state: MarieIpcState, line: string, deref: boolean) {
  const tokens = line.split(" ");

  // -- rule out improper length sequences
  if (tokens.length % 2 !== 0) {
    throw new SyntaxError(
      `line ${state.line}: expected key-id pairs, got ${line}`,
    );
  }

  let sawSrc, sawRel, sawTgt = false;

  // -- process triple to identifier bindings. Iterate pairwise.
  for (let idx = 0; idx < tokens.length; idx += 2) {
    let keyword = tokens[idx];
    let value = tokens[idx + 1];

    // -- check there's no repeat declarations
    if (keyword === "src") {
      if (sawSrc) {
        throw new SyntaxError(
          `line ${state.line}: cannot set ${keyword} multiple times in one line`,
        );
      }
      sawSrc = true;
    } else if (keyword === "rel") {
      if (sawRel) {
        throw new SyntaxError(
          `line ${state.line}: cannot set ${keyword} multiple times in one line`,
        );
      }
      sawRel = true;
    } else if (keyword === "tgt") {
      if (sawTgt) {
        throw new SyntaxError(
          `line ${state.line}: cannot set ${keyword} multiple times in one line`,
        );
      }
      sawTgt = true;
    }

    // -- previously-seen assertions done

    if (!ALIAS.test(value)) {
      throw new SyntaxError(
        `line ${state.line}: non-numeric content alias provided`,
      );
    }

    const aliasId = parseInt(value);

    (state.triple as any)[keyword] = aliasId;
  }

  // -- throw an error if any part of the triple has not been filled in
  if (
    state.triple.src === undefined ||
    state.triple.rel === undefined ||
    state.triple.tgt === undefined
  ) {
    throw new TypeError(
      `line ${state.line}: could not yield triple, as entity undefined. Offending triple is ${line}`,
    );
  }

  if (deref) {
    // -- return a triple, since updated triple state was provided
    return {
      src: state.iso.getRight(state.triple.src) as string,
      rel: state.iso.getRight(state.triple.rel) as string,
      tgt: state.iso.getRight(state.triple.tgt) as string,
    };
  } else {
    // -- return a triple, since updated triple state was provided
    return {
      src: state.triple.src,
      rel: state.triple.rel,
      tgt: state.triple.tgt,
    };
  }
}

/*
 * Parse a line from a Marie IPC file
 *
 */
export function parse(
  state: MarieIpcState,
  line: string,
  deref: boolean = false,
): Triple<string> | Triple<number> | undefined {
  state.line++;

  // -- starts with a alias
  if (ALIAS_DECLARATION.test(line)) {
    return parseAlias(state, line);
  }

  // -- starts with src | rel | tgt
  let keyword = line.slice(0, 3);
  if (KEYWORDS.has(keyword)) {
    return parseRelation(state, line, deref);
  }
}
