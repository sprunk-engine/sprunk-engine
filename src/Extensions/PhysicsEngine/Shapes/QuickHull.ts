import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face.ts";

/**
 * Base class for QuickHull algorithms
 */
export abstract class QuickHull {
  protected vertices: Vector3[];
  protected faces: Face[];

  /**
   * Creates a new QuickHull instance
   * @param vertices - Array of Vector3 points to compute convex hull from
   */
  constructor(vertices: Vector3[]) {
    this.vertices = vertices;
    this.faces = [];
  }

  /**
   * Build the convex hull
   * @abstract
   * @throws Error if points are degenerate
   */
  public abstract build(): void;

  /**
   * Compute centroid of all points
   * @returns Vector3 representing the centroid of all vertices
   */
  protected computeCentroid(): Vector3 {
    const centroid = new Vector3(0, 0, 0);
    for (const vertex of this.vertices) {
      centroid.add(vertex);
    }
    return centroid.scale(1 / this.vertices.length);
  }

  /**
   * Compute center of a face
   * @param indices - Array of vertex indices forming the face
   * @returns Vector3 representing the center of the face
   */
  protected computeFaceCenter(indices: number[]): Vector3 {
    const center = new Vector3(0, 0, 0);
    for (const idx of indices) {
      center.add(this.vertices[idx]);
    }
    return center.scale(1 / indices.length);
  }

  /**
   * Check if two faces share an edge
   * @param face1 - First face to check
   * @param face2 - Second face to check
   * @returns True if faces share at least 2 vertices (an edge)
   */
  protected facesShareEdge(face1: Face, face2: Face): boolean {
    const set1 = new Set(face1.indices);
    let sharedCount = 0;

    for (const idx of face2.indices) {
      if (set1.has(idx)) sharedCount++;
    }

    return sharedCount >= 2;
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

  /**
   * Get edges of a face as [start, end] pairs
   * @param face - The face to extract edges from
   * @returns Array of edges as [startIndex, endIndex] pairs
   */
  protected getFaceEdges(face: Face): [number, number][] {
    const edges: [number, number][] = [];
    const n = face.indices.length;

    for (let i = 0; i < n; i++) {
      edges.push([face.indices[i], face.indices[(i + 1) % n]]);
    }

    return edges;
  }

  /**
   * Find candidate points for initial hull
   * @returns Array of vertex indices that are good candidates
   */
  protected findCandidatePoints(): number[] {
    const candidates = new Set<number>();

    // Add min/max for each axis
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
    if (candidates.size < this.getMinPoints()) {
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
   * Get minimum number of points required for initial hull
   * @abstract
   * @returns Minimum number of points required
   */
  protected abstract getMinPoints(): number;
}
