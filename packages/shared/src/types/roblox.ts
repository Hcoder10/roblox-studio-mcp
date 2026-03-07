// Roblox-specific type definitions for serialization

export interface SerializedInstance {
  class_name: string;
  name: string;
  path: string;
  properties: Record<string, SerializedValue>;
  children?: SerializedInstance[];
}

export type SerializedValue =
  | string
  | number
  | boolean
  | null
  | SerializedVector3
  | SerializedCFrame
  | SerializedColor3
  | SerializedUDim2
  | SerializedEnum
  | SerializedValue[];

export interface SerializedVector3 {
  _type: 'Vector3';
  x: number;
  y: number;
  z: number;
}

export interface SerializedCFrame {
  _type: 'CFrame';
  position: SerializedVector3;
  rotation: [number, number, number, number, number, number, number, number, number];
}

export interface SerializedColor3 {
  _type: 'Color3';
  r: number;
  g: number;
  b: number;
}

export interface SerializedUDim2 {
  _type: 'UDim2';
  x_scale: number;
  x_offset: number;
  y_scale: number;
  y_offset: number;
}

export interface SerializedEnum {
  _type: 'Enum';
  enum_type: string;
  value: string;
}

export interface ScriptInfo {
  path: string;
  class_name: 'Script' | 'LocalScript' | 'ModuleScript';
  source: string;
  enabled: boolean;
  run_context?: string;
}

export interface PlaytestStatus {
  is_running: boolean;
  mode?: 'play' | 'run' | 'server';
  elapsed_seconds?: number;
  player_count?: number;
}

export interface DiagnosticStats {
  fps: number;
  ping_ms?: number;
  memory_mb: number;
  instance_count: number;
  physics_step_ms?: number;
  render_time_ms?: number;
}
