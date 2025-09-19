import { CollisionHandler } from "./CollisionHandler";
import { ShapedCollider } from "@extensions/PhysicsEngine/Colliders/ShapedCollider.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";

export class GjkCollisionHandler implements CollisionHandler {
  areColliding(a: ShapedCollider, b: ShapedCollider): Collision | null {
    const centerA = a.getGravitationCenter();
    const centerB = b.getGravitationCenter();

    return null; // Placeholder return
  }
}
