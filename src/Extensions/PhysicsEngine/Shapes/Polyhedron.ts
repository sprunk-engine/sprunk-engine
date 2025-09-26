import { Shape } from "@extensions/PhysicsEngine/Shapes/Shape.ts";
import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face";
import { QuickHull3D } from "@extensions/PhysicsEngine/Shapes/QuickHull3D";

export class Polyhedron implements Shape {
  public readonly vertices: Vector3[];
  private faces: Face[] = [];
  private _computedLongestVertexFromGravityCenter?: Vector3;

  constructor(vertices: Vector3[]) {
    this.vertices = vertices;

    if (this.faces.length == 0) {
      const hull = new QuickHull3D(vertices);
      hull.build();
      this.faces = hull.getMergedCoplanarFaces();
    }
  }

  public getSupportPoint(d: Vector3): Vector3 {
    let supportPoint: Vector3 = this.vertices[0];
    let maxDot = -Infinity;

    this.vertices.forEach((v) => {
      const dot = d.dotProduct(v);
      if (dot > maxDot) {
        maxDot = dot;
        supportPoint = v;
      }
    });

    return supportPoint;
  }

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

  public getGravitationCenter(): Vector3 {
    let centroid = new Vector3(0, 0, 0);

    for (const v of this.vertices) {
      centroid.add(v);
    }

    centroid.scale(1 / this.vertices.length);
    return centroid;
  }
}
