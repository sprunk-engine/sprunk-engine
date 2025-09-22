import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Collider } from "@extensions/PhysicsEngine/Colliders/Collider.ts";
import { ShapedCollider } from "./ShapedCollider";

/**
 * Represents a collision between two colliders from the POV of a collider.
 */
export class Collision {
  protected _depth: number; // penetration depth between the colliders
  protected _normal: Vector3; // axis that represents the direction of the collision (always from otherCollider to currentCollider)
  protected _currentCollider: Collider;
  protected _otherCollider: Collider;

  public get depth(): number {
    return this._depth;
  }

  public get normal(): Vector3 {
    return this._normal;
  }

  get otherCollider(): Collider {
    return this._otherCollider;
  }

  constructor(
    depth: number,
    normal: Vector3,
    currentCollider: Collider,
    otherCollider: Collider,
  ) {
    this._depth = depth;
    this._normal = normal;
    this._currentCollider = currentCollider;
    this._otherCollider = otherCollider;
  }

  /**
   * Get a computed opposite collision that matches the second collider involved POV
   */
  public getOpposite() {
    return new Collision(
      this._depth,
      this._normal.clone().scale(-1),
      this.otherCollider,
      this._currentCollider,
    );
  }
}
