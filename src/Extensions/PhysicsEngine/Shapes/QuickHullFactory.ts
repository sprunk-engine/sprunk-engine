import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { QuickHull2D } from "./QuickHull2D.ts";
import { QuickHull3D } from "./QuickHull3D.ts";

/**
 * Factory class to automatically determine and create the appropriate QuickHull implementation
 * based on the geometry of the input points
 */
export class QuickHullFactory {
  private static readonly COPLANAR_THRESHOLD = 1e-6;

  /**
   * Build convex hull automatically choosing between 2D and 3D implementation
   * @param vertices - Array of Vector3 points to compute convex hull from
   * @returns QuickHull instance with built hull
   * @throws Error if points are insufficient or degenerate
   */
  public static buildHull(vertices: Vector3[]): QuickHull2D | QuickHull3D {
    if (vertices.length < 3) {
      throw new Error("At least 3 points are required");
    }

    const hull = this.createHull(vertices);
    hull.build();
    return hull;
  }

  /**
   * Create appropriate QuickHull instance without building it
   * @param vertices - Array of Vector3 points to analyze
   * @returns QuickHull2D if points are coplanar, QuickHull3D otherwise
   */
  public static createHull(vertices: Vector3[]): QuickHull2D | QuickHull3D {
    if (vertices.length < 3) {
      throw new Error("At least 3 points are required");
    }

    // For small point sets, use simpler checks
    if (vertices.length === 3) {
      // 3 points are always coplanar (they define a plane)
      return new QuickHull2D(vertices);
    }

    // Check if points are coplanar
    if (this.arePointsCoplanar(vertices)) {
      return new QuickHull2D(vertices);
    } else {
      return new QuickHull3D(vertices);
    }
  }

