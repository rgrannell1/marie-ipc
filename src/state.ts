import { Isomorphism } from "./isomorphism.ts";
import { Content, ID } from "./types.ts";

/*
 * State held by Marie's serialiser / deserialiser.
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
  iso: Isomorphism<ID, Content>;
};
