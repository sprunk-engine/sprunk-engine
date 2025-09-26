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
    // reference point: average of vertices (inside for convex polyhedron)
    const ref = new Vector3(0, 0, 0);
    for (const v of this.vertices) {
      ref.add(v.clone());
    }
    ref.scale(1 / this.vertices.length);

    let totalVolume = 0;
    const weighted = new Vector3(0, 0, 0);

    for (const face of this.faces) {
      if (face.indices.length < 3) continue;
      const i0 = face.indices[0];

      for (let k = 1; k < face.indices.length - 1; k++) {
        const ia = i0;
        const ib = face.indices[k];
        const ic = face.indices[k + 1];

        const a = this.vertices[ia];
        const b = this.vertices[ib];
        const c = this.vertices[ic];

        // relative vectors from reference
        const va = a.clone().sub(ref);
        const vb = b.clone().sub(ref);
        const vc = c.clone().sub(ref);

        // signed volume of tetrahedron
        const vol = va.dotProduct(vb.crossProduct(vc)) / 6;

        // centroid of tetrahedron
        const tetCentroid = ref
          .clone()
          .add(a)
          .add(b)
          .add(c)
          .scale(1 / 4);

        // accumulate weighted centroid
        weighted.add(tetCentroid.scale(vol));
        totalVolume += vol;
      }
    }

    if (Math.abs(totalVolume) < 1e-12) {
      // fallback: average of vertices
      const avg = new Vector3(0, 0, 0);
      for (const v of this.vertices) avg.add(v.clone());
      avg.scale(1 / this.vertices.length);
      return avg;
    }

    const centroid = weighted.scale(1 / totalVolume);

    // fix floating point noise
    const eps = 1e-9;
    centroid.x =
      Math.abs(centroid.x) < eps ? 0 : Math.round(centroid.x / eps) * eps;
    centroid.y =
      Math.abs(centroid.y) < eps ? 0 : Math.round(centroid.y / eps) * eps;
    centroid.z =
      Math.abs(centroid.z) < eps ? 0 : Math.round(centroid.z / eps) * eps;

    return centroid;
  }
}
