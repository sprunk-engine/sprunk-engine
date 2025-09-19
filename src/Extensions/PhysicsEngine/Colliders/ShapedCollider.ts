import { Vector3 } from "@core/MathStructures/Vector3.ts";

/**
 * Interface for colliders that have a shape (like PolygonCollider, CircleCollider, etc.)
 */
export interface ShapedCollider {
  /**
   * Get the support (furthest) point in a given direction.
   * useful in GJK algorithm.
   * @param d The direction to get the support point in
   */
  getSupportPoint(d: Vector3): Vector3;

  /**
   * Get the gravitation center of the polygon
   */
  getGravitationCenter(): Vector3;

  /**
   * Get the world position of the collider
   */
  getWorldPosition(): Vector3;
}
