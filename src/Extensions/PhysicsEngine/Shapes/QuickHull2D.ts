import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { QuickHull } from "@extensions/PhysicsEngine/Shapes/QuickHull";

/**
 * 2D QuickHull algorithm for flat shapes using 3D vectors
 * Designed to find convex hull of points that lie primarily in a plane
 */
export class QuickHull2D extends QuickHull {
  private epsilon: number = 1e-12;

  /**
   * Creates a new QuickHull2D instance for building 2D convex hulls from 3D points
   * @param vertices - Array of Vector3 points to compute convex hull from
   * @throws Error if fewer than 3 points are provided
   */
  constructor(vertices: Vector3[]) {
    if (vertices.length < 3)
      throw new Error("At least 3 points are required for 2D hull");
    super(vertices);
  }

  /**
   * Build 2D convex hull using Andrew's monotone chain algorithm
   * Projects points to 2D plane and computes convex hull
   * @throws Error if points are degenerate (collinear)
   */
  public build(): void {
    this.faces = [];

    // Project 3D points to 2D and find convex hull
    const hull2D = this.compute2DHull();

    // Convert 2D hull back to 3D faces (single face with all hull points)
    if (hull2D.length >= 3) {
      this.faces = [
        {
          indices: hull2D,
          normal: this.computeFaceNormal(hull2D),
        },
      ];
    } else {
      throw new Error("Points are degenerate (collinear)");
    }
  }

  /**
   * Compute 2D convex hull using Andrew's monotone chain algorithm
   * @returns Array of vertex indices forming the convex hull in counter-clockwise order
   */
  private compute2DHull(): number[] {
    // Find the best-fitting plane for the points
    const normal = this.computeBestFitPlaneNormal();

    // Project points to 2D plane
    const projectedPoints = this.projectTo2D(normal);

    // Sort points by x, then y
    const sortedIndices = projectedPoints
      .map((point, index) => ({ point, index }))
      .sort((a, b) => {
        const dx = a.point.x - b.point.x;
        return dx !== 0 ? dx : a.point.y - b.point.y;
      })
      .map((item) => item.index);

    // Build lower hull
    const lower: number[] = [];
    for (const idx of sortedIndices) {
      while (
        lower.length >= 2 &&
        this.crossProduct2D(
          projectedPoints[lower[lower.length - 2]],
          projectedPoints[lower[lower.length - 1]],
          projectedPoints[idx],
        ) <= 0
      ) {
        lower.pop();
      }
      lower.push(idx);
    }

    // Build upper hull
    const upper: number[] = [];
    for (let i = sortedIndices.length - 1; i >= 0; i--) {
      const idx = sortedIndices[i];
      while (
        upper.length >= 2 &&
        this.crossProduct2D(
          projectedPoints[upper[upper.length - 2]],
          projectedPoints[upper[upper.length - 1]],
          projectedPoints[idx],
        ) <= 0
      ) {
        upper.pop();
      }
      upper.push(idx);
    }

    // Remove duplicates (last point of each hull is first point of the other)
    lower.pop();
    upper.pop();

    return lower.concat(upper);
  }

  /**
   * Compute the best-fit plane normal for the points using PCA
   * @returns Vector3 representing the normal of the best-fit plane
   */
  private computeBestFitPlaneNormal(): Vector3 {
    const centroid = this.computeCentroid();

    // Compute covariance matrix
    let xx = 0,
      xy = 0,
      xz = 0,
      yy = 0,
      yz = 0,
      zz = 0;

    for (const vertex of this.vertices) {
      const dx = vertex.x - centroid.x;
      const dy = vertex.y - centroid.y;
      const dz = vertex.z - centroid.z;

      xx += dx * dx;
      xy += dx * dy;
      xz += dx * dz;
      yy += dy * dy;
      yz += dy * dz;
      zz += dz * dz;
    }

    // Find eigenvector corresponding to smallest eigenvalue (normal direction)
    // Using cross product method for 3x3 matrix
    const A = xx,
      B = xy,
      C = xz,
      D = yy,
      E = yz,
      F = zz;

    // Compute normal using cross product of first two principal components
    const normal = new Vector3(
      B * E - C * D,
      C * B - A * E,
      A * D - B * B,
    ).normalize();

    return normal;
  }

