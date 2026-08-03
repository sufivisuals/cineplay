export type ToolType = 'select' | 'pencil' | 'arrow' | 'rectangle' | 'circle' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface BaseShape {
  id: string;
  type: ToolType;
  color: string;
  lineWidth: number;
}

export interface PencilShape extends BaseShape {
  type: 'pencil';
  points: Point[];
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  start: Point;
  end: Point;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  cx: number;
  cy: number;
  radius: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type Shape = PencilShape | ArrowShape | RectangleShape | CircleShape | TextShape;

export interface DrawingData {
  version: string;
  canvasWidth: number;
  canvasHeight: number;
  shapes: Shape[];
}
