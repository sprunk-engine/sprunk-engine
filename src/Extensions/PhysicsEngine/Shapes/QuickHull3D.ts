import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face.ts";

export class QuickHull3D {
  private vertices: Vector3[];
  private faces: Face[];

  constructor(vertices: Vector3[]) {
    if (vertices.length < 4) throw new Error("At least 4 points are required");
    this.vertices = vertices;
    this.faces = [];
  }

  /**
   * Build convex hull using a robust incremental algorithm
   */
  public build(): void {
    this.faces = [];

    // Step 1: Find initial simplex (tetrahedron)
    const simplex = this.findInitialSimplex();
    if (!simplex) {
      throw new Error("Points are degenerate (coplanar or collinear)");
    }

    // Step 2: Create initial faces from simplex
    this.createInitialFaces(simplex);

    // Step 3: Add remaining points incrementally
    this.addRemainingPoints();

    // Step 4: Merge coplanar faces
    this.mergeCoplanarFaces();
  }

  /**
   * Find initial tetrahedron that contains all points
   */
  private findInitialSimplex(): number[] | null {
    // Find extreme points along each axis
    const extremes = this.findExtremePoints();

    // Try different combinations to find a non-degenerate tetrahedron
    for (let i = 0; i < extremes.length; i++) {
      for (let j = i + 1; j < extremes.length; j++) {
        for (let k = j + 1; k < extremes.length; k++) {
          for (let l = k + 1; l < extremes.length; l++) {
            const tetra = [extremes[i], extremes[j], extremes[k], extremes[l]];
            if (this.isValidTetrahedron(tetra)) {
              return tetra;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Find extreme points along each axis
   */
  private findExtremePoints(): number[] {
    const extremes = new Set<number>();

    // Add min/max for each axis
    for (const axis of ["x", "y", "z"] as const) {
      let minIdx = 0;
      let maxIdx = 0;

      for (let i = 1; i < this.vertices.length; i++) {
        if (this.vertices[i][axis] < this.vertices[minIdx][axis]) minIdx = i;
        if (this.vertices[i][axis] > this.vertices[maxIdx][axis]) maxIdx = i;
      }

      extremes.add(minIdx);
      extremes.add(maxIdx);
    }

    return Array.from(extremes);
  }

  /**
   * Check if tetrahedron is valid (non-degenerate)
   */
  private isValidTetrahedron(tetra: number[]): boolean {
    const [a, b, c, d] = tetra;
    const ab = this.vertices[b].clone().sub(this.vertices[a]);
    const ac = this.vertices[c].clone().sub(this.vertices[a]);
    const ad = this.vertices[d].clone().sub(this.vertices[a]);

    const volume = Math.abs(ab.dotProduct(ac.crossProduct(ad)));
    return volume > 1e-12;
  }

  /**
   * Create initial faces from tetrahedron
   */
  private createInitialFaces(tetra: number[]): void {
    const faces = [
      { indices: [tetra[0], tetra[1], tetra[2]], normal: new Vector3(0, 0, 0) },
      { indices: [tetra[0], tetra[3], tetra[1]], normal: new Vector3(0, 0, 0) },
      { indices: [tetra[0], tetra[2], tetra[3]], normal: new Vector3(0, 0, 0) },
      { indices: [tetra[1], tetra[3], tetra[2]], normal: new Vector3(0, 0, 0) },
    ];

    // Compute proper normals (facing outward)
    for (const face of faces) {
      face.normal = this.computeFaceNormal(face.indices);
      // Ensure normal points outward
      if (!this.isNormalOutward(face)) {
        face.indices.reverse();
        face.normal = this.computeFaceNormal(face.indices);
      }
    }

    this.faces = faces;
  }

  /**
   * Add remaining points to the hull
   */
  private addRemainingPoints(): void {
    const unassigned = this.vertices
      .map((_, i) => i)
      .filter((i) => !this.faces.flatMap((f) => f.indices).includes(i));

    for (const pointIdx of unassigned) {
      this.addPointToHull(pointIdx);
    }
  }

  /**
   * Add a single point to the convex hull
   */
  private addPointToHull(pointIdx: number): void {
    const visibleFaces: number[] = [];

    // Find faces visible from the point
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      const dist = this.distanceToFace(pointIdx, face);
      if (dist > 1e-12) {
        visibleFaces.push(i);
      }
    }

    if (visibleFaces.length === 0) return; // Point inside hull

    // Find horizon edges
    const horizon = this.findHorizonEdges(visibleFaces);

    // Remove visible faces
    this.faces = this.faces.filter((_, i) => !visibleFaces.includes(i));

    // Add new faces from horizon to point
    for (const edge of horizon) {
      const newFace = {
        indices: [edge[0], edge[1], pointIdx],
        normal: new Vector3(0, 0, 0),
      };
      newFace.normal = this.computeFaceNormal(newFace.indices);
      this.faces.push(newFace);
    }
  }

  /**
   * Find horizon edges between visible and non-visible faces
   */
  private findHorizonEdges(visibleFaces: number[]): [number, number][] {
    const horizon: [number, number][] = [];
    const visibleSet = new Set(visibleFaces);

    for (const faceIdx of visibleFaces) {
      const face = this.faces[faceIdx];
      const edges = this.getFaceEdges(face);

      for (const edge of edges) {
        const oppositeFace = this.findOppositeFace(edge, faceIdx);
        if (oppositeFace === -1 || !visibleSet.has(oppositeFace)) {
          horizon.push(edge);
        }
      }
    }

    return horizon;
  }

  /**
   * Get edges of a face as [start, end] pairs
   */
  private getFaceEdges(face: Face): [number, number][] {
    const edges: [number, number][] = [];
    const n = face.indices.length;

    for (let i = 0; i < n; i++) {
      edges.push([face.indices[i], face.indices[(i + 1) % n]]);
    }

    return edges;
  }

  /**
   * Find face sharing an edge but different from excluded face
   */
  private findOppositeFace(
    edge: [number, number],
    excludeFace: number,
  ): number {
    const [u, v] = edge;

    for (let i = 0; i < this.faces.length; i++) {
      if (i === excludeFace) continue;

      const face = this.faces[i];
      if (face.indices.includes(u) && face.indices.includes(v)) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Compute face normal (assuming CCW winding)
   */
  private computeFaceNormal(indices: number[]): Vector3 {
    const v0 = this.vertices[indices[0]];
    const v1 = this.vertices[indices[1]];
    const v2 = this.vertices[indices[2]];

    return v1.clone().sub(v0).crossProduct(v2.clone().sub(v0)).normalize();
  }

  /**
   * Check if face normal points outward
   */
  private isNormalOutward(face: Face): boolean {
    // Find a point definitely inside the hull (average of vertices)
    const interior = new Vector3(0, 0, 0);
    const count = Math.min(10, this.vertices.length); // Sample some vertices
    for (let i = 0; i < count; i++) {
      interior.add(this.vertices[i]);
    }
    interior.scale(1 / count);

    // Vector from face to interior point
    const toInterior = interior.clone().sub(this.vertices[face.indices[0]]);

    // If dot product is positive, normal points toward interior (should be flipped)
    return face.normal.dotProduct(toInterior) < 0;
  }

  /**
   * Distance from point to face plane (signed)
   */
  private distanceToFace(pointIdx: number, face: Face): number {
    const point = this.vertices[pointIdx];
    const facePoint = this.vertices[face.indices[0]];
    return face.normal.dotProduct(point.clone().sub(facePoint));
  }

  /**
   * Merge coplanar adjacent faces
   */
  private mergeCoplanarFaces(epsilon: number = 1e-6): void {
    let changed = true;

    while (changed) {
      changed = false;

      for (let i = 0; i < this.faces.length && !changed; i++) {
        for (let j = i + 1; j < this.faces.length && !changed; j++) {
          if (
            this.areFacesCoplanar(this.faces[i], this.faces[j], epsilon) &&
            this.facesShareEdge(this.faces[i], this.faces[j])
          ) {
            const merged = this.mergeFaces(this.faces[i], this.faces[j]);
            if (merged) {
              this.faces.splice(j, 1);
              this.faces.splice(i, 1);
              this.faces.push(merged);
              changed = true;
            }
          }
        }
      }
    }
  }

  /**
   * Check if two faces are coplanar
   */
  private areFacesCoplanar(face1: Face, face2: Face, epsilon: number): boolean {
    // Check normals are parallel
    const dot = Math.abs(face1.normal.dotProduct(face2.normal));
    if (Math.abs(dot - 1) > epsilon) return false;

    // Check distance between planes is zero
    const point1 = this.vertices[face1.indices[0]];
    const point2 = this.vertices[face2.indices[0]];
    const vec = point2.clone().sub(point1);
    const dist = Math.abs(face1.normal.dotProduct(vec));

    return dist < epsilon;
  }

  /**
   * Check if two faces share an edge
   */
  private facesShareEdge(face1: Face, face2: Face): boolean {
    const set1 = new Set(face1.indices);
    let sharedCount = 0;

    for (const idx of face2.indices) {
      if (set1.has(idx)) sharedCount++;
    }

    return sharedCount >= 2; // Share at least an edge
  }

  /**
   * Merge two adjacent faces into one polygon
   */
  private mergeFaces(face1: Face, face2: Face): Face | null {
    const allVertices = [...new Set([...face1.indices, ...face2.indices])];

    if (allVertices.length < 3) return null;

    // Simple convex polygon merge - for complex cases, use polygon union algorithm
    const mergedIndices = this.orderVerticesConvex(allVertices);

    if (mergedIndices.length < 3) return null;

    return {
      indices: mergedIndices,
      normal: face1.normal.clone(),
    };
  }

  /**
   * Order vertices to form a convex polygon around their centroid
   */
  private orderVerticesConvex(indices: number[]): number[] {
    if (indices.length <= 3) return indices;

    const centroid = new Vector3(0, 0, 0);
    for (const idx of indices) {
      centroid.add(this.vertices[idx]);
    }
    centroid.scale(1 / indices.length);

    // Project vertices to 2D plane and sort by angle
    const normal = this.computeFaceNormal([indices[0], indices[1], indices[2]]);
    const basisX = this.vertices[indices[1]]
      .clone()
      .sub(this.vertices[indices[0]])
      .normalize();
    const basisY = normal.crossProduct(basisX).normalize();

    const points2D = indices.map((idx) => {
      const vec = this.vertices[idx].clone().sub(centroid);
      return {
        idx,
        x: vec.dotProduct(basisX),
        y: vec.dotProduct(basisY),
        angle: Math.atan2(vec.dotProduct(basisY), vec.dotProduct(basisX)),
      };
    });

    points2D.sort((a, b) => a.angle - b.angle);
    return points2D.map((p) => p.idx);
  }

  /**
   * Get the final faces (already merged)
   */
  public getFaces(): Face[] {
    return this.faces;
  }

  /**
   * Get vertices
   */
  public getVertices(): Vector3[] {
    return this.vertices;
  }
}
