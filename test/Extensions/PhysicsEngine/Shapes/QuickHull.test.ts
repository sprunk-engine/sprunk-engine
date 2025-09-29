import { describe, it, expect } from "vitest";
import { Vector3 } from "@core/MathStructures/Vector3";
import { QuickHullFactory } from "@extensions/PhysicsEngine/Shapes/QuickHullFactory.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face.ts";

describe("QuickHull", (): void => {
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

    const hull = QuickHullFactory.buildHull(vertices);

    // When
    hull.build();

    // Then
    const facesIndexes: number[][] = [];
    hull.faces.forEach((face: Face) => {
      facesIndexes.push(face.indices);
    });

    const expectedFaces = [
      [2, 1, 0, 3],
      [5, 4, 0, 1],
      [0, 4, 7, 3],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [4, 5, 6, 7],
    ];

    expect(facesIndexes).toEqual(expect.arrayContaining(expectedFaces));
    expect(facesIndexes).toHaveLength(expectedFaces.length);
  });

  /**
   * Tests if we find the correct faces of a tetrahedron.
   */
  it("should find the correct faces of a tetrahedron", () => {
    // Given
    const vertices: Vector3[] = [
      new Vector3(0, 0, 0),
      new Vector3(4, 0, 0),
      new Vector3(3, 3, 0),
      new Vector3(1, 1, 4),
    ];

    const hull = QuickHullFactory.buildHull(vertices);

    // When
    hull.build();

    // Then
    const facesIndexes: number[][] = [];
    hull.faces.forEach((face: Face) => {
      facesIndexes.push(face.indices);
    });

    const expectedFaces = [
      [2, 1, 0],
      [1, 3, 0],
      [3, 2, 0],
      [2, 3, 1],
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
      new Vector3(1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(1, 1, 0),
      new Vector3(0.5, 0.5, 2),
    ];

    const hull = QuickHullFactory.buildHull(vertices);

    // When
    hull.build();

    // Then
    const facesIndexes: number[][] = [];
    hull.faces.forEach((face: Face) => {
      facesIndexes.push(face.indices);
    });

    const expectedFaces = [
      [1, 4, 0],
      [4, 2, 0],
      [2, 4, 3],
      [4, 1, 3],
      [3, 1, 0, 2],
    ];

    expect(facesIndexes).toEqual(expect.arrayContaining(expectedFaces));
    expect(facesIndexes).toHaveLength(expectedFaces.length);
  });
});
