import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { GameEngineWindow } from "@core/GameEngineWindow";
import { PhysicsGameEngineComponent } from "@extensions/PhysicsEngine/PhysicsGameEngineComponent";
import { GameObject } from "@core/GameObject";
import { PolygonCollider } from "@extensions/PhysicsEngine/Colliders/PolygonCollider";
import { ManualTicker } from "@test/ExampleBehaviors/ManualTicker";
import { Collider } from "@extensions/PhysicsEngine/Colliders/Collider";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision";
import { Rigidbody } from "@extensions/PhysicsEngine/Rigidbodies/Rigidbody";
import { Vector3 } from "@core/MathStructures/Vector3";

describe("PhysicsGameEngineComponent", (): void => {
  let gameEngineWindow: GameEngineWindow;
  let physicsGameEngineComponent: PhysicsGameEngineComponent;
  const manualTicker = new ManualTicker();
  const observer = (data: Collision[], collideWithCollider) => {
    data.map((collision) => {
      collideWithCollider.push(collision.otherCollider);
    });
  };

  beforeEach(() => {
    gameEngineWindow = new GameEngineWindow(manualTicker);
    physicsGameEngineComponent = new PhysicsGameEngineComponent(manualTicker);
  });

  /**
   * Tests if a PhysicsGameEngineComponent can detect a collision between two Colliders.
   */
  it("should emit an event from a Collider with the second Collider as param", () => {
    // First object with collider
    const object1: GameObject = new GameObject();
    const vertices1: Vector3[] = [
      new Vector3(-1, 2, 0),
      new Vector3(-1, 6, 0),
      new Vector3(-5, 5, 0),
      new Vector3(-4, 2, 0),
    ];
    const polygonCollider1: PolygonCollider = new PolygonCollider(vertices1);
    object1.addBehavior(polygonCollider1);
    gameEngineWindow.root.addChild(object1);

    // Second object with collider
    const object2: GameObject = new GameObject();
    const vertices2: Vector3[] = [
      new Vector3(1, 2, 0),
      new Vector3(3, 4, 0),
      new Vector3(2, 6, 0),
      new Vector3(-2, 4, 0),
    ];
    const polygonCollider2: PolygonCollider = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    gameEngineWindow.root.addChild(object2);

    const collideWithCollider1: Collider[] = [];
    const collideWithCollider2: Collider[] = [];

    polygonCollider1.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider1),
    );
    polygonCollider2.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider2),
    );

    // Fire the event
    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    manualTicker.tick(1);

    // Assert the result
    expect(collideWithCollider1.length).toBe(1);
    expect(collideWithCollider1[0]).toBe(polygonCollider2);

    expect(collideWithCollider2.length).toBe(1);
    expect(collideWithCollider2[0]).toBe(polygonCollider1);
  });

  /**
   * Tests if a PhysicsGameEngineComponent does not trigger collision if there is not.
   */
  it("should not emit an event from a Collider", () => {
    // First object with collider
    const object1 = new GameObject();
    const vertices1 = [
      new Vector3(-1, 2, 0),
      new Vector3(-1, 6, 0),
      new Vector3(-5, 5, 0),
      new Vector3(-4, 2, 0),
    ];
    const polygonCollider1 = new PolygonCollider(vertices1);
    object1.addBehavior(polygonCollider1);
    gameEngineWindow.root.addChild(object1);

    // Second object with collider
    const object2 = new GameObject();
    const vertices2 = [
      new Vector3(1, 2, 0),
      new Vector3(3, 4, 0),
      new Vector3(2, 6, 0),
      new Vector3(0, 4, 0),
    ];
    const polygonCollider2 = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    gameEngineWindow.root.addChild(object2);

    const collideWithCollider2: Collider[] = [];

    // Attach observer
    polygonCollider2.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider2),
    );

    // Fire the event
    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    manualTicker.tick(1);

    // Assert the result
    expect(collideWithCollider2.length).toBe(0);
  });

  /**
   * Tests if a PhysicsGameEngineComponent trigger all collision when there is many.
   */
  it("should emit multiple events from a Collider", () => {
    // First object with collider
    const object1 = new GameObject();
    const vertices1 = [
      new Vector3(0, 5, 0),
      new Vector3(8, 5, 0),
      new Vector3(11, 16, 0),
      new Vector3(12, 20, 0),
    ];
    const polygonCollider1 = new PolygonCollider(vertices1);
    object1.addBehavior(polygonCollider1);
    gameEngineWindow.root.addChild(object1);

    // Second object with collider
    const object2 = new GameObject();
    const vertices2 = [
      new Vector3(4, 0, 0),
      new Vector3(6, 5, 0),
      new Vector3(0, 4, 0),
    ];
    const polygonCollider2 = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    gameEngineWindow.root.addChild(object2);

    // Third object with collider
    const object3 = new GameObject();
    const vertices3 = [
      new Vector3(5, 0, 0),
      new Vector3(15, 1, 0),
      new Vector3(11, 12, 0),
      new Vector3(7, 8, 0),
    ];
    const polygonCollider3 = new PolygonCollider(vertices3);
    object3.addBehavior(polygonCollider3);
    gameEngineWindow.root.addChild(object3);

    // Fourth object with collider
    const object4 = new GameObject();
    const vertices4 = [
      new Vector3(11, 10, 0),
      new Vector3(15, 2, 0),
      new Vector3(20, 4, 0),
      new Vector3(20, 8, 0),
      new Vector3(14, 13, 0),
    ];
    const polygonCollider4 = new PolygonCollider(vertices4);
    object4.addBehavior(polygonCollider4);
    gameEngineWindow.root.addChild(object4);

    // Fifth object with collider
    const object5 = new GameObject();
    const vertices5 = [
      new Vector3(10, 13, 0),
      new Vector3(17, 10, 0),
      new Vector3(19, 15, 0),
      new Vector3(18, 17, 0),
      new Vector3(12, 16, 0),
    ];
    const polygonCollider5 = new PolygonCollider(vertices5);
    object5.addBehavior(polygonCollider5);
    gameEngineWindow.root.addChild(object5);

    const collideWithCollider1: Collider[] = [];
    const collideWithCollider2: Collider[] = [];
    const collideWithCollider3: Collider[] = [];
    const collideWithCollider4: Collider[] = [];
    const collideWithCollider5: Collider[] = [];

    // Attach observer
    polygonCollider1.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider1),
    );
    polygonCollider2.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider2),
    );
    polygonCollider3.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider3),
    );
    polygonCollider4.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider4),
    );
    polygonCollider5.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider5),
    );

    // Fire the event

    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    manualTicker.tick(1);

    // Assert the result
    expect(collideWithCollider1.length).toBe(3);
    expect(collideWithCollider2.length).toBe(1);
    expect(collideWithCollider3.length).toBe(2);
    expect(collideWithCollider4.length).toBe(2);
    expect(collideWithCollider5.length).toBe(2);

    // Assert that Collider1 has collided with Colliders 2, 3 and 5
    expect(collideWithCollider1).toContain(polygonCollider2);
    expect(collideWithCollider1).toContain(polygonCollider3);
    expect(collideWithCollider1).toContain(polygonCollider5);

    // Assert that Collider2 has collided with Collider1
    expect(collideWithCollider2).toContain(polygonCollider1);

    // Assert that Collider3 has collided with Colliders 1 and 4
    expect(collideWithCollider3).toContain(polygonCollider1);
    expect(collideWithCollider3).toContain(polygonCollider4);

    // Assert that Collider4 has collided with Colliders 3 and 5
    expect(collideWithCollider4).toContain(polygonCollider3);
    expect(collideWithCollider4).toContain(polygonCollider5);

    // Assert that Collider5 has collided with Colliders 1 and 4
    expect(collideWithCollider5).toContain(polygonCollider1);
    expect(collideWithCollider5).toContain(polygonCollider4);
  });

  /**
   * Tests if a PhysicsGameEngineComponent does not trigger collision if there is not with many polygons.
   */
  it("should not emit an event from a Collider", () => {
    // First object with collider
    const object1 = new GameObject();
    const vertices1 = [
      new Vector3(0, 5, 0),
      new Vector3(5, 6, 0),
      new Vector3(11, 16, 0),
      new Vector3(12, 20, 0),
    ];
    const polygonCollider1 = new PolygonCollider(vertices1);
    object1.addBehavior(polygonCollider1);
    gameEngineWindow.root.addChild(object1);

    // Second object with collider
    const object2 = new GameObject();
    const vertices2 = [
      new Vector3(4, 0, 0),
      new Vector3(6, 5, 0),
      new Vector3(0, 4, 0),
    ];
    const polygonCollider2 = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    gameEngineWindow.root.addChild(object2);

    // Third object with collider
    const object3 = new GameObject();
    const vertices3 = [
      new Vector3(5, 0, 0),
      new Vector3(15, 1, 0),
      new Vector3(11, 12, 0),
      new Vector3(7, 8, 0),
    ];
    const polygonCollider3 = new PolygonCollider(vertices3);
    object3.addBehavior(polygonCollider3);
    gameEngineWindow.root.addChild(object3);

    // Fourth object with collider
    const object4 = new GameObject();
    const vertices4 = [
      new Vector3(12, 10, 0),
      new Vector3(15, 2, 0),
      new Vector3(20, 4, 0),
      new Vector3(20, 8, 0),
      new Vector3(14, 11, 0),
    ];
    const polygonCollider4 = new PolygonCollider(vertices4);
    object4.addBehavior(polygonCollider4);
    gameEngineWindow.root.addChild(object4);

    // Fifth object with collider
    const object5 = new GameObject();
    const vertices5 = [
      new Vector3(10, 13, 0),
      new Vector3(17, 10, 0),
      new Vector3(19, 15, 0),
      new Vector3(18, 17, 0),
      new Vector3(12, 16, 0),
    ];
    const polygonCollider5 = new PolygonCollider(vertices5);
    object5.addBehavior(polygonCollider5);
    gameEngineWindow.root.addChild(object5);

    const collideWithCollider1: Collider[] = [];
    const collideWithCollider2: Collider[] = [];
    const collideWithCollider3: Collider[] = [];
    const collideWithCollider4: Collider[] = [];
    const collideWithCollider5: Collider[] = [];

    // Attach observer
    polygonCollider1.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider1),
    );
    polygonCollider2.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider2),
    );
    polygonCollider3.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider3),
    );
    polygonCollider4.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider4),
    );
    polygonCollider5.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider5),
    );

    // Fire the event
    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    manualTicker.tick(1);

    // Assert the result
    expect(collideWithCollider1.length).toBe(0);
    expect(collideWithCollider2.length).toBe(0);
    expect(collideWithCollider3.length).toBe(0);
    expect(collideWithCollider4.length).toBe(0);
    expect(collideWithCollider5.length).toBe(0);
  });

  /**
   * Tests if a PhysicsGameEngineComponent does not trigger collision if there is not.
   */
  it("should not emit an event from a Collider", () => {
    // First object with collider
    const object1 = new GameObject();
    const vertices1 = [
      new Vector3(-1, 2, 0),
      new Vector3(-1, 6, 0),
      new Vector3(-5, 5, 0),
      new Vector3(-4, 2, 0),
    ];
    const polygonCollider1 = new PolygonCollider(vertices1);
    object1.addBehavior(polygonCollider1);
    gameEngineWindow.root.addChild(object1);

    // Second object with collider
    const object2 = new GameObject();
    const vertices2 = [
      new Vector3(1, 2, 0),
      new Vector3(3, 4, 0),
      new Vector3(2, 6, 0),
      new Vector3(0, 4, 0),
    ];
    const polygonCollider2 = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    gameEngineWindow.root.addChild(object2);

    const collideWithCollider2: Collider[] = [];

    // Attach observer
    polygonCollider2.onDataChanged.addObserver((data) =>
      observer(data, collideWithCollider2),
    );

    // Fire the event
    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    manualTicker.tick(1);

    // Assert the result
    expect(collideWithCollider2.length).toBe(0);
  });
});
