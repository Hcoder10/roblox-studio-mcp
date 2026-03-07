import { z } from 'zod';
import { vector3_schema, region3_schema } from './common.js';

const terrain_material = z.enum([
  'Air', 'Grass', 'Sand', 'Rock', 'Water', 'Glacier', 'Snow', 'Sandstone',
  'Mud', 'Basalt', 'Ground', 'CrackedLava', 'Asphalt', 'Cobblestone',
  'Ice', 'LeafyGrass', 'Salt', 'Limestone', 'Pavement', 'Slate', 'Concrete',
  'Brick', 'WoodPlanks',
]);

export const terrain_generate_input = z.object({
  seed: z.number().int().optional(),
  size: vector3_schema.optional().describe('Size of terrain to generate'),
  position: vector3_schema.optional().describe('Center position'),
  biome: z.enum(['plains', 'mountains', 'desert', 'arctic', 'volcanic']).optional().default('plains'),
});

export const terrain_fill_region_input = z.object({
  region: region3_schema,
  material: terrain_material,
  resolution: z.number().int().min(1).max(4).optional().default(4),
});

export const terrain_fill_ball_input = z.object({
  center: vector3_schema,
  radius: z.number().positive(),
  material: terrain_material,
});

export const terrain_fill_cylinder_input = z.object({
  center: vector3_schema,
  height: z.number().positive(),
  radius: z.number().positive(),
  material: terrain_material,
});

export const terrain_fill_wedge_input = z.object({
  region: region3_schema,
  material: terrain_material,
});

export const terrain_read_voxels_input = z.object({
  region: region3_schema,
  resolution: z.number().int().min(1).max(4).optional().default(4),
});

export const terrain_write_voxels_input = z.object({
  region: region3_schema,
  resolution: z.number().int().min(1).max(4).optional().default(4),
  materials: z.array(z.array(z.array(terrain_material))),
  occupancies: z.array(z.array(z.array(z.number().min(0).max(1)))),
});

export const terrain_clear_input = z.object({
  region: region3_schema.optional().describe('Region to clear. If omitted, clears all terrain'),
});

export const terrain_get_material_colors_input = z.object({});
