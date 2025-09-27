import { Shape } from "@extensions/PhysicsEngine/Shapes/Shape.ts";
import { Vector3 } from "@core/MathStructures/Vector3.ts";
import { Face } from "@extensions/PhysicsEngine/Shapes/Face";

export class SinglePoint implements Shape {
  public readonly vertices: Vector3[];
  private faces: Face[] = [];

  constructor() {
    this.vertices = [new Vector3(0, 0, 0)];
  }

  public getSupportPoint(d: Vector3): Vector3 {
    return this.vertices[0];
  }

  public getLongestVertexFromCenter(): Vector3 {
    return this.vertices[0];
  }

  public getGravitationCenter(): Vector3 {
    return this.vertices[0];
  }
}
