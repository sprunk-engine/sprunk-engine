import { PhysicsBehavior } from "@extensions/PhysicsEngine/PhysicsBehavior.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";
import { Rigidbody } from "@extensions/PhysicsEngine/Rigidbodies/Rigidbody.ts";
import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Shape } from "@extensions/PhysicsEngine/Shapes/Shape.ts";

/**
 * Collider class is a base class for all type/shapes of colliders (objects that can trigger collisions with other objects)
 */
export class Collider extends PhysicsBehavior<Collision[]> {
  public shape?: Shape;
  public rigidbody?: Rigidbody;
  constructor() {
    super();
    this.data = [];
  }

  // TODO remove after completing GJK
  public getSupportPoint(d: Vector3): Vector3 {
    return this.shape!.getSupportPoint(d);
  }
  // TODO remove after completing GJK
  public getGravitationCenter(): Vector3 {
    return this.shape!.getGravitationCenter();
  }
  // TODO remove after completing GJK
  public getLongestVertexFromCenter(): Vector3 {
    return this.shape!.getLongestVertexFromCenter();
  }

  /**
   * Get the world position of the collider
   */
  public getWorldPosition(): Vector3 {
    return this.gameObject.transform.worldPosition;
  }

  /**
   * Trigger an event when the colliders hit another collider
   * @param collidedColliders
   */
  public collide(collisions: Collision[]): void {
    if (
      collisions.length !== this.data.length ||
      !collisions.every((value, index) => value === this.data[index])
    ) {
      this.data = collisions;
      this.notifyDataChanged();
    }
  }
}
