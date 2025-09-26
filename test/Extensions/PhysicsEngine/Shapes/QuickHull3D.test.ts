import { describe, it, expect } from "vitest";
import { Vector3 } from "@core/MathStructures/Vector3";
import { QuickHull3D } from "@extensions/PhysicsEngine/Shapes/QuickHull3D.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face.ts";

describe("QuickHull3D", (): void => {
  /**
   * Tests if we find the correct faces of a box.
   */
  it("should find the correct faces of a box", () => {
    // Given
    const vertices: Vector3[] = [
      new Vector3(0, 0, 0),
      new Vector3(2, 0, 0),
      new Vector3(2, 2, 0),
      new Vector3(0, 2, 0),
      new Vector3(0, 0, 2),
      new Vector3(2, 0, 2),
      new Vector3(2, 2, 2),
      new Vector3(0, 2, 2),
    ];

    const hull = new QuickHull3D(vertices);
    hull.build();

    // When
    const faces = hull.getMergedCoplanarFaces();

    // Then
    expect(faces).toHaveLength(6);

    const facesIndexes: number[][] = [];
    faces.forEach((face: Face) => {
      facesIndexes.push(face.indices);
    });

    const expectedFaces = [
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [0, 4, 7, 3],
      [1, 0, 3, 2],
      [4, 5, 6, 7],
      [2, 3, 7, 6],
    ];

    expect(facesIndexes).toEqual(expect.arrayContaining(expectedFaces));
    expect(facesIndexes).toHaveLength(expectedFaces.length);
  });

  /**
   * Tests if we find the correct faces of a pyramid.
   */
  it("should find the correct faces of a pyramid", () => {
    // Given
    const vertices: Vector3[] = [
      new Vector3(0, 0, 0),
      new Vector3(4, 0, 0),
      new Vector3(3, 3, 0),
      new Vector3(1, 1, 4),
    ];

    const hull = new QuickHull3D(vertices);
    hull.build();

    // When
    const faces = hull.getMergedCoplanarFaces();

    // Then
    expect(faces).toHaveLength(4);

    const facesIndexes: number[][] = [];
    faces.forEach((face: Face) => {
      facesIndexes.push(face.indices);
    });

    const expectedFaces = [
      [0, 1, 2],
      [0, 3, 1],
      [0, 2, 3],
      [1, 3, 2],
    ];

    expect(facesIndexes).toEqual(expect.arrayContaining(expectedFaces));
    expect(facesIndexes).toHaveLength(expectedFaces.length);
  });
});
