import { describe, it, expect, beforeEach } from "vitest";
import { GameEngineWindow } from "@core/GameEngineWindow";
import { PhysicsGameEngineComponent } from "@extensions/PhysicsEngine/PhysicsGameEngineComponent";
import { GameObject } from "@core/GameObject";
import { PolygonCollider } from "@extensions/PhysicsEngine/Colliders/PolygonCollider";
import { Vector3 } from "@core/MathStructures/Vector3";
import { ManualTicker } from "@test/ExampleBehaviors/ManualTicker";
import { Rigidbody } from "@extensions/PhysicsEngine/Rigidbodies/Rigidbody";

describe("Rigidbody", (): void => {
  let gameEngineWindow: GameEngineWindow;
  let physicsGameEngineComponent: PhysicsGameEngineComponent;
  const manualTicker = new ManualTicker();

  beforeEach(() => {
    gameEngineWindow = new GameEngineWindow(manualTicker);
    physicsGameEngineComponent = new PhysicsGameEngineComponent(manualTicker);
  });

  /**
   * Ticks for n seconds since tunneling is not implemented
   * @param duration
   */
  function processTicksDuring(
    duration: number,
    object1?: GameObject,
    rigidBody1?,
  ): void {
    for (let i: number = 0; i < duration * 100; i++) {
      manualTicker.tick(0.01);
      if (object1 && rigidBody1)
        console.log(
          Math.round(object1.transform.position.y * 1000000) / 1000000 +
            " -------- " +
            rigidBody1.linearVelocity.y,
        );
    }
  }

  /**
   * Tests if the gravity is correctly handled
   */
  it("should fall with the acceleration of 9.81", () => {
    // First object with collider
    const object1: GameObject = new GameObject("Object1");
    gameEngineWindow.root.addChild(object1);

    const vertices1: Vector3[] = [
      new Vector3(1, 1, 1),
      new Vector3(1, -1, 1),
      new Vector3(-1, -1, -1),
      new Vector3(-1, 1, -1),
    ];
    const polygonCollider1: PolygonCollider = new PolygonCollider(vertices1);
    const rigidBody1 = new Rigidbody(polygonCollider1, 1);

    object1.addBehavior(polygonCollider1);
    object1.addBehavior(rigidBody1);

    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    // check position at s0
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBe(0);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity).toStrictEqual(new Vector3(0, 0, 0));

    // Check position at s1
    manualTicker.tick(1);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-4.905);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity.x).toBeCloseTo(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(-9.81);
    expect(rigidBody1.linearVelocity.z).toBeCloseTo(0);

    // Check position at s2
    manualTicker.tick(1);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-19.62);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity.x).toBeCloseTo(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(-19.62);
    expect(rigidBody1.linearVelocity.z).toBeCloseTo(0);

    // Check position at s3
    manualTicker.tick(1);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-44.145);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity.x).toBeCloseTo(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(-29.48, 0);
    expect(rigidBody1.linearVelocity.z).toBeCloseTo(0);
  });

  /**
   * Tests if the bounce on a collider works well with full restitution
   */
  it("should bounce on collider with full resitution", () => {
    // Rigidbody
    const object1: GameObject = new GameObject("Object1");
    gameEngineWindow.root.addChild(object1);
    const vertices1: Vector3[] = [
      new Vector3(1, 2, 1),
      new Vector3(1, 0, 1),
      new Vector3(-1, 0, -1),
      new Vector3(-1, 2, -1),
    ];
    const polygonCollider1: PolygonCollider = new PolygonCollider(vertices1);
    const rigidBody1 = new Rigidbody(polygonCollider1, 1, 1);
    object1.addBehavior(polygonCollider1);
    object1.addBehavior(rigidBody1);

    // Collider
    const object2: GameObject = new GameObject("Object2");
    gameEngineWindow.root.addChild(object2);
    const vertices2: Vector3[] = [new Vector3(-1, 0, 0), new Vector3(1, 0, 0)];
    const polygonCollider2: PolygonCollider = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    object2.transform.position.set(0, -4.905, 0);

    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    // check position at s0
    expect(object2.transform.position.x).toBe(0);
    expect(object2.transform.position.y).toBe(-4.905);
    expect(object2.transform.position.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBe(0);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity).toStrictEqual(new Vector3(0, 0, 0));

    // Check position at s1
    manualTicker.tick(1);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(9.81);
    expect(rigidBody1.linearVelocity.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-4.905);
    expect(object1.transform.position.z).toBe(0);

    // Check position at s2
    manualTicker.tick(1);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(0);
    expect(rigidBody1.linearVelocity.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(0);
    expect(object1.transform.position.z).toBe(0);
  });

  /**
   * Tests if the bounce on a collider works well with half restitution
   */
  it("should bounce on collider with half resitution", () => {
    // Rigidbody
    const object1: GameObject = new GameObject("Object1");
    gameEngineWindow.root.addChild(object1);
    const vertices1: Vector3[] = [
      new Vector3(1, 2, 1),
      new Vector3(1, 0, 1),
      new Vector3(-1, 0, -1),
      new Vector3(-1, 2, -1),
    ];
    const polygonCollider1: PolygonCollider = new PolygonCollider(vertices1);
    const rigidBody1 = new Rigidbody(polygonCollider1, 1, 0.5);
    object1.addBehavior(polygonCollider1);
    object1.addBehavior(rigidBody1);

    // Collider
    const object2: GameObject = new GameObject("Object2");
    gameEngineWindow.root.addChild(object2);
    const vertices2: Vector3[] = [
      new Vector3(-1, 0, 0),
      new Vector3(1, 0, 0),
      new Vector3(0, -2, 0),
    ];
    const polygonCollider2: PolygonCollider = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    object2.transform.position.set(0, -4.905, 0);

    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    // check position at s0
    expect(object2.transform.position.x).toBe(0);
    expect(object2.transform.position.y).toBe(-4.905);
    expect(object2.transform.position.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBe(0);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity).toStrictEqual(new Vector3(0, 0, 0));

    // Check position at s1
    processTicksDuring(1);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(2.45, 0);
    expect(rigidBody1.linearVelocity.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-4.905);
    expect(object1.transform.position.z).toBe(0);

    // Check position when reach max height
    processTicksDuring(0.249);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(0);
    expect(rigidBody1.linearVelocity.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-4.905, 0);
    expect(object1.transform.position.z).toBe(0);

    // Check position at s2
    processTicksDuring(0.249);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(-2.4525);
    expect(rigidBody1.linearVelocity.z).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-4.905);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.z).toBe(0);
  });

  /**
   * Tests if the bounce on another rigidbody works well with full restitution
   */
  it("should bounce on rigidbody with full resitution", () => {
    // Rigidbody
    const object1: GameObject = new GameObject("Object1");
    gameEngineWindow.root.addChild(object1);
    const vertices1: Vector3[] = [
      new Vector3(1, 2, 1),
      new Vector3(1, 0, 1),
      new Vector3(-1, 0, -1),
      new Vector3(-1, 2, -1),
    ];
    const polygonCollider1: PolygonCollider = new PolygonCollider(vertices1);
    const rigidBody1 = new Rigidbody(polygonCollider1, 1, 1);
    object1.addBehavior(polygonCollider1);
    object1.addBehavior(rigidBody1);

    const object3: GameObject = new GameObject("Object3");
    gameEngineWindow.root.addChild(object3);
    const vertices3: Vector3[] = [
      new Vector3(1, 0, 1),
      new Vector3(1, -2, 1),
      new Vector3(-1, -2, -1),
      new Vector3(-1, 0, -1),
    ];
    const polygonCollider3: PolygonCollider = new PolygonCollider(vertices3);
    object3.addBehavior(polygonCollider3);
    const rigidBody3 = new Rigidbody(polygonCollider3, 1, 1);
    object3.addBehavior(rigidBody3);
    object3.transform.position.set(0, -4.905, 0);

    // Collider
    const object2: GameObject = new GameObject("Object2");
    gameEngineWindow.root.addChild(object2);
    const vertices2: Vector3[] = [new Vector3(-1, 0, 0), new Vector3(1, 0, 0)];
    const polygonCollider2: PolygonCollider = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    object2.transform.position.set(0, -6.905, 0);

    gameEngineWindow.addGameComponent(physicsGameEngineComponent);
    // check position at s0
    expect(object2.transform.position.x).toBe(0);
    expect(object2.transform.position.y).toBe(-6.905);
    expect(object2.transform.position.z).toBe(0);
    expect(object3.transform.position.x).toBe(0);
    expect(object3.transform.position.y).toBe(-4.905);
    expect(object3.transform.position.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBe(0);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity).toStrictEqual(new Vector3(0, 0, 0));

    // Check position at s1
    processTicksDuring(1);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-4.905);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBe(0);
    expect(rigidBody1.linearVelocity.z).toBe(0);

    let vel = rigidBody1.linearVelocity.y;
    let isVelExpected = false;
    // Accept inaccuracy while bouncing (frame before, frame during and frame after) are allowed
    if (vel == 9.81 || vel == 0 || vel == -9.81) isVelExpected = true;

    expect(isVelExpected).toBe(true);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-4.905);
    expect(object1.transform.position.z).toBe(0);

    // Check position at s2
    processTicksDuring(1);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(0, 0);
    expect(rigidBody1.linearVelocity.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(0, 0);
    expect(object1.transform.position.z).toBe(0);
  });

  /**
   * Tests if the bounce on another rigidbody works well with half restitution
   */
  it("should bounce on rigidbody with half resitution", () => {
    // Rigidbody
    const object1: GameObject = new GameObject("Object1");
    gameEngineWindow.root.addChild(object1);
    const vertices1: Vector3[] = [
      new Vector3(1, 2, 1),
      new Vector3(1, 0, 1),
      new Vector3(-1, 0, -1),
      new Vector3(-1, 2, -1),
    ];
    const polygonCollider1: PolygonCollider = new PolygonCollider(vertices1);
    const rigidBody1 = new Rigidbody(polygonCollider1, 1, 0.5);
    object1.addBehavior(polygonCollider1);
    object1.addBehavior(rigidBody1);

    const object3: GameObject = new GameObject("Object3");
    gameEngineWindow.root.addChild(object3);
    const vertices3: Vector3[] = [
      new Vector3(1, 0, 1),
      new Vector3(1, -2, 1),
      new Vector3(-1, -2, -1),
      new Vector3(-1, 0, -1),
    ];
    const polygonCollider3: PolygonCollider = new PolygonCollider(vertices3);
    object3.addBehavior(polygonCollider3);
    const rigidBody3 = new Rigidbody(polygonCollider3, 1, 1);
    object3.addBehavior(rigidBody3);
    object3.transform.position.set(0, -4.905, 0);

    // Collider
    const object2: GameObject = new GameObject("Object2");
    gameEngineWindow.root.addChild(object2);
    const vertices2: Vector3[] = [new Vector3(-1, 0, 0), new Vector3(1, 0, 0)];
    const polygonCollider2: PolygonCollider = new PolygonCollider(vertices2);
    object2.addBehavior(polygonCollider2);
    object2.transform.position.set(0, -6.905, 0);

    gameEngineWindow.addGameComponent(physicsGameEngineComponent);

    // check position at s0
    expect(object2.transform.position.x).toBe(0);
    expect(object2.transform.position.y).toBe(-6.905);
    expect(object2.transform.position.z).toBe(0);
    expect(object3.transform.position.x).toBe(0);
    expect(object3.transform.position.y).toBe(-4.905);
    expect(object3.transform.position.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBe(0);
    expect(object1.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity).toStrictEqual(new Vector3(0, 0, 0));

    // Check position at s1
    processTicksDuring(1);
    expect(object3.transform.position.x).toBe(0);
    expect(object3.transform.position.y).toBeCloseTo(-4.905, 1);
    expect(object3.transform.position.z).toBe(0);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(-2.4525);
    expect(rigidBody1.linearVelocity.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-4.905, 0);
    expect(object1.transform.position.z).toBe(0);

    // Check position at s2
    processTicksDuring(0.5);
    expect(rigidBody1.linearVelocity.x).toBe(0);
    expect(rigidBody1.linearVelocity.y).toBeCloseTo(0, 0);
    expect(rigidBody1.linearVelocity.z).toBe(0);
    expect(object1.transform.position.x).toBe(0);
    expect(object1.transform.position.y).toBeCloseTo(-3.67875, 0);
    expect(object1.transform.position.z).toBe(0);
  });

  // TODO add tests for horizontal and complex movement
});
