import { CollisionHandler } from "@extensions/PhysicsEngine/CollisionHandlers/CollisionHandler.ts";
import { ShapedCollider } from "@extensions/PhysicsEngine/Colliders/ShapedCollider.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";
import { Vector3 } from "@core/MathStructures/Vector3.ts";

export class GjkCollisionHandler implements CollisionHandler {
  private simplex: [Vector3?, Vector3?, Vector3?, Vector3?] = []; // higher the index, younger the point

  areColliding(a: ShapedCollider, b: ShapedCollider): Collision | null {
    this.simplex = [];

    // Build the initial simplex (tetrahedron) and exit if it can't contain the origin
    if (!this.isOriginInInitialSimplex(a, b)) {
      return null; // No collision
    }

    // Check if the origin is in the ABC face region
    if (!this.isOriginInFaceRegion("A", "B", "C", "D")) {
      return null; // No collision
    }

    return null; // Placeholder return
  }

  /**
   * Build the initial simplex (tetrahedron)
   * @param a First collider
   * @param b Second collider
   * @returns true if the simplex can contain the origin, false if it can't
   */
  private isOriginInInitialSimplex(
    a: ShapedCollider,
    b: ShapedCollider,
  ): boolean {
    const centerA = a.getGravitationCenter().add(a.getWorldPosition());
    const centerB = b.getGravitationCenter().add(b.getWorldPosition());

    // Set initial support point
    let d = centerB.clone().sub(centerA); // Direction from A to B
    this.simplex.push(this.support(a, b, d)); // Initial support point

    // Set second support point
    d = d.scale(-1); // Reverse direction (passing through the origin)
    this.simplex.push(this.support(a, b, d));
    if (!this.didSupportPassOrigin(d)) {
      return false; // No collision
    }

    // Set third support point
    let ba = this.getSimplexEdge("B", "A");
    let oa = this.resolveSimplexPoint("A")!.scale(-1); // Vector from A to Origin
    d = ba.crossProduct(oa).crossProduct(ba);
    this.simplex.push(this.support(a, b, d));
    if (!this.didSupportPassOrigin(d)) {
      return false; // No collision
    }

    // Set fourth support point
    ba = this.getSimplexEdge("B", "A");
    oa = this.resolveSimplexPoint("A").scale(-1); // Vector from A to Origin
    let ca = this.getSimplexEdge("C", "A");
    d = ba.crossProduct(ca);
    if (d.dotProduct(oa) <= 0) {
      d = d.scale(-1);
    }
    this.simplex.push(this.support(a, b, d));
    if (!this.didSupportPassOrigin(d)) {
      return false; // No collision
    }

    return true; // The origin is possibly contained in the simplex
  }

  private isOriginInFaceRegion(
    letterA: string,
    letterB: string,
    letterC: string,
    letterD: string,
  ): boolean {
    let areVoronoiRegionsChecked = false;
    while (!areVoronoiRegionsChecked) {
      // Calculate the normals of the face ABC of the tetrahedron
      const nABC = this.getSimplexFaceNormal(letterA, letterB, letterC);
      const da = this.getSimplexEdge(letterD, letterA);
      const nABCdotDA = nABC.dotProduct(da);
      const nABCdotOA = nABC.dotProduct(
        this.resolveSimplexPoint(letterA).scale(-1),
      );
      if (nABCdotDA * nABCdotOA < 0) {
        // Math trick to know if the origin is in the direction of the normal
        // rework the 2D simplex
      }
    }
    return true;
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
    const lastPoint = this.simplex[0];
    if (!lastPoint) throw new Error("Simplex is empty");
    return lastPoint.dotProduct(d) >= 0;
  }

  /**
   * Get the edge vector between two points in the simplex
   * pointA - pointB
   * @param a Index of the first point
   * @param b Index of the second point
   */
  private getSimplexEdge(a: string, b: string): Vector3 {
    const pointA = this.resolveSimplexPoint(a);
    const pointB = this.resolveSimplexPoint(b);
    if (!pointA || !pointB) throw new Error("Simplex is incomplete");
    return pointA.sub(pointB);
  }

  /**
   * Get the normal vector of a face in the simplex
   * @param a Index of the first point
   * @param b Index of the second point
   * @param c Index of the third point
   */
  private getSimplexFaceNormal(a: string, b: string, c: string): Vector3 {
    const pointA = this.resolveSimplexPoint(a);
    const pointB = this.resolveSimplexPoint(b);
    const pointC = this.resolveSimplexPoint(c);
    if (!pointA || !pointB || !pointC) throw new Error("Simplex is incomplete");
    const ab = pointB.clone().sub(pointA);
    const ac = pointC.clone().sub(pointA);
    return ab.crossProduct(ac).normalize();
  }

  /**
   * Resolves a point in the simplex by its letter identifier (TODO: remove to optimize perfs)
   * @param letter Letter identifier of the point (A, B, C, D)
   */
  private resolveSimplexPoint(letter: string): Vector3 {
    const maxIndex = this.simplex.length - 1;
    let index;
    if (letter === "A") index = maxIndex;
    else if (letter === "B") index = maxIndex - 1;
    else if (letter === "C") index = maxIndex - 2;
    else if (letter === "D") index = maxIndex - 3;
    else throw new Error("Invalid simplex point letter");
    const point = this.simplex[index];
    if (!point) throw new Error("Simplex is incomplete");
    return point;
  }
}