  /**
   * Project 3D points to 2D plane defined by normal
   * @param normal - Normal vector of the projection plane
   * @returns Array of 2D points (stored as Vector3 with z=0)
   */
  private projectTo2D(normal: Vector3): Vector3[] {
    // Create orthonormal basis for the plane
    const basisX = this.findOrthogonalVector(normal).normalize();
    const basisY = normal.crossProduct(basisX).normalize();

    const centroid = this.computeCentroid();

    return this.vertices.map((vertex) => {
      const vec = vertex.clone().sub(centroid);
      return new Vector3(vec.dotProduct(basisX), vec.dotProduct(basisY), 0);
    });
  }

  /**
   * Find a vector orthogonal to the given vector
   * @param v - Input vector
   * @returns Vector orthogonal to input
   */
  private findOrthogonalVector(v: Vector3): Vector3 {
    // Find a vector not parallel to v
    if (Math.abs(v.x) > this.epsilon || Math.abs(v.y) > this.epsilon) {
      return new Vector3(-v.y, v.x, 0);
    } else {
      return new Vector3(0, -v.z, v.y);
    }
  }

  /**
   * Compute 2D cross product (OA x OB)
   * @param o - Origin point
   * @param a - First point
   * @param b - Second point
   * @returns Cross product value (positive if O->A->B is counter-clockwise)
   */
  private crossProduct2D(o: Vector3, a: Vector3, b: Vector3): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  /**
   * Compute face normal for the 2D hull
   * @param indices - Array of vertex indices forming the hull
   * @returns Normal vector pointing away from the centroid
   */
  private computeFaceNormal(indices: number[]): Vector3 {
    if (indices.length < 3) return new Vector3(0, 0, 1);

    const v0 = this.vertices[indices[0]];
    const v1 = this.vertices[indices[1]];
    const v2 = this.vertices[indices[2]];

    const normal = v1
      .clone()
      .sub(v0)
      .crossProduct(v2.clone().sub(v0))
      .normalize();

    // Ensure normal points in consistent direction (use centroid)
    const centroid = this.computeCentroid();
    const faceCenter = this.computeFaceCenter(indices);
    const toCentroid = centroid.clone().sub(faceCenter);

    if (normal.dotProduct(toCentroid) > 0) {
      normal.scale(-1);
    }

    return normal;
  }

  /**
   * Get minimum number of points required for 2D hull
   * @returns Minimum number of points required (3 for 2D)
   */
  protected getMinPoints(): number {
    return 3;
  }

  /**
   * Compute the gravity center (centroid) of the convex hull
   * This is particularly useful for flat shapes
   * @returns Vector3 representing the gravity center of the convex hull
   */
  public computeGravityCenter(): Vector3 {
    if (this.faces.length === 0) {
      this.build();
    }

    if (this.faces.length === 0 || this.faces[0].indices.length === 0) {
      return this.computeCentroid();
    }

    // For 2D hull, the gravity center is the centroid of the hull vertices
    const hullVertices = this.faces[0].indices;
    const center = new Vector3(0, 0, 0);

    for (const idx of hullVertices) {
      center.add(this.vertices[idx]);
    }

    return center.scale(1 / hullVertices.length);
  }

  /**
   * Compute the area of the convex hull
   * @returns Area of the convex hull
   */
  public computeArea(): number {
    if (this.faces.length === 0) {
      this.build();
    }

    if (this.faces.length === 0 || this.faces[0].indices.length < 3) {
      return 0;
    }

    const indices = this.faces[0].indices;
    let area = 0;

    // Use shoelace formula
    for (let i = 0; i < indices.length; i++) {
      const j = (i + 1) % indices.length;
      const vi = this.vertices[indices[i]];
      const vj = this.vertices[indices[j]];
      area += vi.x * vj.y - vj.x * vi.y;
    }

    return Math.abs(area) / 2;
  }
}
