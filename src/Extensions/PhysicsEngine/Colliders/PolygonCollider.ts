import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Collider } from "@extensions/PhysicsEngine/Colliders/Collider.ts";
import { Polyhedron } from "@extensions/PhysicsEngine/Shapes/polyhedron.ts";
/**
 * PolygonCollider class is a collider that represents a polygon shape
 */
export class PolygonCollider extends Collider {
  public vertices: Vector3[];
  private _computedLongestVertexFromGravityCenter?: Vector3;

  constructor(vertices: Vector3[]) {
    super();
    this.shape = new Polyhedron(vertices);
    this.vertices = vertices;
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
