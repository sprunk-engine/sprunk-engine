import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face.ts";

export class QuickHull3D {
  private vertices: Vector3[];
  private faces: Face[];

  /**
   * Creates a new QuickHull3D instance for building convex hulls from 3D points
   * @param vertices - Array of Vector3 points to compute convex hull from
   * @throws Error if fewer than 4 points are provided
   */
  constructor(vertices: Vector3[]) {
    if (vertices.length < 4) throw new Error("At least 4 points are required");
    this.vertices = vertices;
    this.faces = [];
  }

  /**
   * Build convex hull using a robust incremental algorithm
   * @throws Error if points are degenerate (coplanar or collinear)
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
   * Find initial tetrahedron that contains all points - IMPROVED VERSION
   * @returns Array of 4 vertex indices forming a valid tetrahedron, or null if none found
   */
  private findInitialSimplex(): number[] | null {
    // Get more candidate points to ensure we find a valid tetrahedron
    const candidates = this.findCandidatePoints();

    // Try all combinations systematically
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        for (let k = j + 1; k < candidates.length; k++) {
          for (let l = k + 1; l < candidates.length; l++) {
            const tetra = [
              candidates[i],
              candidates[j],
              candidates[k],
              candidates[l],
            ];
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
   * Find candidate points for initial simplex - MORE ROBUST VERSION
   * @returns Array of vertex indices that are good candidates for forming the initial tetrahedron
   */
  private findCandidatePoints(): number[] {
    const candidates = new Set<number>();

    // Add min/max for each axis (original logic)
    for (const axis of ["x", "y", "z"] as const) {
      let minIdx = 0;
      let maxIdx = 0;

      for (let i = 1; i < this.vertices.length; i++) {
        if (this.vertices[i][axis] < this.vertices[minIdx][axis]) minIdx = i;
        if (this.vertices[i][axis] > this.vertices[maxIdx][axis]) maxIdx = i;
      }

      candidates.add(minIdx);
      candidates.add(maxIdx);
    }

    // If we don't have enough unique points, add more from the vertices
    if (candidates.size < 4) {
      // Add points that are farthest from the centroid
      const centroid = this.computeCentroid();
      const distances = this.vertices.map((v, i) => ({
        index: i,
        distance: v.clone().sub(centroid).length ^ 2,
      }));

      distances.sort((a, b) => b.distance - a.distance);

      for (const item of distances) {
        candidates.add(item.index);
        if (candidates.size >= Math.min(8, this.vertices.length)) break;
      }
    }

    return Array.from(candidates);
  }

  /**
   * Compute centroid of all points
   * @returns Vector3 representing the centroid of all vertices
   */
  private computeCentroid(): Vector3 {
    const centroid = new Vector3(0, 0, 0);
    for (const vertex of this.vertices) {
      centroid.add(vertex);
    }
    return centroid.scale(1 / this.vertices.length);
  }

  /**
   * Check if tetrahedron is valid (non-degenerate) - MORE ROBUST VERSION
   * @param tetra - Array of 4 vertex indices to check
   * @returns True if tetrahedron has sufficient volume (non-degenerate)
   */
  private isValidTetrahedron(tetra: number[]): boolean {
    const [a, b, c, d] = tetra;
    const v0 = this.vertices[a];
    const v1 = this.vertices[b];
    const v2 = this.vertices[c];
    const v3 = this.vertices[d];

    const ab = v1.clone().sub(v0);
    const ac = v2.clone().sub(v0);
    const ad = v3.clone().sub(v0);

    const volume = Math.abs(ab.dotProduct(ac.crossProduct(ad)));

    // Use a relative tolerance based on the size of the vectors
    const size = Math.max(ab.length, ac.length, ad.length);
    const relativeTolerance = size * 1e-10;

    return volume > Math.max(1e-12, relativeTolerance);
  }

  /**
   * Create initial faces from tetrahedron - IMPROVED ORIENTATION
   * @param tetra - Array of 4 vertex indices forming the initial tetrahedron
   */
  private createInitialFaces(tetra: number[]): void {
    const faces = [
      { indices: [tetra[0], tetra[1], tetra[2]], normal: new Vector3(0, 0, 0) },
      { indices: [tetra[0], tetra[3], tetra[1]], normal: new Vector3(0, 0, 0) },
      { indices: [tetra[0], tetra[2], tetra[3]], normal: new Vector3(0, 0, 0) },
      { indices: [tetra[1], tetra[3], tetra[2]], normal: new Vector3(0, 0, 0) },
    ];

    // Compute normals and ensure consistent winding
    const centroid = this.computeTetrahedronCentroid(tetra);

    for (const face of faces) {
      face.normal = this.computeFaceNormal(face.indices);

      // Ensure normal points outward using tetrahedron centroid
      const faceCenter = this.computeFaceCenter(face.indices);
      const toCentroid = centroid.clone().sub(faceCenter);

      if (face.normal.dotProduct(toCentroid) > 0) {
        // Normal points inward, reverse winding
        face.indices.reverse();
        face.normal = this.computeFaceNormal(face.indices);
      }
    }

    this.faces = faces;
  }

  /**
   * Compute centroid of tetrahedron
   * @param tetra - Array of 4 vertex indices
   * @returns Vector3 representing the centroid of the tetrahedron
   */
  private computeTetrahedronCentroid(tetra: number[]): Vector3 {
    const centroid = new Vector3(0, 0, 0);
    for (const idx of tetra) {
      centroid.add(this.vertices[idx]);
    }
    return centroid.scale(1 / tetra.length);
  }

  /**
   * Compute center of a face
   * @param indices - Array of vertex indices forming the face
   * @returns Vector3 representing the center of the face
   */
  private computeFaceCenter(indices: number[]): Vector3 {
    const center = new Vector3(0, 0, 0);
    for (const idx of indices) {
      center.add(this.vertices[idx]);
    }
    return center.scale(1 / indices.length);
  }

  /**
   * Add remaining points to the convex hull incrementally
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
   * @param pointIdx - Index of the vertex to add to the hull
   */
  private addPointToHull(pointIdx: number): void {
    const visibleFaces: number[] = [];

    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      const dist = this.distanceToFace(pointIdx, face);
      if (dist > 1e-12) {
        visibleFaces.push(i);
      }
    }

    if (visibleFaces.length === 0) return;

    const horizon = this.findHorizonEdges(visibleFaces);
    this.faces = this.faces.filter((_, i) => !visibleFaces.includes(i));

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
   * @param visibleFaces - Array of indices of faces visible from the current point
   * @returns Array of edges forming the horizon
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
   * @param face - The face to extract edges from
   * @returns Array of edges as [startIndex, endIndex] pairs
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
   * @param edge - The edge to find opposite face for
   * @param excludeFace - Index of face to exclude from search
   * @returns Index of opposite face, or -1 if not found
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
   * @param indices - Array of 3 vertex indices forming the face
   * @returns Vector3 representing the normalized face normal
   */
  private computeFaceNormal(indices: number[]): Vector3 {
    const v0 = this.vertices[indices[0]];
    const v1 = this.vertices[indices[1]];
    const v2 = this.vertices[indices[2]];

    return v1.clone().sub(v0).crossProduct(v2.clone().sub(v0)).normalize();
  }

  /**
   * Distance from point to face plane (signed)
   * @param pointIdx - Index of the point to measure distance from
   * @param face - The face to measure distance to
   * @returns Signed distance from point to face plane
   */
  private distanceToFace(pointIdx: number, face: Face): number {
    const point = this.vertices[pointIdx];
    const facePoint = this.vertices[face.indices[0]];
    return face.normal.dotProduct(point.clone().sub(facePoint));
  }

  /**
   * Merge coplanar adjacent faces
   * @param epsilon - Tolerance for coplanarity check (default: 1e-6)
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
   * @param face1 - First face to check
   * @param face2 - Second face to check
   * @param epsilon - Tolerance for coplanarity check
   * @returns True if faces are coplanar within tolerance
   */
  private areFacesCoplanar(face1: Face, face2: Face, epsilon: number): boolean {
    const dot = Math.abs(face1.normal.dotProduct(face2.normal));
    if (Math.abs(dot - 1) > epsilon) return false;

    const point1 = this.vertices[face1.indices[0]];
    const point2 = this.vertices[face2.indices[0]];
    const vec = point2.clone().sub(point1);
    const dist = Math.abs(face1.normal.dotProduct(vec));

    return dist < epsilon;
  }

  /**
   * Check if two faces share an edge
   * @param face1 - First face to check
   * @param face2 - Second face to check
   * @returns True if faces share at least 2 vertices (an edge)
   */
  private facesShareEdge(face1: Face, face2: Face): boolean {
    const set1 = new Set(face1.indices);
    let sharedCount = 0;

    for (const idx of face2.indices) {
      if (set1.has(idx)) sharedCount++;
    }

    return sharedCount >= 2;
  }

  /**
   * Merge two adjacent faces into one polygon
   * @param face1 - First face to merge
   * @param face2 - Second face to merge
   * @returns Merged face or null if merge failed
   */
  private mergeFaces(face1: Face, face2: Face): Face | null {
    const allVertices = [...new Set([...face1.indices, ...face2.indices])];

    if (allVertices.length < 3) return null;

    const mergedIndices = this.orderVerticesConvex(allVertices);

    if (mergedIndices.length < 3) return null;

    return {
      indices: mergedIndices,
      normal: face1.normal.clone(),
    };
  }

  /**
   * Order vertices to form a convex polygon around their centroid
   * @param indices - Array of vertex indices to order
   * @returns Ordered array of vertex indices forming a convex polygon
   */
  private orderVerticesConvex(indices: number[]): number[] {
    if (indices.length <= 3) return indices;

    const centroid = new Vector3(0, 0, 0);
    for (const idx of indices) {
      centroid.add(this.vertices[idx]);
    }
    centroid.scale(1 / indices.length);

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
   * Get the final faces of the convex hull
   * @returns Array of Face objects representing the convex hull
   */
  public getFaces(): Face[] {
    return this.faces;
  }

  /**
   * Get the original vertices used to build the convex hull
   * @returns Array of Vector3 vertices
   */
  public getVertices(): Vector3[] {
    return this.vertices;
  }
}
