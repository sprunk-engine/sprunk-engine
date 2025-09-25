import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face.ts";

export class QuickHull3D {
  private vertices: Vector3[];
  public faces: number[][];

  constructor(vertices: Vector3[]) {
    if (vertices.length < 4) throw new Error("At least 4 points are required");
    this.vertices = vertices;
    this.faces = [];
  }

  /**
   * Build the convex hull and fill this.faces (triangles)
   */
  public build(): void {
    const tetra = this.initTetrahedron();
    this.faces = [
      [tetra[0], tetra[1], tetra[2]],
      [tetra[0], tetra[3], tetra[1]],
      [tetra[0], tetra[2], tetra[3]],
      [tetra[1], tetra[3], tetra[2]],
    ];

    let remaining = this.vertices
      .map((_, i) => i)
      .filter((i) => !tetra.includes(i));

    while (true) {
      const [faceIndex, farthest] = this.findFarthestPoint(remaining);
      if (farthest === null) break;

      const visibleFaces = this.collectVisibleFaces(farthest);
      const horizon = this.computeHorizon(visibleFaces, farthest);

      this.removeFaces(visibleFaces);
      this.addNewFaces(horizon, farthest);

      remaining = remaining.filter((i) => i !== farthest);
    }
  }

  /**
   * Initialize the tetrahedron from the point set
   * @return Indices of the tetrahedron vertices
   * @throws Error if points are degenerate
   **/
  private initTetrahedron(): number[] {
    const a = 0;
    let b = -1,
      c = -1,
      d = -1;

    for (let i = 1; i < this.vertices.length; i++) {
      if (this.vertices[i].clone().sub(this.vertices[a]).length > 1e-9) {
        b = i;
        break;
      }
    }
    if (b === -1) throw new Error("All points are coincident");

    for (let i = b + 1; i < this.vertices.length; i++) {
      const ab = this.vertices[b].clone().sub(this.vertices[a]);
      const ac = this.vertices[i].clone().sub(this.vertices[a]);
      if (ab.crossProduct(ac).length > 1e-9) {
        c = i;
        break;
      }
    }
    if (c === -1) throw new Error("All points are collinear");

    for (let i = c + 1; i < this.vertices.length; i++) {
      const ab = this.vertices[b].clone().sub(this.vertices[a]);
      const ac = this.vertices[c].clone().sub(this.vertices[a]);
      const ad = this.vertices[i].clone().sub(this.vertices[a]);
      const vol = ab.dotProduct(ac.crossProduct(ad));
      if (Math.abs(vol) > 1e-9) {
        d = i;
        break;
      }
    }
    if (d === -1) throw new Error("All points are coplanar");

    return [a, b, c, d];
  }

  /**
   * Find the farthest point from a set of candidates with respect to the current convex hull
   * @param candidates Array of candidate point indices
   * @return Tuple of the face index and the farthest point index
   **/
  private findFarthestPoint(
    candidates: number[],
  ): [number | null, number | null] {
    let maxDist = 0;
    let farthest: number | null = null;
    let faceIndex: number | null = null;

    for (let fi = 0; fi < this.faces.length; fi++) {
      const [i1, i2, i3] = this.faces[fi];
      const normal = this.computeNormal(i1, i2, i3);
      for (const idx of candidates) {
        const dist = normal.dotProduct(
          this.vertices[idx].clone().sub(this.vertices[i1]),
        );
        if (dist > maxDist + 1e-9) {
          maxDist = dist;
          farthest = idx;
          faceIndex = fi;
        }
      }
    }
    return [faceIndex, farthest];
  }

  /**
   * Collect all visible faces from a point
   * @param pointIndex Index of the point
   * @return Array of face indices that are visible from the point
   **/
  private collectVisibleFaces(pointIndex: number): number[] {
    const visible: number[] = [];
    for (let fi = 0; fi < this.faces.length; fi++) {
      const [i1, i2, i3] = this.faces[fi];
      const normal = this.computeNormal(i1, i2, i3);
      const dist = normal.dotProduct(
        this.vertices[pointIndex].clone().sub(this.vertices[i1]),
      );
      if (dist > 1e-9) visible.push(fi);
    }
    return visible;
  }

  /**
   * Compute the horizon edges from the visible faces
   * @param visible Array of visible face indices
   * @param pointIndex Index of the point
   * @return Array of horizon edges
   **/
  private computeHorizon(
    visible: number[],
    pointIndex: number,
  ): [number, number][] {
    const edges: [number, number][] = [];
    const faceSet = new Set(visible);

    for (const fi of visible) {
      const [a, b, c] = this.faces[fi];
      const triEdges: [number, number][] = [
        [a, b],
        [b, c],
        [c, a],
      ];

      for (const [u, v] of triEdges) {
        const opposite = this.findOppositeFace(u, v, fi);
        if (opposite === -1 || !faceSet.has(opposite)) edges.push([u, v]);
      }
    }
    return edges;
  }

