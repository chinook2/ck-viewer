/**
 * @class Ck
 *
 * The Ck namespace (global object) encapsulates all classes, singletons, and
 * utility methods provided by Chinook's libraries 
 *
 * ## Application start 
 *
 * The main applications is initiated with Ext.application which is called once the DOM is ready.
 * Then call the main view {app}.view.main.Main which extend Ck.View the entry point of the 'ck-viewer' package.
 *
 * For example:
 *
 *     Ext.define('AppDemo.view.main.Main', {
 *         extend: 'Ck.View',
 *         xtype: 'app-main',
 *     	
 *     	requires: [
 *     		'AppDemo.view.main.MainController'
 *     	],
 *     	
 *     	controller: 'main'
 *     });
 *
 * ## URL Parameters
 *
 * The application can use URL Parameters to configure differents view.
 *
 *     - Ck.view.Controller
 *         - app : name of the layout to load
 *     - Ck.map.Controller
 *         - context : name of the context to load
 *     - Ck.Ajax
 *         - nocache : allow to reload the app and context from server (ignore LocalStorage)
 *
 * ## Next...
 * 
 * For a Web GIS package the most important view is Ck.Map and Ck.Legend.
 *
 * The Ck.Controller is also very important as a basis of all other controllers of the package.
 *
 * @singleton
 */
var Ck = Ck || {};

