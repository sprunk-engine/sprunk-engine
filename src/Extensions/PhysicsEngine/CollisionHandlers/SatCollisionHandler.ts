import { PolygonCollider } from "@extensions/PhysicsEngine/Colliders/PolygonCollider.ts";
import { ShapedCollider } from "@extensions/PhysicsEngine/Colliders/ShapedCollider.ts";
import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { CollisionHandler } from "@extensions/PhysicsEngine/CollisionHandlers/CollisionHandler.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";
import { CollisionFactory } from "@extensions/PhysicsEngine/Colliders/CollisionFactory.ts";

// TODO: check the 3D collision

/**
 * SatCollisionHandler class is a collision handler that uses the Separating Axis Theorem (SAT) to check for collisions
 * Colliders MUST be convex!!
 */
export class SatCollisionHandler implements CollisionHandler {
  /**
   * Helper function to calculate projection of vertices onto an axis
   */
  private projectVertices(
    vertices: Vector3[],
    axis: Vector3,
  ): { min: number; max: number } {
    const projections: number[] = vertices.reduce(
      (projections: number[], vertex: Vector3) => {
        projections.push(axis.dotProduct(vertex));
        return projections;
      },
      [],
    );

    return { min: Math.min(...projections), max: Math.max(...projections) };
  }

  /**
   * Helper function to get the axes of a polygon (perpendicular vectors to the edges of the polygon)
   */
  private getSATAxes(vertices: Vector3[]): Vector3[] {
    return vertices.reduce((axes: Vector3[], vertex: Vector3, i: number) => {
      const edge: Vector3 = vertices[(i + 1) % vertices.length]
        .clone()
        .sub(vertex);
      axes.push(new Vector3(-edge.y, edge.x, 0).normalize());
      return axes;
    }, []);
  }

  public areColliding(a: ShapedCollider, b: ShapedCollider): Collision | null {
    if (a instanceof PolygonCollider && b instanceof PolygonCollider) {
      return this.areCollidingPolygonToPolygon(a, b);
    }
    throw new Error("Not implemented");
  }

  /**
   * Check if two PolygonColliders are colliding using the Separating Axis Theorem (SAT)
   * @param a
   * @param b
   */
  public areCollidingPolygonToPolygon(
    a: PolygonCollider,
    b: PolygonCollider,
  ): Collision | null {
    let normal: Vector3 | undefined;
    let depth: number | undefined;

    // Get transformed vertices
    const verticesA: Vector3[] = a.getVerticesWithTransform();
    const verticesB: Vector3[] = b.getVerticesWithTransform();

    // Get all axes to test (edges of both polygons)
    const axes: Vector3[] = [
      ...this.getSATAxes(verticesA),
      ...this.getSATAxes(verticesB),
    ];

    // Check every axis of the polygons for separation
    for (const axis of axes) {
      axis.normalize();

      const projectionA: { min: number; max: number } = this.projectVertices(
        verticesA,
        axis,
      );
      const projectionB: { min: number; max: number } = this.projectVertices(
        verticesB,
        axis,
      );

      // If there is a separation axis, the polygons are not colliding
      if (
        projectionA.max < projectionB.min ||
        projectionB.max < projectionA.min
      ) {
        return null;
      }

      // Resolve the depth of the collision
      const axisDepth =
        Math.min(projectionA.max, projectionB.max) -
        Math.max(projectionA.min, projectionB.min);

      // Keep the smallest depth and normal throughout the iterations
      if (depth === undefined || axisDepth < depth) {
        depth = axisDepth;
        normal = axis;
      }
    }

    // Calculate a vector from the center of A to the center of B
    const worldCenterA: Vector3 = a
      .getGravitationCenter()
      .add(a.getWorldPosition());
    const worldCenterB: Vector3 = b
      .getGravitationCenter()
      .add(b.getWorldPosition());

    // Adjust the normal direction if necessary
    if (worldCenterB.sub(worldCenterA).dotProduct(normal!) < 0) {
      normal = normal!.scale(-1);
    }

    return CollisionFactory.create(depth!, normal!, a, b); // No separating axis found, polygons are colliding
  }
}
