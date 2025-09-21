import { CollisionHandler } from "@extensions/PhysicsEngine/CollisionHandlers/CollisionHandler.ts";
import { ShapedCollider } from "@extensions/PhysicsEngine/Colliders/ShapedCollider.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";
import { Vector3 } from "@core/MathStructures/Vector3.ts";

export class GjkCollisionHandler implements CollisionHandler {
  private simplex: [Vector3?, Vector3?, Vector3?, Vector3?] = [];

  areColliding(a: ShapedCollider, b: ShapedCollider): Collision | null {
    const centerA = a.getGravitationCenter().add(a.getWorldPosition());
    const centerB = b.getGravitationCenter().add(b.getWorldPosition());

    // Set initial support point
    let d = centerB.clone().sub(centerA); // Direction from A to B
    this.simplex.push(this.support(a, b, d)); // Initial support point

    // Set second support point
    d = d.scale(-1); // Reverse direction (passing through the origin)
    this.simplex.push(this.support(a, b, d));
    if (!this.didSupportPassOrigin(d)) {
      return null; // No collision
    }

    return null; // Placeholder return
  }

  /**
   * Get the support point in the Minkowski Difference
   * @param a First collider
   * @param b Second collider
   * @param d Direction vector
   */
  private support(a: ShapedCollider, b: ShapedCollider, d: Vector3): Vector3 {
    const pointA = a.getSupportPoint(d).add(a.getWorldPosition());
    const pointB = b.getSupportPoint(d.scale(-1)).add(b.getWorldPosition());
    return pointA.sub(pointB);
  }

  /**
   * Checks if the support points have passed the origin
   * @param d direction vector
   */
  private didSupportPassOrigin(d: Vector3): boolean {
    const lastIndex = this.simplex.length - 1;
    const lastPoint = this.simplex[lastIndex];
    if (!lastPoint) throw new Error("Simplex is empty");
    return lastPoint.dotProduct(d) >= 0;
  }
}
