import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Collider } from "@extensions/PhysicsEngine/Colliders/Collider.ts";
import { IShapedCollider } from "@extensions/PhysicsEngine/Colliders/ShapedCollider.ts";

/**
 * PolygonCollider class is a collider that represents a polygon shape
 */
export class PolygonCollider extends Collider implements IShapedCollider {
  public vertices: Vector3[];
  private _computedLongestVertexFromGravityCenter?: Vector3;

  constructor(vertices: Vector3[]) {
    super();
    this.vertices = vertices;
  }

  public getSupportPoint(d: Vector3): Vector3 {
    let supportPoint: Vector3 = this.vertices[0];
    let maxDot = Number.MIN_VALUE;

    this.vertices.forEach((v) => {
      const dot = d.dotProduct(v);
      if (dot > maxDot) {
        maxDot = dot;
        supportPoint = v;
      }
    });

    return supportPoint;
  }

  /**
   * Get the gravitation center of the polygon
   */
  public getGravitationCenter(): Vector3 {
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < this.vertices.length; i++) {
      const x1 = this.vertices[i].x;
      const y1 = this.vertices[i].y;
      const x2 = this.vertices[(i + 1) % this.vertices.length].x;
      const y2 = this.vertices[(i + 1) % this.vertices.length].y;

      const cross = x1 * y2 - x2 * y1;

      area += cross;
      centroidX += (x1 + x2) * cross;
      centroidY += (y1 + y2) * cross;
    }

    area *= 0.5;

    centroidX /= 6 * area;
    centroidY /= 6 * area;

    // Pour Z : comme tes sommets sont coplanaires, on peut juste faire la moyenne
    let centroidZ = 0;
    for (const v of this.vertices) {
      centroidZ += v.z;
    }
    centroidZ /= this.vertices.length;

    return new Vector3(centroidX, centroidY, centroidZ);
  }

  /**
   * Get the the longest vertex from the gravitation center
   */
  public getLongestVertexFromCenter(): Vector3 {
    if (this._computedLongestVertexFromGravityCenter) {
      return this._computedLongestVertexFromGravityCenter;
    }

    const center = this.getGravitationCenter();
    let longestDistance: number | undefined = undefined;
    let longestVertex = center;

    this.vertices.forEach((vertex) => {
      const distance = vertex.clone().sub(center);
      if (longestDistance === undefined || distance.length > longestDistance) {
        longestDistance = distance.length;
        longestVertex = vertex;
      }
    });

    this._computedLongestVertexFromGravityCenter = longestVertex;
    return longestVertex;
  }

  /**
   * Get the vertices of the polygon with the transform of the game object
   */
  public getVerticesWithTransform(): Vector3[] {
    const transformedVertices: Vector3[] = [];

    this.vertices.forEach((vertex) => {
      transformedVertices.push(
        vertex
          .clone()
          .scaleAxis(this.gameObject.transform.worldScale) // Apply world scale
          .rotate(this.gameObject.transform.worldRotation) // Apply world rotation
          .add(this.gameObject.transform.worldPosition), // Apply world position
      );
    });

    return transformedVertices;
  }
}
