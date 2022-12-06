/*
 * Isomorphism
 *
 * A bidirectional map between terms of two types.
 *
 */
export class Isomorphism<Left, Right> {
  leftToRight: Map<Left, Right>;
  rightToLeft: Map<Right, Left>;

  constructor() {
    this.leftToRight = new Map<Left, Right>();
    this.rightToLeft = new Map<Right, Left>();
  }

  /*
  * Set a left-right pair
  */
  set(left: Left, right: Right) {
    this.leftToRight.set(left, right);
    this.rightToLeft.set(right, left);

    return this;
  }

  /*
  * Does a left exist?
  */
  hasLeft(left: Left) {
    return this.leftToRight.has(left);
  }

  /*
  * Does a right exist?
  */
  hasRight(right: Right) {
    return this.rightToLeft.has(right);
  }

  /*
   * Given a left, return its right
   */
  getRight(left: Left) {
    return this.leftToRight.get(left);
  }

  /*
   * Given a right, return its left
   */
  getLeft(right: Right) {
    return this.rightToLeft.get(right);
  }

  /*
   * Delete a left-right pair
   */
  delete(left: Left, right: Right) {
    this.leftToRight.delete(left);
    this.rightToLeft.delete(right);

    return this;
  }
}
