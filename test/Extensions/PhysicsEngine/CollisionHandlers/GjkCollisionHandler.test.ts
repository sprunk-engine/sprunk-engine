import { describe, it, expect } from "vitest";
import { Vector3 } from "@core/MathStructures/Vector3";
import { GjkCollisionHandler } from "@extensions/PhysicsEngine/CollisionHandlers/GjkCollisionHandler.ts";
import { PolygonCollider } from "@extensions/PhysicsEngine/Colliders/PolygonCollider.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";
import { GameObject } from "@core/GameObject.ts";

describe("Collider", (): void => {
  const gjkCollisionHandler = new GjkCollisionHandler();

  /**
   * Tests two box that touch each other on one face trigger a collision.
   */
  it("should trigger a collision on boxes touching each other", () => {
    // Given
    const vertices: Vector3[] = [
      new Vector3(0, 0, 0),
      new Vector3(3, 0, 0),
      new Vector3(3, -3, 0),
      new Vector3(0, -3, 0),
      new Vector3(0, 0, 2),
      new Vector3(3, 0, 2),
      new Vector3(3, -3, 2),
      new Vector3(0, -3, 2),
    ];
    const object1: GameObject = new GameObject();
    const box1: PolygonCollider = new PolygonCollider(vertices);
    object1.addBehavior(box1);

    const object2: GameObject = new GameObject();
    const box2: PolygonCollider = new PolygonCollider(vertices);
    object2.addBehavior(box2);
    object2.transform.position.set(0, -1, -2);

    expect(box1.getVerticesWithTransform()[7]).toEqual(new Vector3(0, -3, 2));
    expect(box1.getGravitationCenter()).toEqual(new Vector3(1.5, -1.5, 1));
    expect(box2.getVerticesWithTransform()[7]).toEqual(new Vector3(0, -4, 0));
    expect(box2.getGravitationCenter()).toEqual(new Vector3(1.5, -1.5, 1));

    // When
    const collision = gjkCollisionHandler.areColliding(box1, box2);

    // Then
    expect(collision).toBeInstanceOf(Collision);
  });

  /**
   * Tests two box that are not colliding do not trigger a collision.
   */
  it("should not trigger a collision on boxes not touching each other", () => {
    // Given
    const vertices: Vector3[] = [
      new Vector3(0, 0, 0),
      new Vector3(3, 0, 0),
      new Vector3(3, -3, 0),
      new Vector3(0, -3, 0),
      new Vector3(0, 0, 2),
      new Vector3(3, 0, 2),
      new Vector3(3, -3, 2),
      new Vector3(0, -3, 2),
    ];
    const object1: GameObject = new GameObject();
    const box1: PolygonCollider = new PolygonCollider(vertices);
    object1.addBehavior(box1);

    const object2: GameObject = new GameObject();
    const box2: PolygonCollider = new PolygonCollider(vertices);
    object2.addBehavior(box2);
    object2.transform.position.set(0, -1, -3);

    expect(box1.getVerticesWithTransform()[7]).toEqual(new Vector3(0, -3, 2));
    expect(box1.getGravitationCenter()).toEqual(new Vector3(1.5, -1.5, 1));
    expect(box2.getVerticesWithTransform()[7]).toEqual(new Vector3(0, -4, -1));
    expect(box2.getGravitationCenter()).toEqual(new Vector3(1.5, -1.5, 1));

    // When
    const collision = gjkCollisionHandler.areColliding(box1, box2);

    // Then
    expect(collision).toEqual(null);
  });
});
