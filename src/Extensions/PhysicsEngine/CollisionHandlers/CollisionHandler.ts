import { Collision } from "@extensions/PhysicsEngine/Colliders/Collision.ts";
import { Collider } from "@extensions/PhysicsEngine/Colliders/Collider.ts";

/**
 * CollisionHandler interface is a base interface for all collision handlers algorithms types
 */
export interface CollisionHandler {
  /**
   * Check if two colliders are colliding
   * @param a
   * @param b
   */
  areColliding(a: Collider, b: Collider): Collision | null;
}
