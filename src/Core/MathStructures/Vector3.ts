import { Quaternion } from "@core/MathStructures/Quaternion.ts";
import { Vector2 } from "@core/MathStructures/Vector2.ts";

/**
 * A 3D vector class orthogonal to the x, y and z axis
 * Note that when something return this, the reference is the same as the original object and not copied. Use clone() to get a new instance.
 */
export class Vector3 {
  public x: number;
  public y: number;
  public z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Get the computed length/magnitude of the vector
   */
  public get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Get the computed dotProduct of the vector with another vector
   * @param vector
   */
  public dotProduct(vector: Vector3): number {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  /**
   * Get the cross product of this vector and another vector
   * @param vector
   */
  public crossProduct(vector: Vector3): Vector3 {
    return new Vector3(
      this.y * vector.z - this.z * vector.y,
      this.z * vector.x - this.x * vector.z,
      this.x * vector.y - this.y * vector.x,
    );
  }

  /**
   * Get the computed angle between the vector and another vector
   * @param vector
   */
  public angleBetween(vector: Vector3): number {
    return Math.acos(this.dotProduct(vector) / (this.length * vector.length));
  }

  /**
   * Add another vector to this vector
   * @param vector
   */
  public add(vector: Vector3): Vector3 {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
    return this.round();
  }

  /**
   * Subtract another vector from this vector
   * @param vector
   */
  public sub(vector: Vector3): Vector3 {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    return this.round();
  }

  /**
   * Round the vector values (used to avoid floating point issues)
   * @param decimals number of decimals after the round
   * @returns
   */
  public round(decimals: number = 9): Vector3 {
    const factor = Math.pow(10, decimals);
    this.x = Math.round(this.x * factor) / factor;
    this.y = Math.round(this.y * factor) / factor;
    this.z = Math.round(this.z * factor) / factor;
    return this;
  }

  /**
   * Scale the vector by a scalar
   * @param scalar
   */
  public scale(scalar: number): Vector3 {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  /**
   * Scale axis independently by a vector
   * @param vector
   */
  public scaleAxis(vector: Vector3): Vector3 {
    this.x *= vector.x;
    this.y *= vector.y;
    this.z *= vector.z;
    return this;
  }

  /**
   * Normalize the vector
   */
  public normalize(): Vector3 {
    let length = this.length;
    if (length === 0) return this;
    this.x /= length;
    this.y /= length;
    this.z /= length;
    return this;
  }

  /**
   * Get a cloned/duplicated instance of this vector
   */
  public clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  /**
   * Rotate this vector by a quaternion
   * @param quaternion The quaternion representing the rotation
   */
  public rotate(quaternion: Quaternion): Vector3 {
    // Convert this vector to a "pure" quaternion (w = 0)
    const vectorQuaternion = new Quaternion(0, this.x, this.y, this.z);

    // Perform the rotation: q * v * q^-1
    const conjugate = new Quaternion(
      quaternion.w,
      -quaternion.x,
      -quaternion.y,
      -quaternion.z,
    );
    const rotatedQuaternion = quaternion
      .clone()
      .multiply(vectorQuaternion) // q * v
      .multiply(conjugate); // (q * v) * q^-1

    // Extract the rotated vector from the resulting quaternion
    this.x = rotatedQuaternion.x;
    this.y = rotatedQuaternion.y;
    this.z = rotatedQuaternion.z;

    return this;
  }

  /**
   * Return a new Vector2 instance (without the Z component)
   */
  public toVector2() {
    return new Vector2(this.x, this.y);
  }

  /**
   * Set the vector from a Vector2 instance
   * @param vector
   */
  public setFromVector2(vector: Vector2) {
    this.x = vector.x;
    this.y = vector.y;
    return this;
  }

  /**
   * Set the vector from a Vector3 instance
   * @param vector
   */
  public setFromVector3(vector: Vector3) {
    this.x = vector.x;
    this.y = vector.y;
    this.z = vector.z;
    return;
  }

  /**
   * Set the vector to the given values
   * @param x
   * @param y
   * @param z
   */
  public set(x: number, y: number, z: number): Vector3 {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * Get a new vector3 init to zero
   */
  public static zero() {
    return new Vector3(0, 0, 0);
  }

  /**
   * Get a new vector3 with Y component set to 1
   */
  public static up() {
    return new Vector3(0, 1, 0);
  }

  /**
   * Get a new vector3 with Z component set to 1
   */
  public static forward() {
    return new Vector3(0, 0, 1);
  }

  /**
   * Get a new vector3 with X component set to 1
   */
  public static right() {
    return new Vector3(1, 0, 0);
  }
}
