import { describe, it, expect } from "vitest";
import { Vector3 } from "@core/MathStructures/Vector3";
import { Polyhedron } from "@extensions/PhysicsEngine/Shapes/Polyhedron";

describe("Polyhedron", (): void => {
  /**
   * Tests if the gravity center of a box is correct
   */
  it("should find the correct gravity center of a box", () => {
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
    const shape = new Polyhedron(vertices);

    // When
    const center = shape.getGravitationCenter();

    // Then
    expect(center).toEqual(new Vector3(1, 1, 1));
  });
});
