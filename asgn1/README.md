# Assignment 1: Painting Application

**Name:** Tenzin Lekphel  
**Email:** ftenzinl@ucsc.edu

## Description
This is a WebGL-based painting application that allows users to draw geometric shapes (squares, triangles, and circles) on a canvas.

## Features

### Basic Features
- **Canvas Drawing**: Click or drag to draw shapes on a 400x400 WebGL canvas
- **Shape Types**: Choose between Squares, Triangles, and Circles
- **Color Control**: RGB sliders to customize shape colors (0.0 to 1.0 range)
- **Size Control**: Slider to adjust shape size (5 to 50 pixels)
- **Circle Segments**: Control the number of segments for circles (3 to 20)
- **Alpha Transparency**: NEW! Slider to control transparency (0.0 to 1.0)
- **Clear Canvas**: Button to clear all shapes

### Creative Feature: Draw My Picture (TL Initials)
Button that programmatically draws a mountain landscape featuring the initials "TL":
- **Letter T**: 8 green mountain-shaped triangles (3 peaks for horizontal bar + 5 for vertical stem)
- **Letter L**: 9 orange/brown mountain triangles (5 vertical + 4 horizontal)
- **Background**: 3 large decorative mountains with transparency
- **Sun**: 6 yellow triangles arranged in hexagonal pattern
- **Ground**: 4 dark green triangles forming the ground
- **Total**: 30 triangles with custom vertex coordinates
- Each triangle uses specific vertex positions via `drawTriangle([x1,y1,x2,y2,x3,y3])`

### Awesomeness Feature: Alpha Transparency! 🌟
Added a transparency slider that enables semi-transparent painting:
- Allows creating beautiful layering and depth effects
- Works with all shape types (squares, triangles, circles)  
- WebGL alpha blending enabled for proper transparency rendering
- Creates watercolor-like painting effects when shapes overlap

## How to Run
1. Open `src/asg1.html` in a WebGL-compatible browser
2. Click on the canvas to draw individual shapes
3. Drag on the canvas to draw continuously
4. Use the controls to change drawing mode, colors, and size
5. Click "Draw My Picture (TL Initials)" to see the programmatic artwork

## Technical Details
- Uses WebGL for hardware-accelerated rendering
- Vertex shader handles position and point size
- Fragment shader handles color with alpha channel support
- Shapes stored in array and re-rendered on each update
- Mouse coordinates converted from canvas space to WebGL clip space (-1 to 1)
- Circles rendered using triangle fan approach
- Squares rendered using two triangles
- **Custom triangle vertices**: Picture uses `drawTriangle()` with specific x,y coordinates for each vertex
- Alpha blending enabled: `gl.enable(gl.BLEND)` with `gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)`

## Files
- `src/asg1.html` - HTML interface with canvas and controls
- `src/asg1.js` - JavaScript implementation with WebGL and shape classes
- `lib/` - WebGL utility libraries (cuon-utils, webgl-utils, cuon-matrix)

## Notes
The personalized artwork integrates my initials (T and L) as mountain shapes using custom triangle vertices. Each triangle in the picture has specific coordinates for its three vertices, not using the basic Triangle class. The design creates a landscape where the mountains form the letters "TL". 

The awesomeness feature (alpha transparency) enhances the painting experience by allowing layered, semi-transparent drawing effects similar to watercolor painting.
