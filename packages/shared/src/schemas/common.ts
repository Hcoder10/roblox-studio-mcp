import { z } from 'zod';

// Common reusable schemas

export const vector3_schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const cframe_schema = z.object({
  position: vector3_schema,
  // 3x3 rotation matrix (row-major)
  rotation: z.array(z.number()).length(9).optional(),
});

export const color3_schema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
});

export const udim2_schema = z.object({
  x_scale: z.number(),
  x_offset: z.number(),
  y_scale: z.number(),
  y_offset: z.number(),
});

export const region3_schema = z.object({
  min: vector3_schema,
  max: vector3_schema,
});

export const instance_path_schema = z.string().describe('Dot-separated path in the DataModel, e.g. "Workspace.Map.Building1"');

export const property_value_schema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  vector3_schema,
  cframe_schema,
  color3_schema,
  udim2_schema,
  z.record(z.unknown()),
]);

export const pagination_schema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
