# ImageTracer CLI

Command-line interface for tracing raster images to SVG.

## Installation

```bash
npm install
```

### Optional: ImageMagick

For non-PNG image support (JPG, GIF, BMP, TIFF, WEBP), install ImageMagick:

```bash
# Debian/Ubuntu
sudo apt install imagemagick

# macOS
brew install imagemagick

# Fedora/RHEL
sudo dnf install ImageMagick
```

## Supported Formats

- **PNG** - Native support
- **JPG/JPEG** - Requires ImageMagick
- **GIF** - Requires ImageMagick
- **BMP** - Requires ImageMagick
- **TIFF** - Requires ImageMagick
- **WEBP** - Requires ImageMagick

## Usage

```bash
./imagetracer [options] <input>
./imagetracer <input> [options]
```

## Options

### Output

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output SVG file path (default: `<input>.svg`) |
| `-h, --help` | Show help message |

### Presets

| Option | Description |
|--------|-------------|
| `-p, --preset <name>` | Use a preset configuration |

Available presets:
- `default` - Default settings
- `posterized1`, `posterized2`, `posterized3` - Posterized effects
- `curvy` - Smoother curves
- `sharp` - Sharp edges
- `detailed` - More detail preservation
- `smoothed` - Smoothed output
- `grayscale` - Grayscale output
- `fixedpalette` - Fixed color palette
- `randomsampling1`, `randomsampling2` - Random color sampling
- `artistic1`, `artistic2`, `artistic3`, `artistic4` - Artistic effects

### Tracing

| Option | Description |
|--------|-------------|
| `-lt, --ltres <float>` | Line threshold (default: 1) |
| `-qt, --qtres <float>` | Quadratic spline threshold (default: 1) |
| `-po, --pathomit <int>` | Omit paths shorter than this value (default: 8) |
| `-c, --cors <bool>` | Enable CORS (default: false) |
| `-ra, --right-angle <bool>` | Enhance right angles (default: true) |

### Color Quantization

| Option | Description |
|--------|-------------|
| `-cs, --color-sampling <int>` | Color sampling method: 0=disabled, 1=random, 2=deterministic |
| `-n, --colors <int>` | Number of colors (default: 16) |
| `-mr, --min-ratio <float>` | Minimum color ratio (default: 0) |
| `-cq, --color-quant <int>` | Color quantization cycles (default: 3) |

### Layering

| Option | Description |
|--------|-------------|
| `-l, --layering <method>` | Layering method: `sequential` or `parallel` |

### SVG Rendering

| Option | Description |
|--------|-------------|
| `-s, --scale <float>` | SVG scale factor (default: 1) |
| `-sw, --stroke-width <float>` | Stroke width (default: 1) |
| `-lf, --line-filter <bool>` | Enable line filter (default: false) |
| `-rc, --round-coords <int>` | Decimal places for coordinates (default: 1) |
| `-vb, --viewbox <bool>` | Use viewBox attribute (default: false) |
| `-d, --desc <bool>` | Add desc element to SVG (default: false) |
| `-lc, --lcpr <float>` | Line control point radius (default: 0) |
| `-qc, --qcpr <float>` | Quadratic control point radius (default: 0) |

### Blur

| Option | Description |
|--------|-------------|
| `-br, --blur-radius <int>` | Blur radius (default: 0) |
| `-bd, --blur-delta <int>` | Blur delta (default: 20) |

## Examples

Basic usage:
```bash
./imagetracer input.png
```

Convert a JPEG:
```bash
./imagetracer photo.jpg
```

Specify output file:
```bash
./imagetracer input.png -o output.svg
```

Use a preset:
```bash
./imagetracer input.png --preset posterized1
```

Reduce colors and scale up:
```bash
./imagetracer input.png -n 8 -s 2
```

Options before input file:
```bash
./imagetracer -n 4 --scale 1.5 input.png
```

Detailed trace with more colors:
```bash
./imagetracer input.png -n 32 -lt 0.5 -qt 0.5 -po 4
```

Artistic effect with blur:
```bash
./imagetracer input.png --preset artistic1 --blur-radius 2
```
