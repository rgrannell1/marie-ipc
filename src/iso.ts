import { Content, Entity, ID, IMarieIPC, Triple } from "./types.ts";
import { MarieIpcState } from "./state.ts";
import { Isomorphism } from "./isomorphism.ts";
import { parse } from "./methods/parse.ts";
import { REL_KEYWORD, SRC_KEYWORD, TGT_KEYWORD } from "./constants.ts";

/*
 * Marie IPC class for parsing / serialising Marie IPC files.
 *
 */
export class MarieIpc implements IMarieIPC {
  // keywords used in marie-IPC
  static keywords: Set<string> = new Set([
    SRC_KEYWORD,
    REL_KEYWORD,
    TGT_KEYWORD,
  ]);

  // the initial state for a marie parser
  state: MarieIpcState = {
    maxId: -1,
    line: -1,
    triple: {},
    iso: new Isomorphism<ID, Content>(),
  };

  /*
   * Return current maximum id used an alias for triple content
   *
   */
  maxId() {
    return this.state.maxId;
  }

  /**
   * Find the alias for an identifier in a triple, and return a boolean
   * flag indicating if the binding existed prior to this call.
   *
   * @param identifier an identifier pulled from some triple
   *
   * @returns [number, boolean]
   */
  binding(identifier: string): [number, boolean] {
    const iso = this.state.iso;

    if (iso.hasRight(identifier)) {
      return [
        iso.getLeft(identifier) as number,
        false,
      ];
    } else {
      let tgtId = this.maxId() + 1;
      iso.set(tgtId, identifier);
      this.state.maxId = tgtId;

      return [
        tgtId,
        true,
      ];
    }
  }

  /**
   * Construct a statement aliasing an identifier
   *
   * @param alias a numeric alias
   * @param identifier an identifier
   *
   * @returns a marie identifier-binding statement
   */
  static bindingStatement(alias: number, identifier: any) {
    return `${alias} ${JSON.stringify(identifier.toString())}`;
  }

  /*
   *
   *
   */
  entityTo(entity: Entity): string {
    const statements: string[] = [];

    if (!entity.hasOwnProperty("id")) {
      throw new TypeError("id property missing from entity");
    }

    let [srcId, srcAdded] = this.binding(entity.id.toString());
    if (srcAdded) {
      statements.push(MarieIpc.bindingStatement(srcId, entity.id));
    }

    for (const pair of Object.entries(entity)) {
      const [rel, value] = pair;

      // -- set rel, if not mapped
      let [relId, relAdded] = this.binding(rel.toString());
      if (relAdded) {
        statements.push(MarieIpc.bindingStatement(relId, rel));
      }

      if (typeof value === "string") {
        var [tgtId, tgtAdded] = this.binding(value.toString());
        if (tgtAdded) {
          statements.push(MarieIpc.bindingStatement(tgtId, value));
        }
      } else if (typeof value === "number") {
        var [tgtId, tgtAdded] = this.binding(value.toString());
        if (tgtAdded) {
          statements.push(MarieIpc.bindingStatement(tgtId, value));
        }
      } else if (Array.isArray(value)) {
        // array of targets

        for (const bit of value) {
          if (Array.isArray(bit)) {
            // array of arrays
            const [tgtBit, tgtType] = bit;
            let [tgtBitId, tgtBitAdded] = this.binding(tgtBit.toString());
            if (tgtBitAdded) {
              statements.push(MarieIpc.bindingStatement(tgtBitId, tgtBit));
            }

            let [tgtTypeId, tgtTypeAdded] = this.binding(tgtType.toString());
            if (tgtTypeAdded) {
              statements.push(MarieIpc.bindingStatement(tgtTypeId, tgtType));
            }

            let [isId, isAdded] = this.binding("is");
            if (isAdded) {
              statements.push(MarieIpc.bindingStatement(isId, "is"));
            }

            statements.push(
              `${SRC_KEYWORD} ${srcId} ${REL_KEYWORD} ${relId} ${TGT_KEYWORD} ${tgtBitId}`,
            );
            statements.push(
              `${SRC_KEYWORD} ${tgtBitId} ${REL_KEYWORD} ${isId} ${TGT_KEYWORD} ${tgtTypeId}`,
            );
          } else {
            let [bitId, bitAdded] = this.binding(bit.toString());
            if (bitAdded) {
              statements.push(MarieIpc.bindingStatement(bitId, bit));
            }

            statements.push(`src ${srcId} rel ${relId} tgt ${bitId}`);
          }
        }
        continue;
      }

      statements.push(
        `${SRC_KEYWORD} ${srcId} ${REL_KEYWORD} ${relId} ${TGT_KEYWORD} ${tgtId}`,
      );
    }

    return statements.join("\n");
  }

  /*
   * Unimplemented.
   *
   */
  *entityFrom(triples: string): Generator<Entity, void, unknown> {
  }

  /*
   * Convert triple to a series of Marie-IPC statements
   *
   */
  tripleTo(triple: Triple<string>): string {
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

    let srcId, relId, tgtId: number = -1;

    if (this.state.iso.hasRight(triple.src)) {
      // given the identifier, load the source id
      srcId = this.state.iso.getLeft(triple.src);
    } else {
      // -- if src isn't stored, store it and emit a binding statement
      srcId = this.maxId() + 1;
      this.state.iso.set(srcId, triple.src);

      statements.push(`${srcId} ${JSON.stringify(triple.src)}`);
      this.state.maxId = srcId;
    }

    // -- if rel isn't stored, store it and emit a binding statement
    if (this.state.iso.hasRight(triple.rel)) {
      relId = this.state.iso.getLeft(triple.rel);
    } else {
      relId = this.maxId() + 1;
      this.state.iso.set(relId, triple.rel);

      statements.push(`${relId} ${JSON.stringify(triple.rel)}`);
      this.state.maxId = relId;
    }

    // -- if tgt isn't stored, store it and emit a binding statement
    if (this.state.iso.hasRight(triple.tgt)) {
      tgtId = this.state.iso.getLeft(triple.tgt) as number;
    } else {
      tgtId = this.maxId() + 1;
      this.state.iso.set(tgtId, triple.tgt);

      statements.push(`${tgtId} ${JSON.stringify(triple.tgt)}`);
      this.state.maxId = tgtId;
    }

    statements.push(
      `${SRC_KEYWORD} ${srcId} ${REL_KEYWORD} ${relId} ${TGT_KEYWORD} ${tgtId}`,
    );

    return statements.join("\n");
  }

  /*
   * Read triples from a string, and yield parsed triples.
   *
   */
  *tripleFrom(
    triples: string,
    deref: boolean = false,
  ): Generator<Triple<string> | Triple<number>, void, unknown> {
    for (const line of triples.split("\n")) {
      const triple = this.parse(line, deref);
      if (triple) {
        yield triple;
      }
    }
  }

  /*
   * Parse Marie IPC and update parser state based on what is read.
   *
   */
  parse(
    line: string,
    deref: boolean = false,
  ): Triple<string> | Triple<number> | undefined {
    return parse(this.state, line, deref);
  }
}
