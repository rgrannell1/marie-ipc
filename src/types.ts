/*
 * A triple associates src, relationship, and target entities
 * specified by an identifier.
 *
 */
export type Triple = {
  src: string;
  rel: string;
  tgt: string;
};

export type Entity = Record<string, any>;
