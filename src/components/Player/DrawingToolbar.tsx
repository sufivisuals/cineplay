import React from 'react';
import type { ToolType } from '../../types/annotation';
import { MousePointer, Pencil, ArrowUpRight, Square, Circle, Type, RotateCcw, Trash2 } from 'lucide-react';

interface DrawingToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  lineWidth: number;
  onChangeLineWidth: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  hasShapes: boolean;
}

const COLOR_SWATCHES = [
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ffffff', // White
];

const LINE_WIDTHS = [2, 4, 6, 8];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  activeColor,
  onSelectColor,
  lineWidth,
  onChangeLineWidth,
  onUndo,
  onClear,
  hasShapes,
}) => {
  return (
    <div className="drawing-toolbar">
      <div className="tool-group">
        <button
          className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          onClick={() => onSelectTool('select')}
          title="Pointer / View Mode"
        >
          <MousePointer className="tool-icon" />
        </button>

        <div className="tool-divider" />

        <button
          className={`tool-btn ${activeTool === 'pencil' ? 'active' : ''}`}
          onClick={() => onSelectTool('pencil')}
          title="Freehand Pencil"
        >
          <Pencil className="tool-icon" />
        </button>

        <button
          className={`tool-btn ${activeTool === 'arrow' ? 'active' : ''}`}
          onClick={() => onSelectTool('arrow')}
          title="Arrow Tool"
        >
          <ArrowUpRight className="tool-icon" />
        </button>

        <button
          className={`tool-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
          onClick={() => onSelectTool('rectangle')}
          title="Rectangle Tool"
        >
          <Square className="tool-icon" />
        </button>

        <button
          className={`tool-btn ${activeTool === 'circle' ? 'active' : ''}`}
          onClick={() => onSelectTool('circle')}
          title="Circle Tool"
        >
          <Circle className="tool-icon" />
        </button>

        <button
          className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          onClick={() => onSelectTool('text')}
          title="Text Note Tool"
        >
          <Type className="tool-icon" />
        </button>
      </div>

      <div className="tool-group">
        <div className="color-swatches">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              className={`color-swatch ${activeColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onSelectColor(color)}
            />
          ))}
        </div>

        <div className="stroke-selector">
          {LINE_WIDTHS.map((width) => (
            <button
              key={width}
              className={`stroke-btn ${lineWidth === width ? 'active' : ''}`}
              onClick={() => onChangeLineWidth(width)}
            >
              <span
                className="stroke-dot"
                style={{
                  width: `${width + 2}px`,
                  height: `${width + 2}px`,
                  backgroundColor: activeColor,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="tool-group">
        <button
          className="tool-btn action-btn"
          onClick={onUndo}
          disabled={!hasShapes}
          title="Undo Last Stroke"
        >
          <RotateCcw className="tool-icon" />
        </button>
        <button
          className="tool-btn action-btn danger"
          onClick={onClear}
          disabled={!hasShapes}
          title="Clear Canvas"
        >
          <Trash2 className="tool-icon" />
        </button>
      </div>
    </div>
  );
};
