import { Vector3 } from "@core/MathStructures/Vector3.ts";

export interface Face {
  indices: number[];
  normal?: Vector3;
}
