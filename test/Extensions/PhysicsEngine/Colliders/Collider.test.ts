import { describe, it, expect } from "vitest";
import { Vector3 } from "@core/MathStructures/Vector3";
import { PolygonCollider } from "@extensions/PhysicsEngine/Colliders/PolygonCollider";
import { PolygonCollider } from "@extensions/PhysicsEngine/Colliders/PolygonCollider";
import { GameEngineWindow } from "@core/GameEngineWindow";
import { ManualTicker } from "../../../ExampleBehaviors/ManualTicker";

describe("Collider", (): void => {
  /**
   * Tests if a perfect square has a well placed gravity center.
   */
  it("should place the gravity center of the square at the center of the shape", () => {
    const manualTicker = new ManualTicker();
    const gameEngineWindow = new GameEngineWindow(manualTicker);

    // Given
    const vertices: Vector3[] = [
      new Vector3(-1, -1, 2),
      new Vector3(-1, 3, 2),
      new Vector3(3, 3, 0),
      new Vector3(3, -1, 0),
    ];
    const polygonCollider: PolygonCollider = new PolygonCollider(vertices);

    // When
    const center: Vector3 = polygonCollider.getGravitationCenter();
    const expectedCenter: Vector3 = new Vector3(1, 1, 1);

    // Then
    expect(center).toStrictEqual(expectedCenter);
  });

  /**
   * Tests if a perfect square with high concentration of vectors in a corner has a well placed gravity center.
   */
  it("should place the gravity center of the complex square at the center of the shape", () => {
    const manualTicker = new ManualTicker();
    const gameEngineWindow = new GameEngineWindow(manualTicker);

    // Given
    const vertices: Vector3[] = [
      new Vector3(-1, -1, -4),
      new Vector3(-1, 3, 0),
      new Vector3(1, 3, 1),
      new Vector3(2, 3, 2),
      new Vector3(3, 3, 1),
      new Vector3(3, 2, -3),
      new Vector3(3, 1, 1),
      new Vector3(3, -1, 9),
    ];
    const polygonCollider: PolygonCollider = new PolygonCollider(vertices);

    // When
    const center: Vector3 = polygonCollider.getGravitationCenter();
    const expectedCenter: Vector3 = new Vector3(1, 1, 0.875);

    // Then
    expect(center).toStrictEqual(expectedCenter);
  });
});