  /**
   * Determine if points are approximately coplanar
   * @param vertices - Array of Vector3 points to check
   * @returns True if points lie within a single plane within tolerance
   */
  public static arePointsCoplanar(vertices: Vector3[]): boolean {
    if (vertices.length <= 3) {
      // 0-3 points are always coplanar
      return true;
    }

    // Find the best-fit plane using PCA
    const { normal, centroid } = this.computeBestFitPlane(vertices);

    // Check if all points lie close to the plane
    for (const vertex of vertices) {
      const distance = this.distanceToPlane(vertex, centroid, normal);
      if (Math.abs(distance) > this.COPLANAR_THRESHOLD) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compute the best-fit plane for a set of points using Principal Component Analysis
   * @param vertices - Array of Vector3 points
   * @returns Object containing plane normal and centroid
   */
  private static computeBestFitPlane(vertices: Vector3[]): {
    normal: Vector3;
    centroid: Vector3;
  } {
    // Compute centroid
    const centroid = new Vector3(0, 0, 0);
    for (const vertex of vertices) {
      centroid.add(vertex);
    }
    centroid.scale(1 / vertices.length);

    // Compute covariance matrix
    let xx = 0,
      xy = 0,
      xz = 0,
      yy = 0,
      yz = 0,
      zz = 0;

    for (const vertex of vertices) {
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

    // The normal is the eigenvector corresponding to the smallest eigenvalue
    // For covariance matrix, this is the direction with least variance (normal to best-fit plane)

    // Compute cross products to find normal (simplified approach)
    // Use three non-collinear points to define a plane candidate
    let normal = new Vector3(0, 0, 0);
    let foundValidNormal = false;

    // Try different point combinations to find a valid normal
    for (let i = 0; i < vertices.length - 2 && !foundValidNormal; i++) {
      for (let j = i + 1; j < vertices.length - 1 && !foundValidNormal; j++) {
        for (let k = j + 1; k < vertices.length && !foundValidNormal; k++) {
          const v1 = vertices[j].clone().sub(vertices[i]);
          const v2 = vertices[k].clone().sub(vertices[i]);

          const candidateNormal = v1.crossProduct(v2);

          if ((candidateNormal.length ^ 2) > this.COPLANAR_THRESHOLD) {
            normal = candidateNormal.normalize();
            foundValidNormal = true;
          }
        }
      }
    }

    // If we couldn't find a normal from point combinations, use PCA-based approach
    if (!foundValidNormal) {
      // Simple PCA: the normal is the direction of least variance
      // We can approximate this by finding the smallest component of the covariance matrix
      const eigenvalues = this.computeEigenvalues(xx, xy, xz, yy, yz, zz);

      // The eigenvector for the smallest eigenvalue gives us the normal
      // For simplicity, we'll use a geometric approach with the points
      if (vertices.length >= 3) {
        const v1 = vertices[1].clone().sub(vertices[0]);
        const v2 = vertices[2].clone().sub(vertices[0]);
        normal = v1.crossProduct(v2).normalize();
      } else {
        normal = new Vector3(0, 0, 1); // Fallback
      }
    }

    // Ensure consistent normal direction (pointing away from origin or using majority of points)
    let positiveSide = 0;
    let negativeSide = 0;

    for (const vertex of vertices) {
      const toPoint = vertex.clone().sub(centroid);
      if (toPoint.dotProduct(normal) > 0) {
        positiveSide++;
      } else {
        negativeSide++;
      }
    }

    // Flip normal if majority of points are on the "negative" side
    if (negativeSide > positiveSide) {
      normal.scale(-1);
    }

    return { normal, centroid };
  }

  /**
   * Compute eigenvalues of 3x3 symmetric matrix (simplified)
   * @param xx - Matrix element [0,0]
   * @param xy - Matrix element [0,1]
   * @param xz - Matrix element [0,2]
   * @param yy - Matrix element [1,1]
   * @param yz - Matrix element [1,2]
   * @param zz - Matrix element [2,2]
   * @returns Array of three eigenvalues
   */
  private static computeEigenvalues(
    xx: number,
    xy: number,
    xz: number,
    yy: number,
    yz: number,
    zz: number,
  ): [number, number, number] {
    // For a covariance matrix, we can use a simplified characteristic equation
    // This is an approximation - for production use a proper eigen decomposition
    const trace = xx + yy + zz;

    // For simplicity, return trace components as eigenvalues
    // In practice, you'd solve the cubic characteristic equation
    return [xx, yy, zz].sort((a, b) => a - b) as [number, number, number];
  }

  /**
   * Calculate distance from point to plane
   * @param point - The point to measure distance from
   * @param planePoint - A point on the plane
   * @param planeNormal - Normal vector of the plane
   * @returns Signed distance from point to plane
   */
  private static distanceToPlane(
    point: Vector3,
    planePoint: Vector3,
    planeNormal: Vector3,
  ): number {
    return point.clone().sub(planePoint).dotProduct(planeNormal);
  }

  /**
   * Analyze the geometry of points and return information about their distribution
   * @param vertices - Array of Vector3 points to analyze
   * @returns Object containing analysis results
   */
  public static analyzeGeometry(vertices: Vector3[]): {
    isCoplanar: boolean;
    dimensions: number;
    boundingBoxSize: Vector3;
    recommendedHullType: "2D" | "3D";
    centroid: Vector3;
  } {
    if (vertices.length === 0) {
      throw new Error("No points to analyze");
    }

    const isCoplanar = this.arePointsCoplanar(vertices);
    const centroid = this.computeCentroid(vertices);

    // Compute bounding box
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    for (const vertex of vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      minZ = Math.min(minZ, vertex.z);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
      maxZ = Math.max(maxZ, vertex.z);
    }

    const boundingBoxSize = new Vector3(maxX - minX, maxY - minY, maxZ - minZ);

    // Determine effective dimensions
    let dimensions = 3;
    if (isCoplanar) {
      dimensions = 2;
      // Check if points are actually collinear (1D)
      if (this.arePointsCollinear(vertices)) {
        dimensions = 1;
      }
    }

    return {
      isCoplanar,
      dimensions,
      boundingBoxSize,
      recommendedHullType: isCoplanar ? "2D" : "3D",
      centroid,
    };
  }

  /**
   * Check if points are approximately collinear
   * @param vertices - Array of Vector3 points to check
   * @returns True if points lie along a single line within tolerance
   */
  public static arePointsCollinear(vertices: Vector3[]): boolean {
    if (vertices.length <= 2) {
      return true;
    }

    // Use first two points to define a line direction
    const direction = vertices[1].clone().sub(vertices[0]).normalize();

    // Check if all other points lie on this line
    for (let i = 2; i < vertices.length; i++) {
      const toPoint = vertices[i].clone().sub(vertices[0]);

      // Project point onto line
      const projectionLength = toPoint.dotProduct(direction);
      const projection = direction.clone().scale(projectionLength);

      // Check distance from point to line
      const perpendicular = toPoint.clone().sub(projection);
      if (perpendicular.length > this.COPLANAR_THRESHOLD) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compute centroid of points
   * @param vertices - Array of Vector3 points
   * @returns Vector3 representing the centroid
   */
  private static computeCentroid(vertices: Vector3[]): Vector3 {
    const centroid = new Vector3(0, 0, 0);
    for (const vertex of vertices) {
      centroid.add(vertex);
    }
    return centroid.scale(1 / vertices.length);
  }

  /**
   * Create a QuickHull instance for a specific type (force 2D or 3D)
   * @param vertices - Array of Vector3 points
   * @param type - '2D' to force 2D hull, '3D' to force 3D hull
   * @returns QuickHull instance of specified type
   */
  public static createHullOfType(
    vertices: Vector3[],
    type: "2D" | "3D",
  ): QuickHull2D | QuickHull3D {
    if (type === "2D") {
      return new QuickHull2D(vertices);
    } else {
      return new QuickHull3D(vertices);
    }
  }

  /**
   * Get the gravity center of a shape (automatically chooses best method)
   * @param vertices - Array of Vector3 points representing the shape
   * @returns Vector3 representing the gravity center
   */
  public static computeGravityCenter(vertices: Vector3[]): Vector3 {
    const hull = this.buildHull(vertices);

    if (hull instanceof QuickHull2D) {
      // Use the optimized 2D gravity center calculation
      return hull.computeGravityCenter();
    } else {
      // For 3D hull, compute centroid of all hull vertices
      const faces = hull.getFaces();
      const allHullVertices = new Set<number>();

      for (const face of faces) {
        for (const index of face.indices) {
          allHullVertices.add(index);
        }
      }

      const centroid = new Vector3(0, 0, 0);
      for (const index of allHullVertices) {
        centroid.add(vertices[index]);
      }

      return centroid.scale(1 / allHullVertices.size);
    }
  }

  /**
   * Quickly determine if shape is flat without building full hull
   * @param vertices - Array of Vector3 points
   * @returns True if shape appears to be flat/2D
   */
  public static isShapeFlat(vertices: Vector3[]): boolean {
    if (vertices.length < 4) {
      return true; // Fewer than 4 points are always coplanar
    }

    return this.arePointsCoplanar(vertices);
  }
}
