/*
 * A triple associates src, relationship, and target entities
 * specified by an identifier.
 *
 */
export type Triple = {
  src: any;
  rel: any;
  tgt: any;
};

export type Entity = Record<any, any>;
