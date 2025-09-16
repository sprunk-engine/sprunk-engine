import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Collider } from "@extensions/PhysicsEngine/Colliders/Collider.ts";

/**
 * PolygonCollider class is a collider that represents a polygon shape
 */
export class PolygonCollider extends Collider {
  public vertices: Vector3[];
  public computedLongestVertexFromGravityCenter?: Vector3;

  constructor(vertices: Vector3[]) {
    super();
    this.vertices = vertices;
  }

  /**
   * Get the gravitation center of the polygon
   *
   * @description
   * ### The centroid \( (C_x, C_y) \) of a polygon is given by:
   * - $C_x = \frac{1}{6A} \sum_{i=1}^{n} (x_i + x_{i+1})(x_i y_{i+1} - x_{i+1} y_i)$
   * - $C_y = \frac{1}{6A} \sum_{i=1}^{n} (y_i + y_{i+1})(x_i y_{i+1} - x_{i+1} y_i)$
   * ### Where:
   * - $A$ is the area of the polygon.
   * - $(x_i, y_i)$ are the coordinates of the vertices.
   * - $n$ is the number of vertices.
   */
  public getGravitationCenter(): Vector3 {
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < this.vertices.length; i++) {
      // Get the current vertex
      const x1 = this.vertices[i].x;
      const y1 = this.vertices[i].y;

      // Get the next vertex
      const x2 = this.vertices[(i + 1) % this.vertices.length].x;
      const y2 = this.vertices[(i + 1) % this.vertices.length].y;

      const crossProduct = x1 * y2 - x2 * y1;

      // Add the cross product to the total area
      area += crossProduct;

      // Calculate the contribution of the current edge to the centroid's x and y coordinates
      // This is based on the weighted average of the vertices
      centroidX += (x1 + x2) * crossProduct;
      centroidY += (y1 + y2) * crossProduct;
    }

    area /= 2;

    // Normalize the centroid coordinates by dividing by 6 times the area (part of mathematical formula)
    centroidX /= 6 * area;
    centroidY /= 6 * area;

    if (centroidX == -0) centroidX = 0;
    if (centroidY == -0) centroidY = 0;

    return new Vector3(centroidX, centroidY, 0);
  }

  /**
   * Get the the longest vertex from the gravitation center
   */
  public getLongestVertexFromCenter(): Vector3 {
    if (this.computedLongestVertexFromGravityCenter) {
      return this.computedLongestVertexFromGravityCenter;
    }

    const center = this.getGravitationCenter();
    let longestDistance = 0;
    let longestVertex = center;

    this.vertices.forEach((vertex) => {
      const distance = vertex.clone().sub(center);
      if (distance.length > longestDistance) {
        longestDistance = distance.length;
        longestVertex = vertex;
      }
    });

    this.computedLongestVertexFromGravityCenter = longestVertex;
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