  /**
   * Remove faces by their indices
   * @param indices Array of face indices to remove
   **/
  private removeFaces(indices: number[]): void {
    this.faces = this.faces.filter((_, fi) => !indices.includes(fi));
  }

  /**
   * Add new faces from the horizon edges to a point
   * @param horizon Array of horizon edges
   * @param pointIndex Index of the point
   **/
  private addNewFaces(horizon: [number, number][], pointIndex: number): void {
    for (const [u, v] of horizon) this.faces.push([u, v, pointIndex]);
  }

  /**
   * Find the face opposite to the edge (u, v) excluding a specific face
   * @param u First vertex of the edge
   * @param v Second vertex of the edge
   * @param exclude Face index to exclude from the search
   * @return Index of the opposite face or -1 if not found
   **/
  private findOppositeFace(u: number, v: number, exclude: number): number {
    for (let fi = 0; fi < this.faces.length; fi++) {
      if (fi === exclude) continue;
      const face = this.faces[fi];
      if (face.includes(u) && face.includes(v)) return fi;
    }
    return -1;
  }

  /**
   * Compute the normal of a face defined by three vertex indices
   * @param i1 Index of the first vertex
   * @param i2 Index of the second vertex
   * @param i3 Index of the third vertex
   * @return Normal vector of the face
   **/
  private computeNormal(i1: number, i2: number, i3: number): Vector3 {
    const v1 = this.vertices[i1];
    const v2 = this.vertices[i2];
    const v3 = this.vertices[i3];
    return v2.clone().sub(v1).crossProduct(v3.clone().sub(v1)).normalize();
  }

  /**
   * Returns merged coplanar faces without modifying this.faces
   */
  public getMergedCoplanarFaces(epsilon: number = 1e-6): Face[] {
    type TriFace = { indices: number[]; normal: Vector3 };

    const triFaces: TriFace[] = this.faces.map((f) => ({
      indices: f,
      normal: this.computeNormal(f[0], f[1], f[2]),
    }));

    const merged: Face[] = [];
    const used = new Set<number>();

    for (let i = 0; i < triFaces.length; i++) {
      if (used.has(i)) continue;

      const group: number[][] = [triFaces[i].indices.slice()];
      const normal = triFaces[i].normal.clone();
      used.add(i);

      for (let j = i + 1; j < triFaces.length; j++) {
        if (used.has(j)) continue;
        const dot = triFaces[i].normal.dotProduct(triFaces[j].normal);
        if (Math.abs(dot - 1) < epsilon) {
          if (this.facesShareEdge(triFaces[i].indices, triFaces[j].indices)) {
            group.push(triFaces[j].indices.slice());
            used.add(j);
          }
        }
      }

      const polygonIndices = this.mergeTrianglesIntoPolygon(group);

      // Wrap as Face
      merged.push({ indices: polygonIndices, normal });
    }

    return merged;
  }

  /**
   * Check if two faces share an edge
   * @param a First face (array of vertex indices)
   * @param b Second face (array of vertex indices)
   * @return True if they share an edge, false otherwise
   **/
  private facesShareEdge(a: number[], b: number[]): boolean {
    let shared = 0;
    for (const v of a) if (b.includes(v)) shared++;
    return shared >= 2;
  }

  /**
   * Merge triangles into a single polygon by walking around the border edges
   * @param triangles Array of triangles (each triangle is an array of 3 vertex indices)
   * @return Array of vertex indices forming the merged polygon
   */
  private mergeTrianglesIntoPolygon(triangles: number[][]): number[] {
    const edges: Map<string, [number, number]> = new Map();
    const count: Map<string, number> = new Map();

    const key = (u: number, v: number) => `${Math.min(u, v)}-${Math.max(u, v)}`;

    for (const tri of triangles) {
      for (let i = 0; i < 3; i++) {
        const u = tri[i];
        const v = tri[(i + 1) % 3];
        const k = key(u, v);
        count.set(k, (count.get(k) || 0) + 1);
        edges.set(k, [u, v]);
      }
    }

    // Border edges appear only once
    const borderEdges = Array.from(edges.values()).filter(
      (e) => count.get(key(e[0], e[1])) === 1,
    );

    if (borderEdges.length === 0) return triangles[0];

    // Build adjacency map
    const adj = new Map<number, Set<number>>();
    for (const [u, v] of borderEdges) {
      if (!adj.has(u)) adj.set(u, new Set());
      if (!adj.has(v)) adj.set(v, new Set());
      adj.get(u)!.add(v);
      adj.get(v)!.add(u);
    }

    // Walk around edges to form polygon
    const polygon: number[] = [];
    let start = borderEdges[0][0];
    polygon.push(start);
    let prev = -1;
    let current = start;

    while (true) {
      const neighbors = Array.from(adj.get(current)!);
      let next = neighbors.find((n) => n !== prev);
      if (next === undefined || next === start) break;
      polygon.push(next);
      prev = current;
      current = next;
    }

    return polygon;
  }
}