// @define Ck
Ext.apply(Ck, {
	
	/**
	 * Kernels list corresponding to effects
	 */
	kernelEffect: {
		none: [
			0, 0, 0,
			0, 1, 0,
			0, 0, 0
		],sharpen: [
			0, -1, 0,
			-1, 5, -1,
			0, -1, 0
		],sharpenless: [
			0, -1, 0,
			-1, 10, -1,
			0, -1, 0
		],blur: [
			1, 1, 1,
			1, 1, 1,
			1, 1, 1
		],shadow: [
			1, 2, 1,
			0, 1, 0,
			-1, -2, -1
		],emboss: [
			-2, 1, 0,
			-1, 1, 1,
			0, 1, 2
		],edge: [
			0, 1, 0,
			1, -4, 1,
			0, 1, 0
		]
	},
	
	/**
	 * @property params
	 * @type Object
	 * @readonly
	 * Global variable Ext.params of the current URL parameters
	 */
	params: {},
	
	/**
	 * @property actions
	 * @type Array
	 * @readonly
	 * Global array of avaible Ck.Action.
	 */
	actions: [],
	
	/**
	 * Called on app start.
	 * 
	 * Populate the Ck.params parameter.
	 */
	init: function() {
		Ck.params = Ext.Object.fromQueryString(location.search);
	},
	
	/**
	 * Adds a listener to be notified when the map is ready (before context and layers are loaded).
	 *
	 * @param {Function} fn The method to call.
	 * @param {Object} [scope] The scope (`this` reference) in which the handler function
	 * executes. Defaults to the browser window.
	 * @param {Object} [options] An object with extra options.
	 * @param {Number} [options.delay=0] A number of milliseconds to delay.
	 * @param {Number} [options.priority=0] Relative priority of this callback. A larger
	 * number will result in the callback being sorted before the others.	Priorities
	 * 1000 or greater and -1000 or lesser are reserved for internal framework use only.
	 */
	onReady: function(fn, scope, options) {
		Ext.on('ckmapReady', fn, scope, options);
	},
	
	/**
	 * Get all the maps avaible.
	 * @return {Ck.map.Controller[]} An array of map controllers
	 */
	getMaps: function() {
		// Return all maps components by CSS Selector
		var maps = Ext.query('.ck-map');
		for(m=0; m<maps.length; m++) {
			maps[m] = Ext.getCmp(maps[m].id).getController();
		}
		return maps;
	},
	
	/**
	 * Get the first map or a map by id.
	 * @param {string} [idMap] id of the map
	 * @return {Ck.map.Controller} the map controllers
	 */
	getMap: function(idMap) {
		var map;
		
		if(!idMap) {
			// Return the first map component by CSS Selector
			map = Ck.getMaps().shift();
			if(!map) return false;
		} else {
			// Return the map component by ID
			map = Ext.getCmp(idMap);
			if(!map) return false;
			map = map.getController();
		}
		
		return map;
	},
	
	
	/**
	 * Get informations of the package (from Ext.manifest).
	 *
	 *  - creator
	 *  - version
	 *  - environment
	 *
	 * @return {Object} The informations
	 */
	getInfos: function() {
		if(!Ext.manifest.packages) return {};
		return Ext.manifest.packages['ck-viewer'];
	},
	
	/**
	 * Get version of the package (from Ext.manifest).
	 * Also avaible with Ext.versions
	 *
	 * @return {String} The version number as string
	 */
	getVersion: function() {
		return this.getInfos().version;
	},
	
	/**
	 * Get execution environment (from Ext.manifest).
	 *
	 *  - production
	 *  - testing
	 *  - development
	 *
	 * @return {String} The environment
	 */
	getEnvironment: function() {
		return this.getInfos().environment;
	},
	
	/**
	 * Short alias of Ck.getEnvironment, get execution environment (from Ext.manifest).
	 *
	 *  - production
	 *  - testing
	 *  - development
	 *
	 * @return {String} The environment
	 */	
	getEnv: function() {
		return this.getEnvironment();
	},
	
	
	/**
	 * @inheritdoc Ext#log
	 */
	log: function(opt) {
		Ext.log(opt);
	},
	
	/**
	 * Alias for Ck.log({level:'error', ...}). Log a message with error level.
	 *
	 * Note : only accept a string (the error message). To use all the log options see Ck.log.
	 *
	 * This method does nothing in a release build.
	 *
	 * @param {String} msg The error message to log.
	 */
	error: function(msg) {
		Ext.log({
			level: 'error',
			msg: msg
		});
	},
	
	/**
	 * Create an object from a config object
	 * @param {String/Object}		Class name or config object. Config object must have "xtype" and "config" member
	 * @param {Object/undefined}	Config object if first param is a string
	 * @return {Object/False}		An instance of desired class or false if an error occurred
	 */
	create: function(cls, config) {
		if(typeof cls == "object") {
			cls = cls.xtype;
			config = cls.config || {}
		} else if(typeof cls == "string") {
			config = config || {};
		} else {
			Ck.error("Function signature not respected -> Ck.create({String/Object}, {Object})");
			return false;
		}
		
		var constructor = Ck.getClass(cls);
		
		if(typeof constructor == "function") {
			var lib = Ck.getOwnerLibrary(cls);
			switch(lib) {
				case "Ext":
					var obj = Ext.create(cls, config);
					break;
				default:
					var obj = new constructor(config);
			}
		} else {
			Ck.error("The class \"" + cls + "\" does not exists.");
			return false;
		}
		
		if(obj instanceof constructor) {				
			return obj;
		} else {
			Ck.error("Instanciation of the " + cls + " object failed.");
			return false;
		}
	},
	
	/**
	 * Return the owner library of a class
	 * @param {String}
	 * @return {String}
	 */
	getOwnerLibrary: function(className) {
		var namespaces = className.split(".");
		return namespaces[0];
	},
	
	/**
	 * Return the constructor of a class from a string or undefined if class does not exists
	 * @param {String} Name of the desired class
	 * @return {Function} Constructor of the desired class
	 **/
	getClass: function(className) {
		var namespaces = className.split(".");
		var windowSpace = window;
		for(var i=0; i<namespaces.length; i++) {
			if(typeof windowSpace[namespaces[i]] == "undefined") {
				return undefined;
			}
			windowSpace = windowSpace[namespaces[i]];
		}
		return windowSpace;
	},
	
	normalizeKernel: function(effectName) {
		var kernel = Ck.kernelEffect[effectName];
		if(!kernel) {
			return false;
		}
		var len = kernel.length;
		var normal = new Array(len);
		var i, sum = 0;
		for (i = 0; i < len; ++i) {
			sum += kernel[i];
		}
		if (sum <= 0) {
			normal.normalized = false;
			sum = 1;
		} else {
			normal.normalized = true;
		}
		for (i = 0; i < len; ++i) {
			normal[i] = kernel[i] / sum;
		}
		return normal;
	},
	
	/**
	 * Apply a convolution kernel to canvas.	This works for any size kernel, but
	 * performance starts degrading above 3 x 3.
	 * @param {CanvasRenderingContext2D} context Canvas 2d context.
	 * @param {Array.<number>} kernel Kernel.
	 */
	convolve: function(context, kernel) {
		var canvas = context.canvas;
		var width = canvas.width;
		var height = canvas.height;

		var size = Math.sqrt(kernel.length);
		var half = Math.floor(size / 2);

		var inputData = context.getImageData(0, 0, width, height).data;

		var output = context.createImageData(width, height);
		var outputData = output.data;

		for (var pixelY = 0; pixelY < height; ++pixelY) {
			var pixelsAbove = pixelY * width;
			for (var pixelX = 0; pixelX < width; ++pixelX) {
				var r = 0, g = 0, b = 0, a = 0;
				for (var kernelY = 0; kernelY < size; ++kernelY) {
					for (var kernelX = 0; kernelX < size; ++kernelX) {
						var weight = kernel[kernelY * size + kernelX];
						var neighborY = Math.min(
								height - 1, Math.max(0, pixelY + kernelY - half));
						var neighborX = Math.min(
								width - 1, Math.max(0, pixelX + kernelX - half));
						var inputIndex = (neighborY * width + neighborX) * 4;
						r += inputData[inputIndex] * weight;
						g += inputData[inputIndex + 1] * weight;
						b += inputData[inputIndex + 2] * weight;
						a += inputData[inputIndex + 3] * weight;
					}
				}
				var outputIndex = (pixelsAbove + pixelX) * 4;
				outputData[outputIndex] = r;
				outputData[outputIndex + 1] = g;
				outputData[outputIndex + 2] = b;
				outputData[outputIndex + 3] = kernel.normalized ? a : 255;
			}
		}
		context.putImageData(output, 0, 0);
	}
}).init();
