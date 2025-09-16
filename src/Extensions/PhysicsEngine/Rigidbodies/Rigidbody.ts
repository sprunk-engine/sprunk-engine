import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Collider } from "@extensions/PhysicsEngine/Colliders/Collider.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";
import { LogicBehavior } from "@core/LogicBehavior.ts";
import { MathUtility } from "@core/MathStructures/MathUtility.ts";
import { Quaternion } from "@core/MathStructures/Quaternion.ts";
import { CollisionRigidbodies } from "@extensions/PhysicsEngine/Colliders/CollisionRigidbodies.ts";

/**
 * Rigibodies are physics handlers for game objects that have colliders
 */
export class Rigidbody extends LogicBehavior<void> {
  public mass: number;
  private _force: Vector3 = new Vector3(0, 0, 0);
  private _linearVelocity: Vector3 = new Vector3(0, 0, 0);
  private _angularVelocity: number = 0; // rad/s
  private _restitution: number = 0.5;
  private _collider: Collider;

  public get collider(): Collider {
    return this._collider;
  }

  public get restitution(): number {
    return this._restitution;
  }

  public get linearVelocity(): Vector3 {
    return this._linearVelocity;
  }

  public set linearVelocity(value: Vector3) {
    this._linearVelocity = value;
  }

  constructor(collider: Collider, mass: number = 1, restitution: number = 0.6) {
    super();
    this._collider = collider;
    this.collider.rigidbody = this;
    this.mass = mass;
    this._restitution = restitution;

    this._collider.onDataChanged.addObserver((data: Collision[]) =>
      this.resolveCollisions(data),
    );
  }

  /**
   * Resolve all the collisions
   * @param collisions
   */
  public resolveCollisions(collisions: Collision[]) {
    if (this.gameObject === undefined) return;

    collisions.forEach((collision: Collision) => {
      if (collision instanceof CollisionRigidbodies) {
        this.resolveCollisionRigidRigid(collision);
      } else {
        this.resolveCollisionRigidCollider(collision);
      }
    });
  }

  /**
   * Resolve the collision by bouncing the rigidbody away from the collider
   * @param collision
   */
  public resolveCollisionRigidCollider(collision: Collision) {
    this.gameObject.transform.position.sub(
      collision.normal.clone().scale(collision.depth),
    );

    this._linearVelocity.sub(
      collision.normal
        .clone()
        .scale(
          this._linearVelocity.dotProduct(collision.normal.clone()) *
            (1 + this.restitution ** 2),
        ),
    );
  }

  /**
   * Resolve the collision by shocking the game object (depending on the mass)
   * @param collision
   */
  public resolveCollisionRigidRigid(collision: CollisionRigidbodies) {
    this.gameObject.transform.position.sub(
      collision.normal.clone().scale(collision.depth / 2),
    );

    this._linearVelocity.sub(
      collision.normal.clone().scale(collision.magnitude / this.mass),
    );
  }

  /**
   * Add to the instantaneous force of the collider
   * @param force
   */
  public addForce(force: Vector3): void {
    this._force.add(force);
  }

  /**
   * Update the rigidbody movement props for one tick: velocity, forces, acceleration (time based)
   * @param deltaTime
   * @param gravity
   */
  public step(deltaTime: number, gravity: Vector3): void {
    // Compute the acceleration from the forces
    const acceleration: Vector3 = this._force.clone().scale(1 / this.mass);
    acceleration.add(gravity);

    // Move position
    const newPosition = this._linearVelocity
      .clone()
      .scale(deltaTime)
      .add(acceleration.clone().scale(deltaTime ** 2 / 2));
    this.gameObject.transform.position.add(newPosition);

    // Rotate
    const rotationQuaternion: Quaternion = MathUtility.radToQuaternion(
      this._angularVelocity * deltaTime,
    );
    this.gameObject.transform.rotation.multiply(rotationQuaternion);

    // Update the props for next tick
    this._linearVelocity.add(acceleration.scale(deltaTime));
    if (this._linearVelocity.x > -0.00001 && this._linearVelocity.x < 0.00001)
      this._linearVelocity.x = 0;

    this._force = new Vector3(0, 0, 0); // reset in order to apply force by addForce() only
  }
}
