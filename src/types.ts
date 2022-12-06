/*
 * A triple associates src, relationship, and target entities
 * specified by an identifier.
 *
 */
export type Triple<T> = {
  src: T;
  rel: T;
  tgt: T;
};

/*
 * An entity has relationships as keys, and values as target entities or arrays of
 *   targets.
 *
 */
export type Entity = Record<any, any>;

/*
 * Interface for Marie IPC. It's an isomorphism from
 * a custom serialisation format to triple and entity-form
 * relationships
 *
 */
export interface IMarieIPC {
  maxId(): number;
  entityTo(entity: Entity): string;
  entityFrom(triples: string): Generator<Entity, void, unknown>;
  tripleTo(triple: Triple<string> | Triple<number>): string;
  tripleFrom(
    triples: string,
    deref: boolean,
  ): Generator<Triple<string> | Triple<number>, void, unknown>;
}

/*
 * ID is a numeric field
 */
export type ID = number;

/*
 * Content (or identifier) is a string field
 */
export type Content = string;
