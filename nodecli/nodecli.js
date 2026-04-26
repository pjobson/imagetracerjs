#!/usr/bin/env node
"use strict";

var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;

var ImageTracer = require( __dirname + '/../imagetracer_v1.2.6' );

// This example uses https://github.com/arian/pngjs
// , but other libraries can be used to load an image file to an ImageData object.
var PNGReader = require( __dirname + '/PNGReader' );

// Argument definitions: [short, long, type, optionKey, description]
var argDefs = [
	// Output
	['-o', '--output',            'string', null,              'Output SVG file path (default: <input>.svg)'],
	['-h', '--help',              'flag',   null,              'Show this help message'],
	// Preset
	['-p', '--preset',            'string', 'preset',          'Use preset (default, posterized1, posterized2, posterized3, curvy, sharp, detailed, smoothed, grayscale, fixedpalette, randomsampling1, randomsampling2, artistic1, artistic2, artistic3, artistic4)'],
	// Tracing
	['-lt', '--ltres',            'float',  'ltres',           'Line threshold (default: 1)'],
	['-qt', '--qtres',            'float',  'qtres',           'Quadratic spline threshold (default: 1)'],
	['-po', '--pathomit',         'int',    'pathomit',        'Omit paths shorter than this (default: 8)'],
	['-c', '--cors',              'bool',   'corsenabled',     'Enable CORS (default: false)'],
	['-ra', '--right-angle',      'bool',   'rightangleenhance', 'Enhance right angles (default: true)'],
	// Color quantization
	['-cs', '--color-sampling',   'int',    'colorsampling',   'Color sampling (0=disabled, 1=random, 2=deterministic)'],
	['-n', '--colors',            'int',    'numberofcolors',  'Number of colors (default: 16)'],
	['-mr', '--min-ratio',        'float',  'mincolorratio',   'Min color ratio (default: 0)'],
	['-cq', '--color-quant',      'int',    'colorquantcycles', 'Color quantization cycles (default: 3)'],
	// Layering
	['-l', '--layering',          'string', 'layering',        'Layering method (sequential, parallel)'],
	// SVG rendering
	['-s', '--scale',             'float',  'scale',           'SVG scale (default: 1)'],
	['-sw', '--stroke-width',     'float',  'strokewidth',     'Stroke width (default: 1)'],
	['-lf', '--line-filter',      'bool',   'linefilter',      'Enable line filter (default: false)'],
	['-rc', '--round-coords',     'int',    'roundcoords',     'Decimal places for coords (default: 1)'],
	['-vb', '--viewbox',          'bool',   'viewbox',         'Use viewBox (default: false)'],
	['-d', '--desc',              'bool',   'desc',            'Add desc element (default: false)'],
	['-lc', '--lcpr',             'float',  'lcpr',            'Line control point radius (default: 0)'],
	['-qc', '--qcpr',             'float',  'qcpr',            'Quadratic control point radius (default: 0)'],
	// Blur
	['-br', '--blur-radius',      'int',    'blurradius',      'Blur radius (default: 0)'],
	['-bd', '--blur-delta',       'int',    'blurdelta',       'Blur delta (default: 20)']
];

function showHelp() {
	console.log('Usage: imagetracer [options] <input>');
	console.log('       imagetracer <input> [options]');
	console.log('');
	console.log('Trace raster images to SVG.');
	console.log('');
	console.log('Supported formats: PNG, JPG, GIF, BMP, TIFF, WEBP (non-PNG requires ImageMagick)');
	console.log('');
	console.log('Options:');
	argDefs.forEach(function(def) {
		var flags = def[0] + ', ' + def[1];
		var padding = 26 - flags.length;
		if (padding < 1) padding = 1;
		console.log('  ' + flags + ' '.repeat(padding) + def[4]);
	});
	console.log('');
	console.log('Examples:');
	console.log('  imagetracer input.png');
	console.log('  imagetracer input.png -o output.svg');
	console.log('  imagetracer -n 8 -s 2 input.png');
	console.log('  imagetracer input.png --preset posterized1');
}

