import { Entity, Triple } from "./types.ts";

const ALIAS = /^\d+$/;
const ALIAS_DECLARATION = /^\d+/;

/*
 * Temporary state.
 *
 */
export type MarieIpcState = {
  line: number;
  maxId: number;
  triple: {
    src?: number;
    rel?: number;
    tgt?: number;
  };
  // -- note; unbounded memory
  aliasToContent: Map<number, string>;
  contentToAlias: Map<string, number>;
};

/*
 *
 *
 */
interface IMarieIPC {
  maxId(): number;
  entityTo(entity: Entity): string;
  entityFrom(triples: string): Generator<Entity, void, unknown>;
  tripleTo(triple: Triple): string;
  tripleFrom(triples: string): Generator<Triple, void, unknown>;
}

export class MarieIpc implements IMarieIPC {
  static keywords: Set<string> = new Set([
    "src",
    "rel",
    "tgt",
  ]);
  state: MarieIpcState = {
    maxId: -1,
    line: -1,
    triple: {},
    aliasToContent: new Map<number, string>(),
    contentToAlias: new Map<string, number>(),
  };

  /*
   * Return current maximum id
   *
   */
  maxId() {
    return this.state.maxId;
  }

  /*
   *
   *
   */
  entityTo(entity: Entity): string {
    const statements: string[] = [];
    
    for (const pair of Object.entries(entity)) {
      const [rel, value] = pair;
    }

    return statements.join('\n');
  }

  /*
   *
   *
   */
  *entityFrom(triples: string): Generator<Entity, void, unknown> {
  }

  /*
   * Convert triple to a series of MARIE-IPC statements
   *
   */
  tripleTo(triple: Triple): string {
    const statements: string[] = [];

    // -- check the structure of the triple
    if (!triple.hasOwnProperty("src")) {
      throw new TypeError("triple missing src");
    }
    if (!triple.hasOwnProperty("src")) {
      throw new TypeError("triple missing rel");
    }
    if (!triple.hasOwnProperty("src")) {
      throw new TypeError("triple missing tgt");
    }

    let srcId, relId, tgtId = 0;

    // -- if src isn't stored, store it and emit a binding statement
    if (this.state.contentToAlias.has(triple.src)) {
      srcId = this.state.contentToAlias.get(triple.src);
    } else {
      srcId = this.maxId() + 1;
      this.state.aliasToContent.set(srcId, triple.src);
      this.state.contentToAlias.set(triple.src, srcId);

      statements.push(`${srcId} ${JSON.stringify(triple.src)}`);
      this.state.maxId = srcId;
    }

    // -- if rel isn't stored, store it and emit a binding statement
    if (this.state.contentToAlias.has(triple.rel)) {
      relId = this.state.contentToAlias.get(triple.rel);
    } else {
      relId = this.maxId() + 1;
      this.state.aliasToContent.set(relId, triple.rel);
      this.state.contentToAlias.set(triple.rel, relId);

      statements.push(`${relId} ${JSON.stringify(triple.rel)}`);
      this.state.maxId = relId;
    }

    // -- if tgt isn't stored, store it and emit a binding statement
    if (this.state.contentToAlias.has(triple.tgt)) {
      tgtId = this.state.contentToAlias.get(triple.tgt) as number;
    } else {
      tgtId = this.maxId() + 1;
      this.state.aliasToContent.set(tgtId, triple.tgt);
      this.state.contentToAlias.set(triple.tgt, tgtId);

      statements.push(`${tgtId} ${JSON.stringify(triple.tgt)}`);
      this.state.maxId = tgtId;
    }

    statements.push(`src ${srcId} rel ${relId} tgt ${tgtId}`);

    return statements.join("\n");
  }

  /*
   *
   *
   */
  *tripleFrom(triples: string): Generator<Triple, void, unknown> {
    for (const line of triples.split("\n")) {
      yield this.parse(line, false);
    }
  }

  /*
   *
   *
   */
  parse(line: string, deref: boolean = false): Triple | undefined {
    this.state.line++;

    // -- starts with a alias
    if (ALIAS_DECLARATION.test(line)) {
      const [alias, value] = line.split(" ", 2);

      if (!ALIAS.test(alias)) {
        throw new SyntaxError(
          `line ${this.state.line}: non-numeric content alias provided; ${alias}`,
        );
      }

      // -- minimise id exhaustion and other weirdness by just allowing incremental ids for content
      const aliasId = parseInt(alias);
      if (aliasId !== this.state.maxId + 1) {
        throw new SyntaxError(
          `line ${this.state.line}: content alias ${aliasId} was not ${
            this.state.maxId + 1
          } as expected`,
        );
      }

      this.state.maxId = aliasId;

      const parsed = JSON.parse(value);
      if (typeof parsed !== "string") {
        throw new SyntaxError(
          `line ${this.state.line}: non-string triple provided`,
        );
      }
      if (this.state.aliasToContent.has(aliasId)) {
        throw new SyntaxError(
          `line ${this.state.line}: mapping for ${alias} already present, cannot override`,
        );
      }

      this.state.aliasToContent.set(aliasId, parsed);
      this.state.contentToAlias.set(parsed, aliasId);
    }

    // -- starts with src | rel | tgt
    if (MarieIpc.keywords.has(line.slice(0, 3))) {
      const tokens = line.split(" ");

      // -- rule out improper length sequences
      if (tokens.length % 2 !== 0) {
        throw new SyntaxError(
          `line ${this.state.line}: expected key-id pairs, got ${line}`,
        );
      }

      let sawSrc, sawRel, sawTgt = false;

      // -- process triple to identifier bindings
      for (let idx = 0; idx < tokens.length; idx += 2) {
        let keyword = tokens[idx];
        let value = tokens[idx + 1];

        // -- check there's no repeat declarations
        if (keyword === "src") {
          if (sawSrc) {
            throw new SyntaxError(
              `line ${this.state.line}: cannot set ${keyword} multiple times in one line`,
            );
          }
          sawSrc = true;
        } else if (keyword === "rel") {
          if (sawRel) {
            throw new SyntaxError(
              `line ${this.state.line}: cannot set ${keyword} multiple times in one line`,
            );
          }
          sawRel = true;
        } else if (keyword === "tgt") {
          if (sawTgt) {
            throw new SyntaxError(
              `line ${this.state.line}: cannot set ${keyword} multiple times in one line`,
            );
          }
          sawTgt = true;
        }

        if (!ALIAS.test(value)) {
          throw new SyntaxError(
            `line ${this.state.line}: non-numeric content alias provided`,
          );
        }

        const aliasId = parseInt(value);

        this.state.maxId = aliasId;
        this.state.triple[keyword] = aliasId;
      }

      // -- throw an error if any part of the triple has not been filled in
      if (
        this.state.triple.src === undefined ||
        this.state.triple.rel === undefined ||
        this.state.triple.tgt === undefined
      ) {
        throw new TypeError(
          `line ${this.state.line}: could not yield triple, as entity undefined. Triple ${line}`,
        );
      }

      let aliasToContent = this.state.aliasToContent;

      if (deref) {
        // -- return a triple, since updated triple state was provided
        return {
          src: aliasToContent.get(this.state.triple.src),
          rel: aliasToContent.get(this.state.triple.rel),
          tgt: aliasToContent.get(this.state.triple.tgt),
        };
      } else {
        // -- return a triple, since updated triple state was provided
        return {
          src: this.state.triple.src,
          rel: this.state.triple.rel,
          tgt: this.state.triple.tgt,
        };
      }
    }
  }
}