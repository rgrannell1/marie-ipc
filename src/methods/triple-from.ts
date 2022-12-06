import { Triple } from "../types";

/*
 * Given a string of triples, yield the parsed triples.
 *
 */
export function* tripleFrom<T>(
  triplesString: string,
  deref: boolean = false,
): Generator<Triple<T>, void, unknown> {
  for (const line of triplesString.split("\n")) {
    const triple = this.parse(line, deref);
    if (triple) {
      yield triple;
    }
  }
}