function parseArgs(argv) {
	var args = argv.slice(2);
	var result = { options: {}, input: null, output: null };

	for (var i = 0; i < args.length; i++) {
		var arg = args[i];

		// Check for help
		if (arg === '-h' || arg === '--help') {
			showHelp();
			process.exit(0);
		}

		// Check if it's an option
		if (arg.startsWith('-')) {
			var def = argDefs.find(function(d) { return d[0] === arg || d[1] === arg; });
			if (!def) {
				console.error('Unknown option: ' + arg);
				console.error("Try 'imagetracer --help' for more information.");
				process.exit(1);
			}

			var type = def[2];
			var key = def[3];

			if (type === 'flag') {
				continue;
			}

			i++;
			if (i >= args.length) {
				console.error('Option ' + arg + ' requires an argument');
				process.exit(1);
			}

			var value = args[i];

			// Handle output file specially
			if (arg === '-o' || arg === '--output') {
				result.output = value;
				continue;
			}

			// Handle preset specially (replaces options object)
			if (key === 'preset') {
				result.preset = value;
				continue;
			}

			// Parse value based on type
			switch (type) {
				case 'int':
					result.options[key] = parseInt(value, 10);
					break;
				case 'float':
					result.options[key] = parseFloat(value);
					break;
				case 'bool':
					result.options[key] = (value.toLowerCase() === 'true' || value === '1');
					break;
				default:
					result.options[key] = value;
			}
		} else {
			// Positional argument (input file)
			if (result.input) {
				console.error('Multiple input files specified');
				process.exit(1);
			}
			result.input = arg;
		}
	}

	return result;
}

var parsed = parseArgs(process.argv);
var infilename = parsed.input;
var outfilename = parsed.output || (infilename ? infilename + '.svg' : null);
var options = parsed.preset || parsed.options;

// Check if input file was provided
if (!infilename) {
	showHelp();
	process.exit(1);
}

// Check if input file exists
if (!fs.existsSync(infilename)) {
	console.error('Error: File not found: ' + infilename);
	process.exit(1);
}

// Check if file is PNG or needs conversion
var ext = path.extname(infilename).toLowerCase();
var isPng = (ext === '.png');
var tempFile = null;
var pngFile = infilename;

if (!isPng) {
	// Check if ImageMagick is available
	try {
		execSync('which convert', { stdio: 'ignore' });
	} catch (e) {
		console.error('Error: ImageMagick is required for non-PNG files.');
		console.error('Install it with: sudo apt install imagemagick');
		process.exit(1);
	}

	// Create temp PNG file
	tempFile = '/tmp/imagetracer_' + process.pid + '_' + Date.now() + '.png';

	try {
		console.log('Converting ' + ext.slice(1).toUpperCase() + ' to PNG...');
		execSync('convert "' + infilename + '" PNG24:"' + tempFile + '"', { stdio: 'inherit' });
		pngFile = tempFile;
	} catch (e) {
		console.error('Error: Failed to convert image with ImageMagick.');
		console.error(e.message);
		process.exit(1);
	}
}

// Cleanup function for temp file
function cleanup() {
	if (tempFile && fs.existsSync(tempFile)) {
		fs.unlinkSync(tempFile);
	}
}

// Handle process exit
process.on('exit', cleanup);
process.on('SIGINT', function() { cleanup(); process.exit(1); });
process.on('SIGTERM', function() { cleanup(); process.exit(1); });

fs.readFile(

	pngFile, // Input file path (original or converted PNG)

	function( err, bytes ){
		if(err){
			console.error('Error reading file:', err.message);
			cleanup();
			process.exit(1);
		}

		var reader = new PNGReader(bytes);

		reader.parse( function( err, png ){
			if(err){
				console.error('Error parsing PNG:', err.message);
				cleanup();
				process.exit(1);
			}

			// creating an ImageData object
			var myImageData = { width:png.width, height:png.height, data:png.pixels };

			// tracing to SVG string
			var svgstring = ImageTracer.imagedataToSVG( myImageData, options );

			// writing to file
			fs.writeFile(
				outfilename, // Output file path
				svgstring,
				function(err){
					if(err){
						console.error('Error writing SVG:', err.message);
						cleanup();
						process.exit(1);
					}
					console.log(outfilename + ' was saved!');
					cleanup();
				}
			);

		});// End of reader.parse()

	}// End of readFile callback()

);// End of fs.readFile()
