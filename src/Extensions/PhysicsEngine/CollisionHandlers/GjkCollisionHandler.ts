import { CollisionHandler } from "@extensions/PhysicsEngine/CollisionHandlers/CollisionHandler.ts";
import { ShapedCollider } from "@extensions/PhysicsEngine/Colliders/ShapedCollider.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";
import { Vector3 } from "@core/MathStructures/Vector3.ts";

export class GjkCollisionHandler implements CollisionHandler {
  private simplex: [Vector3?, Vector3?, Vector3?, Vector3?] = []; // higher the index, younger the point
  private readonly origin = new Vector3(0, 0, 0);

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

    // Set third support point
    let ba = this.getSimplexEdge(0, 1); // Edge from B to A
    let oa = this.simplex[1]!.scale(-1); // Vector from A to Origin
    d = ba.crossProduct(oa).crossProduct(ba);
    this.simplex.push(this.support(a, b, d));

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

  /**
   * Get the edge vector between two points in the simplex
   */
  private getSimplexEdge(index1: number, index2: number): Vector3 {
    const point1 = this.simplex[index1];
    const point2 = this.simplex[index2];
    if (!point1 || !point2) throw new Error("Simplex is incomplete");
    return point2.sub(point1);
  }
}
