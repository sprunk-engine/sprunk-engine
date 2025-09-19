import { CollisionHandler } from "./CollisionHandler";
import { Collider } from "@extensions/PhysicsEngine/Colliders/Collider.ts";
import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";

export class GjkCollisionHandler implements CollisionHandler {
  areColliding(a: Collider, b: Collider): Collision | null {
    return null; // Placeholder return
  }
}
