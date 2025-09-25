import { describe, it, expect } from "vitest";
import { Vector3 } from "@core/MathStructures/Vector3";
import { QuickHull3D } from "@extensions/PhysicsEngine/Shapes/QuickHull3D.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face.ts";

describe("Collider", (): void => {
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

    expect(facesIndexes).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([0, 1, 2, 3]),
        expect.arrayContaining([1, 2, 6, 5]),
        expect.arrayContaining([0, 4, 7, 3]),
        expect.arrayContaining([1, 0, 3, 2]),
        expect.arrayContaining([4, 5, 6, 7]),
        expect.arrayContaining([2, 3, 7, 6]),
      ]),
    );
  });
});
