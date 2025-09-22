import { Shape } from "@extensions/PhysicsEngine/Shapes/Shape.ts";
import { Vector3 } from "@core/MathStructures/Vector3.ts";

export class Polyhedron implements Shape {
  public readonly vertices: Vector3[];
  private _computedLongestVertexFromGravityCenter?: Vector3;

  constructor(vertices: Vector3[]) {
    this.vertices = vertices;
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
}
