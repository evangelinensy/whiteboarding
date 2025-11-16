'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Tool =
  | 'select'
  | 'rectangle'
  | 'text'
  | 'arrow'
  | 'ellipse'
  | 'pan';

interface Point {
  x: number;
  y: number;
}

interface ElementStyle {
  strokeColor: string;
  strokeWidth: number;
  fill: string;
  textSize: number;
  fontWeight: 'normal' | 'bold';
}

interface BaseElement {
  id: string;
  type: 'rect' | 'text' | 'arrow' | 'ellipse' | 'group';
  x: number;
  y: number;
  style: ElementStyle;
  groupId?: string;
}

interface RectElement extends BaseElement {
  type: 'rect';
  width: number;
  height: number;
}

interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  width: number;
  height: number;
}

interface ArrowElement extends BaseElement {
  type: 'arrow';
  x2: number;
  y2: number;
  fromElementId?: string;
  toElementId?: string;
}

interface EllipseElement extends BaseElement {
  type: 'ellipse';
  width: number;
  height: number;
}

interface GroupElement extends BaseElement {
  type: 'group';
  elementIds: string[];
  width: number;
  height: number;
}

type Element = RectElement | TextElement | ArrowElement | EllipseElement | GroupElement;

interface WhiteboardProps {
  onCanvasSummaryChange?: (summary: any) => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ onCanvasSummaryChange }) => {
  const [tool, setTool] = useState<Tool>('select');
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<Element[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentElement, setCurrentElement] = useState<Element | null>(null);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [viewOffset, setViewOffset] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [defaultStyle, setDefaultStyle] = useState<ElementStyle>({
    strokeColor: '#374151',
    strokeWidth: 2,
    fill: 'none',
    textSize: 14,
    fontWeight: 'normal',
  });
  const [marquee, setMarquee] = useState<{ start: Point; end: Point } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const svgRef = useRef<SVGSVGElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Update canvas summary whenever elements change
  useEffect(() => {
    const rectanglesCount = elements.filter((e) => e.type === 'rect').length;
    const textCount = elements.filter((e) => e.type === 'text').length;
    const arrowsCount = elements.filter((e) => e.type === 'arrow').length;
    const titles = elements
      .filter((e) => e.type === 'text')
      .slice(0, 5)
      .map((e) => (e as TextElement).text);

    onCanvasSummaryChange?.({
      elementsCount: elements.length,
      rectanglesCount,
      textCount,
      arrowsCount,
      titles,
    });
  }, [elements, onCanvasSummaryChange]);

  const addToHistory = useCallback((newElements: Element[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
    setElements(newElements);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  const getMousePosition = (e: React.MouseEvent<SVGSVGElement>): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewOffset.x) / zoom,
      y: (e.clientY - rect.top - viewOffset.y) / zoom,
    };
  };

  const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getElementBounds = (element: Element) => {
    if (element.type === 'rect' || element.type === 'ellipse') {
      return {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };
    } else if (element.type === 'text') {
      return {
        x: element.x,
        y: element.y,
        width: element.width || 100,
        height: element.height || 30,
      };
    } else if (element.type === 'arrow') {
      const minX = Math.min(element.x, element.x2);
      const minY = Math.min(element.y, element.y2);
      const maxX = Math.max(element.x, element.x2);
      const maxY = Math.max(element.y, element.y2);
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  };

  const isPointInElement = (point: Point, element: Element): boolean => {
    const bounds = getElementBounds(element);
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;

    const point = getMousePosition(e);

    // Handle pan with spacebar or pan tool
    if (e.shiftKey || tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === 'select') {
      // Check if clicking on a resize handle
      const selected = elements.filter((el) => selectedIds.includes(el.id));
      if (selected.length === 1) {
        const handle = getResizeHandle(point, selected[0]);
        if (handle) {
          setResizeHandle(handle);
          setIsDrawing(true);
          setStartPoint(point);
          return;
        }
      }

      // Check if clicking on existing element
      const clickedElement = [...elements]
        .reverse()
        .find((el) => isPointInElement(point, el));

      if (clickedElement) {
        if (!e.metaKey && !e.ctrlKey) {
          setSelectedIds([clickedElement.id]);
        } else {
          setSelectedIds((prev) =>
            prev.includes(clickedElement.id)
              ? prev.filter((id) => id !== clickedElement.id)
              : [...prev, clickedElement.id]
          );
        }
        const bounds = getElementBounds(clickedElement);
        setDragOffset({
          x: point.x - bounds.x,
          y: point.y - bounds.y,
        });
        setIsDrawing(true);
      } else {
        // Start marquee selection
        setSelectedIds([]);
        setMarquee({ start: point, end: point });
        setIsDrawing(true);
      }
    } else if (tool === 'text') {
      // Start creating text element
      const newText: TextElement = {
        id: generateId(),
        type: 'text',
        x: point.x,
        y: point.y,
        text: '',
        width: 100,
        height: 30,
        style: { ...defaultStyle },
      };
      setCurrentElement(newText);
      setEditingTextId(newText.id);
      setEditingText('');
      setIsDrawing(true);
    } else {
      // Start drawing shape or arrow
      setIsDrawing(true);
      setStartPoint(point);
    }
  };

  const getResizeHandle = (point: Point, element: Element): string | null => {
    const bounds = getElementBounds(element);
    const handleSize = 8 / zoom;
    const handles = [
      { name: 'nw', x: bounds.x, y: bounds.y },
      { name: 'ne', x: bounds.x + bounds.width, y: bounds.y },
      { name: 'sw', x: bounds.x, y: bounds.y + bounds.height },
      { name: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    ];

    for (const handle of handles) {
      if (
        Math.abs(point.x - handle.x) < handleSize &&
        Math.abs(point.y - handle.y) < handleSize
      ) {
        return handle.name;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const point = getMousePosition(e);

    if (isPanning && panStart) {
      setViewOffset((prev) => ({
        x: prev.x + (e.clientX - panStart.x),
        y: prev.y + (e.clientY - panStart.y),
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawing || !startPoint) return;

    if (tool === 'select') {
      if (resizeHandle) {
        // Resize selected element
        const selected = elements.find((el) => selectedIds.includes(el.id));
        if (selected && (selected.type === 'rect' || selected.type === 'ellipse')) {
          const updated = elements.map((el) => {
            if (el.id === selected.id) {
              const bounds = getElementBounds(el);
              let newX = bounds.x;
              let newY = bounds.y;
              let newWidth = bounds.width;
              let newHeight = bounds.height;

              if (resizeHandle.includes('e')) {
                newWidth = Math.max(10, point.x - bounds.x);
              }
              if (resizeHandle.includes('w')) {
                newWidth = Math.max(10, bounds.x + bounds.width - point.x);
                newX = point.x;
              }
              if (resizeHandle.includes('s')) {
                newHeight = Math.max(10, point.y - bounds.y);
              }
              if (resizeHandle.includes('n')) {
                newHeight = Math.max(10, bounds.y + bounds.height - point.y);
                newY = point.y;
              }

              return {
                ...el,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
              } as Element;
            }
            return el;
          });
          setElements(updated);
        }
      } else if (marquee) {
        // Update marquee
        setMarquee({ start: marquee.start, end: point });
      } else if (dragOffset) {
        // Move selected elements
        const dx = point.x - dragOffset.x - getElementBounds(elements.find((el) => selectedIds.includes(el.id))!).x;
        const dy = point.y - dragOffset.y - getElementBounds(elements.find((el) => selectedIds.includes(el.id))!).y;

        const updated = elements.map((el) => {
          if (selectedIds.includes(el.id)) {
            if (el.type === 'arrow') {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
                x2: el.x2 + dx,
                y2: el.y2 + dy,
              };
            } else {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
              };
            }
          }
          return el;
        });
        setElements(updated);
        setStartPoint(point);
      }
    } else if (tool === 'rectangle') {
      const width = point.x - startPoint.x;
      const height = point.y - startPoint.y;
      const newRect: RectElement = {
        id: currentElement?.id || generateId(),
        type: 'rect',
        x: width < 0 ? point.x : startPoint.x,
        y: height < 0 ? point.y : startPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
        style: { ...defaultStyle },
      };
      setCurrentElement(newRect);
    } else if (tool === 'ellipse') {
      const width = point.x - startPoint.x;
      const height = point.y - startPoint.y;
      const newEllipse: EllipseElement = {
        id: currentElement?.id || generateId(),
        type: 'ellipse',
        x: width < 0 ? point.x : startPoint.x,
        y: height < 0 ? point.y : startPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
        style: { ...defaultStyle },
      };
      setCurrentElement(newEllipse);
    } else if (tool === 'arrow') {
      const newArrow: ArrowElement = {
        id: currentElement?.id || generateId(),
        type: 'arrow',
        x: startPoint.x,
        y: startPoint.y,
        x2: point.x,
        y2: point.y,
        style: { ...defaultStyle },
      };
      setCurrentElement(newArrow);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (resizeHandle) {
      addToHistory([...elements]);
      setResizeHandle(null);
    } else if (marquee) {
      // Select elements in marquee
      const minX = Math.min(marquee.start.x, marquee.end.x);
      const minY = Math.min(marquee.start.y, marquee.end.y);
      const maxX = Math.max(marquee.start.x, marquee.end.x);
      const maxY = Math.max(marquee.start.y, marquee.end.y);

      const selected = elements.filter((el) => {
        const bounds = getElementBounds(el);
        return (
          bounds.x >= minX &&
          bounds.y >= minY &&
          bounds.x + bounds.width <= maxX &&
          bounds.y + bounds.height <= maxY
        );
      });

      setSelectedIds(selected.map((el) => el.id));
      setMarquee(null);
    } else if (currentElement && tool !== 'text') {
      addToHistory([...elements, currentElement]);
      setCurrentElement(null);
    } else if (dragOffset && tool === 'select') {
      addToHistory([...elements]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setDragOffset(null);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in text input
      if (editingTextId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          const newElements = elements.filter((el) => !selectedIds.includes(el.id));
          addToHistory(newElements);
          setSelectedIds([]);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'v') {
        setTool('select');
      } else if (e.key === 'r') {
        setTool('rectangle');
      } else if (e.key === 't') {
        setTool('text');
      } else if (e.key === 'a') {
        setTool('arrow');
      } else if (e.key === ' ') {
        e.preventDefault();
        setTool('pan');
      }
    },
    [selectedIds, elements, addToHistory, undo, redo, editingTextId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [editingTextId]);

  const handleTextSubmit = () => {
    if (editingTextId && editingText.trim()) {
      const newText: TextElement = {
        id: editingTextId,
        type: 'text',
        x: currentElement?.x || 0,
        y: currentElement?.y || 0,
        text: editingText,
        width: editingText.length * 8,
        height: 30,
        style: { ...defaultStyle },
      };
      addToHistory([...elements, newText]);
    }
    setEditingTextId(null);
    setEditingText('');
    setCurrentElement(null);
  };

  const bringToFront = () => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    const rest = elements.filter((el) => !selectedIds.includes(el.id));
    addToHistory([...rest, ...selected]);
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    const rest = elements.filter((el) => !selectedIds.includes(el.id));
    addToHistory([...selected, ...rest]);
  };

  const exportPNG = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 1920;
      canvas.height = 1080;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = 'whiteboard.png';
          link.href = pngUrl;
          link.click();
          URL.revokeObjectURL(pngUrl);
        }
      });
    };

    img.src = url;
  };

  const resetView = () => {
    setViewOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-100 border-b border-gray-300 flex-wrap">
        <div className="flex gap-1 border-r pr-2 border-gray-300">
          <button
            onClick={() => setTool('select')}
            className={`px-3 py-1 rounded ${tool === 'select' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Select (V)"
          >
            Select
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`px-3 py-1 rounded ${tool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Rectangle (R)"
          >
            Rectangle
          </button>
          <button
            onClick={() => setTool('ellipse')}
            className={`px-3 py-1 rounded ${tool === 'ellipse' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Ellipse"
          >
            Ellipse
          </button>
          <button
            onClick={() => setTool('text')}
            className={`px-3 py-1 rounded ${tool === 'text' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Text (T)"
          >
            Text
          </button>
          <button
            onClick={() => setTool('arrow')}
            className={`px-3 py-1 rounded ${tool === 'arrow' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Arrow (A)"
          >
            Arrow
          </button>
          <button
            onClick={() => setTool('pan')}
            className={`px-3 py-1 rounded ${tool === 'pan' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Pan (Space)"
          >
            Pan
          </button>
        </div>

        <div className="flex gap-1 border-r pr-2 border-gray-300">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="px-3 py-1 rounded bg-white hover:bg-gray-200 disabled:opacity-50"
            title="Undo (Cmd/Ctrl+Z)"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="px-3 py-1 rounded bg-white hover:bg-gray-200 disabled:opacity-50"
            title="Redo (Cmd/Ctrl+Shift+Z)"
          >
            Redo
          </button>
        </div>

        <div className="flex gap-1 border-r pr-2 border-gray-300">
          <button
            onClick={bringToFront}
            disabled={selectedIds.length === 0}
            className="px-3 py-1 rounded bg-white hover:bg-gray-200 disabled:opacity-50 text-sm"
          >
            To Front
          </button>
          <button
            onClick={sendToBack}
            disabled={selectedIds.length === 0}
            className="px-3 py-1 rounded bg-white hover:bg-gray-200 disabled:opacity-50 text-sm"
          >
            To Back
          </button>
        </div>

        <div className="flex gap-1 border-r pr-2 border-gray-300">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="px-3 py-1 rounded bg-white hover:bg-gray-200 text-sm"
          >
            Grid: {showGrid ? 'On' : 'Off'}
          </button>
          <button onClick={resetView} className="px-3 py-1 rounded bg-white hover:bg-gray-200 text-sm">
            Reset View
          </button>
        </div>

        <div className="flex gap-1">
          <button
            onClick={exportPNG}
            className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 text-sm"
          >
            Export PNG
          </button>
        </div>

        <div className="text-sm text-gray-600 ml-auto">
          Zoom: {Math.round(zoom * 100)}% | Elements: {elements.length}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: tool === 'pan' || isPanning ? 'grab' : 'crosshair' }}
        >
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${viewOffset.x},${viewOffset.y}) scale(${zoom})`}
            >
              <circle cx="1" cy="1" r="1" fill="#e5e7eb" />
            </pattern>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
            </marker>
          </defs>

          {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}

          <g transform={`translate(${viewOffset.x},${viewOffset.y}) scale(${zoom})`}>
            {/* Render elements */}
            {elements.map((element) => {
              const isSelected = selectedIds.includes(element.id);
              if (element.type === 'rect') {
                return (
                  <rect
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    fill={element.style.fill}
                    stroke={isSelected ? '#3b82f6' : element.style.strokeColor}
                    strokeWidth={element.style.strokeWidth}
                  />
                );
              } else if (element.type === 'ellipse') {
                return (
                  <ellipse
                    key={element.id}
                    cx={element.x + element.width / 2}
                    cy={element.y + element.height / 2}
                    rx={element.width / 2}
                    ry={element.height / 2}
                    fill={element.style.fill}
                    stroke={isSelected ? '#3b82f6' : element.style.strokeColor}
                    strokeWidth={element.style.strokeWidth}
                  />
                );
              } else if (element.type === 'text') {
                return (
                  <text
                    key={element.id}
                    x={element.x}
                    y={element.y + 20}
                    fontSize={element.style.textSize}
                    fontWeight={element.style.fontWeight}
                    fill={element.style.strokeColor}
                    stroke={isSelected ? '#3b82f6' : 'none'}
                    strokeWidth={0.5}
                  >
                    {element.text}
                  </text>
                );
              } else if (element.type === 'arrow') {
                return (
                  <line
                    key={element.id}
                    x1={element.x}
                    y1={element.y}
                    x2={element.x2}
                    y2={element.y2}
                    stroke={isSelected ? '#3b82f6' : element.style.strokeColor}
                    strokeWidth={element.style.strokeWidth}
                    markerEnd="url(#arrowhead)"
                  />
                );
              }
              return null;
            })}

            {/* Render current drawing element */}
            {currentElement && (
              <>
                {currentElement.type === 'rect' && (
                  <rect
                    x={currentElement.x}
                    y={currentElement.y}
                    width={(currentElement as RectElement).width}
                    height={(currentElement as RectElement).height}
                    fill={currentElement.style.fill}
                    stroke={currentElement.style.strokeColor}
                    strokeWidth={currentElement.style.strokeWidth}
                    opacity={0.7}
                  />
                )}
                {currentElement.type === 'ellipse' && (
                  <ellipse
                    cx={currentElement.x + (currentElement as EllipseElement).width / 2}
                    cy={currentElement.y + (currentElement as EllipseElement).height / 2}
                    rx={(currentElement as EllipseElement).width / 2}
                    ry={(currentElement as EllipseElement).height / 2}
                    fill={currentElement.style.fill}
                    stroke={currentElement.style.strokeColor}
                    strokeWidth={currentElement.style.strokeWidth}
                    opacity={0.7}
                  />
                )}
                {currentElement.type === 'arrow' && (
                  <line
                    x1={currentElement.x}
                    y1={currentElement.y}
                    x2={(currentElement as ArrowElement).x2}
                    y2={(currentElement as ArrowElement).y2}
                    stroke={currentElement.style.strokeColor}
                    strokeWidth={currentElement.style.strokeWidth}
                    markerEnd="url(#arrowhead)"
                    opacity={0.7}
                  />
                )}
              </>
            )}

            {/* Render selection handles */}
            {selectedIds.length === 1 &&
              (() => {
                const selected = elements.find((el) => selectedIds.includes(el.id));
                if (!selected) return null;
                const bounds = getElementBounds(selected);
                const handleSize = 8 / zoom;
                return (
                  <g>
                    <rect
                      x={bounds.x - 2}
                      y={bounds.y - 2}
                      width={bounds.width + 4}
                      height={bounds.height + 4}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={1 / zoom}
                      strokeDasharray="4"
                    />
                    {['nw', 'ne', 'sw', 'se'].map((pos) => {
                      let x = bounds.x;
                      let y = bounds.y;
                      if (pos.includes('e')) x += bounds.width;
                      if (pos.includes('s')) y += bounds.height;
                      return (
                        <rect
                          key={pos}
                          x={x - handleSize / 2}
                          y={y - handleSize / 2}
                          width={handleSize}
                          height={handleSize}
                          fill="white"
                          stroke="#3b82f6"
                          strokeWidth={1 / zoom}
                        />
                      );
                    })}
                  </g>
                );
              })()}

            {/* Render marquee */}
            {marquee && (
              <rect
                x={Math.min(marquee.start.x, marquee.end.x)}
                y={Math.min(marquee.start.y, marquee.end.y)}
                width={Math.abs(marquee.end.x - marquee.start.x)}
                height={Math.abs(marquee.end.y - marquee.start.y)}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth={1 / zoom}
                strokeDasharray="4"
              />
            )}
          </g>
        </svg>

        {/* Text input overlay */}
        {editingTextId && currentElement && (
          <div
            style={{
              position: 'absolute',
              left: viewOffset.x + currentElement.x * zoom,
              top: viewOffset.y + currentElement.y * zoom,
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTextSubmit();
                } else if (e.key === 'Escape') {
                  setEditingTextId(null);
                  setCurrentElement(null);
                }
              }}
              onBlur={handleTextSubmit}
              className="px-2 py-1 border-2 border-blue-500 rounded"
              placeholder="Type text..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Whiteboard;
