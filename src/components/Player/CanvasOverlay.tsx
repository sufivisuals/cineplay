import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ToolType, Shape, Point } from '../../types/annotation';

interface CanvasOverlayProps {
  activeTool: ToolType;
  color: string;
  lineWidth: number;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  onPauseVideo: () => void;
  width: number;
  height: number;
  left?: number;
  top?: number;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  activeTool,
  color,
  lineWidth,
  shapes,
  onShapesChange,
  onPauseVideo,
  width,
  height,
  left = 0,
  top = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);

  // Redraw canvas whenever shapes or current preview shape changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allShapes = currentShape ? [...shapes, currentShape] : shapes;

    allShapes.forEach((shape) => {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (shape.type === 'pencil') {
        if (shape.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
      } else if (shape.type === 'arrow') {
        const { start, end } = shape;
        const headlen = 16; // length of head in pixels
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headlen * Math.cos(angle - Math.PI / 6),
          end.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          end.x - headlen * Math.cos(angle + Math.PI / 6),
          end.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.lineTo(end.x, end.y);
        ctx.fill();
      } else if (shape.type === 'rectangle') {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.arc(shape.cx, shape.cy, Math.abs(shape.radius), 0, 2 * Math.PI);
        ctx.stroke();
      } else if (shape.type === 'text') {
        ctx.font = `${shape.fontSize}px sans-serif`;
        ctx.fillText(shape.text, shape.x, shape.y);
      }
    });
  }, [shapes, currentShape]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;
    onPauseVideo();

    const startPos = getCanvasCoords(e);
    setIsDrawing(true);

    const id = `shape_${Date.now()}`;

    if (activeTool === 'pencil') {
      setCurrentShape({
        id,
        type: 'pencil',
        color,
        lineWidth,
        points: [startPos],
      });
    } else if (activeTool === 'arrow') {
      setCurrentShape({
        id,
        type: 'arrow',
        color,
        lineWidth,
        start: startPos,
        end: startPos,
      });
    } else if (activeTool === 'rectangle') {
      setCurrentShape({
        id,
        type: 'rectangle',
        color,
        lineWidth,
        x: startPos.x,
        y: startPos.y,
        width: 0,
        height: 0,
      });
    } else if (activeTool === 'circle') {
      setCurrentShape({
        id,
        type: 'circle',
        color,
        lineWidth,
        cx: startPos.x,
        cy: startPos.y,
        radius: 0,
      });
    } else if (activeTool === 'text') {
      const textPrompt = window.prompt('Enter note text on frame:');
      if (textPrompt) {
        const newTextShape: Shape = {
          id,
          type: 'text',
          color,
          lineWidth,
          x: startPos.x,
          y: startPos.y,
          text: textPrompt,
          fontSize: 20,
        };
        onShapesChange([...shapes, newTextShape]);
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentShape) return;
    const currentPos = getCanvasCoords(e);

    if (currentShape.type === 'pencil') {
      setCurrentShape({
        ...currentShape,
        points: [...currentShape.points, currentPos],
      });
    } else if (currentShape.type === 'arrow') {
      setCurrentShape({
        ...currentShape,
        end: currentPos,
      });
    } else if (currentShape.type === 'rectangle') {
      setCurrentShape({
        ...currentShape,
        width: currentPos.x - currentShape.x,
        height: currentPos.y - currentShape.y,
      });
    } else if (currentShape.type === 'circle') {
      const dx = currentPos.x - currentShape.cx;
      const dy = currentPos.y - currentShape.cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      setCurrentShape({
        ...currentShape,
        radius,
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentShape) {
      onShapesChange([...shapes, currentShape]);
      setCurrentShape(null);
    }
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width || 1280}
      height={height || 720}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={`canvas-overlay ${activeTool !== 'select' ? 'drawing-active' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};
