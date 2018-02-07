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
 *	 Ext.define('AppDemo.view.main.Main', {
 *		 extend: 'Ck.View',
 *		 xtype: 'app-main',
 *
 *	 	requires: [
 *	 		'AppDemo.view.main.MainController'
 *	 	],
 *
 *	 	controller: 'main'
 *	 });
 *
 * ## URL Parameters
 *
 * The application can use URL Parameters to configure differents view.
 *
 *	 - Ck.view.Controller
 *		 - app : name of the layout to load
 *	 - Ck.map.Controller
 *		 - context : name of the context to load
 *	 - Ck.Ajax
 *		 - nocache : allow to reload the app and context from server (ignore LocalStorage)
 *
 * ## Next...
 *
 * For a Web GIS package the most important view is Ck.Map and Ck.Legend.
 *
 * The Ck.Controller is also very important as a basis of all other controllers of the package.
 *
 * @singleton
 */
String.prototype.stripExtension = function() {
	return this.substr(0, this.lastIndexOf("."));
};

Math.closest = function(num, arr) {
	var curr = arr[0];
	var diff = Math.abs (num - curr);
	for(var val = 0; val < arr.length; val++) {
		var newdiff = Math.abs (num - arr[val]);
		if(newdiff < diff) {
			diff = newdiff;
			curr = arr[val];
		}
	}
	return curr;
};

var Ck = Ck || {};

// @define Ck
Ext.apply(Ck, {

	CM_PER_INCH: 2.54,
	DOTS_PER_INCH: 96,

	INCHES_PER_UNIT: {
		"50kilometers": 1968500,
		"150kilometers": 5905500,
		"BenoitChain": 791.9977268035781,
		"BenoitLink": 7.919977268035781,
		"Brealey": 14763.75,
		"CaGrid": 39.359685060000004,
		"CapeFoot": 11.999868185255002,
		"Centimeter": 0.3937,
		"ClarkeChain": 791.991309620512,
		"ClarkeFoot": 11.999868327581488,
		"ClarkeLink": 7.91991309620512,
		"Decameter": 393.7,
		"Decimeter": 3.9370000000000003,
		"Dekameter": 393.7,
		"Fathom": 71.999856,
		"Foot": 12,
		"Furlong": 7919.999999999997,
		"GermanMeter": 39.370535294205006,
		"GoldCoastFoot": 11.999964589846002,
		"GunterChain": 792.0000000000001,
		"GunterLink": 7.920000000000001,
		"Hectometer": 3937,
		"IFoot": 11.999976,
		"IInch": 0.9999979999999999,
		"IMile": 63359.87328,
		"IYard": 35.999928,
		"Inch": 1,
		"IndianFoot": 11.9999567087,
		"IndianFt37": 11.9999134017,
		"IndianFt62": 11.999960252000001,
		"IndianFt75": 11.999956315,
		"IndianYard": 35.99987015540864,
		"IndianYd37": 35.999740205100004,
		"IndianYd62": 35.999880755999996,
		"IndianYd75": 35.999868945,
		"IntnlChain": 791.998416,
		"IntnlLink": 7.91998416,
		"Kilometer": 39370,
		"Lat-66": 4367838.370169282,
		"Lat-83": 4367954.152606599,
		"Meter": 39.37,
		"Mil": 9.99998e-7,
		"MicroInch": 0.000999998,
		"Mile": 63360,
		"Millimeter": 0.03937,
		"ModAmFt": 12.000458400000001,
		"NautM": 72913.24,
		"NautM-UK": 72959.85408,
		"Perch": 198.00000000000014,
		"Pole": 198.00000000000014,
		"Rod": 198.00000000000014,
		"Rood": 148.75036777426,
		"SearsChain": 791.9970428354235,
		"SearsFoot": 11.999955194477684,
		"SearsLink": 7.919970428354236,
		"SearsYard": 35.99986558343306,
		"Yard": 36,
		"ch": 791.998416,
		"cm": 0.3937,
		"dd": 4374754,
		"deg": 4374754,
		"degre": 4374754,
		"degree": 4374754,
		"degrees": 4374754,
		"dm": 3936.9999999999995,
		"fath": 71.999856,
		"ft": 12,
		"gon": 4860837.777777778,
		"in": 1,
		"inches": 1,
		"ind-ch": 791.9942845122,
		"ind-ft": 11.9999134017,
		"ind-yd": 35.999740205100004,
		"km": 39370,
		"kmi": 72913.23999999999,
		"link": 7.91998416,
		"m": 39.37,
		"meter": 39.37,
		"meters": 39.37,
		"metre": 39.37,
		"metres": 39.37,
		"mi": 63360,
		"mm": 0.039369999999999995,
		"nmi": 72913.23999999999,
		"rad": 76353.86126479201,
		"us-ch": 792.0000000000001,
		"us-ft": 12,
		"us-in": 1,
		"us-mi": 63360,
		"us-yd": 36,
		"yd": 36
	},

	/**
	 * Known page size in millimeters
	 */
	pageSize: {
		"a0": [841, 1189],
		"a1": [594, 841],
		"a2": [420, 594],
		"a3": [297, 420],
		"a4": [210, 297],
		"a5": [148, 210],
		"a6": [105, 148],
		"a7": [74, 105],
		"a8": [52, 74]
	},

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

	defaults: {
		version: {
			wfs	: "1.1.0",
			wms	: "1.1.0"
		},
		srs		: "EPSG:4326",
		crs		: "EPSG:4326",
		extent	: [-180,-90,180,90]
	},

	codeOperation: {
		wfs		: "http://www.opengis.net/spec/owc-wfs/1.0/req/wfs",
		wms		: "http://www.opengis.net/spec/owc-geojson/1.0/req/wms"
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

		// Init for templating
		if (Ext.manifest.ckClient) {
			var l = window.location;
			if(!l.origin) {
				l.origin = l.protocol + '//' + l.host;
			}
			Ext.manifest.ckClient.location = l;
		}
	},

	/**
	 * Adds a listener to be notified when the map is ready (before context and layers are loaded).
	 * If the map is already ready call the callback.
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
		var m = this.getMap();
		if (m && m.ready === true) {
			fn.apply(scope, [m]);
		} else {
			Ext.on('ckmapReady', fn, scope, options);
		}
	},

	/**
	 * Adds a listener to be notified when the map is loaded (when context and layers are loaded).
	 * If the map is already loaded call the callback.
	 *
	 * [onLoaded description]
	 * @param  {Function} fn	  [description]
	 * @param  {[type]}   scope   [description]
	 * @param  {[type]}   options [description]
	 * @return {[type]}		   [description]
	 */
	onLoaded: function (fn, scope, options) {
		var m = this.getMap();
		if (m && m.loaded === true) {
			fn.apply(scope, [m]);
		} else {
			Ext.on('ckmapLoaded', fn, scope, options);
		}
	},

	/**
	 * Get all the maps avaible.
	 * @return {Ck.map.Controller[]} An array of map controllers
	 */
	getMaps: function() {
		// Return all maps components by CSS Selector
		var maps = Ext.query('.ck-map');
		for(var m=0; m<maps.length; m++) {
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
	 * Get action by widget name (eg: ckmapMeasure).
	 * @param  {String} widget name of the action
	 * @param  {Ck.Map} map    optional. map instance for the action
	 * @return {Ck.Action}        [description]
	 */
	getAction: function(widget, map) {
		var a;

		// Try to find direct by index when map is not defined
		if(!map) {
			a = Ck.actions[widget];
			if(a) return a;
		}

		// index can include itemId to make it unique
		// try to find only with ckAction name
		for(var an in Ck.actions) {
			a = Ck.actions[an];
			if (a.ckAction === widget) {
				if (map) {
					// If map instance return the action associated to the map
					var aMap = a.getMap();
					if (aMap && aMap.getId() === map.getId()) {
						return a;
					}
				} else {
					return a;
				}
			}
		}

		return false;
	},

	/**
	 * Get action(s) by widget name (eg: ckmapMeasure). Wildcard allowed
	 * @param  {String} widget name of the action
	 * @param  {Ck.Map} map    optional. map instance for the action
	 * @return {Ck.Action}        [description]
	 */
	getActions: function(widget, map) {
		var a;

		// Try to find direct by index when map is not defined
		if(!map) {
			a = Ck.actions[widget];
			if(a) return a;
		}

		// Use regExp to allow wildcard and allow table of result
		var arrAct = [];
		widget = new RegExp("^" + widget);

		// index can include itemId to make it unique
		// try to find only with ckAction name
		for(var an in Ck.actions) {
			a = Ck.actions[an];
			if(a.ckAction.match(widget) != null) {
				if (map) {
					// If map instance return the action associated to the map
					var aMap = a.getMap();
					if (aMap && aMap.getId() === map.getId()) {
						arrAct.push(a);
					}
				} else {
					arrAct.push(a);
				}
			}
		}

		if(arrAct.length == 0) {
			return false
		} else if(arrAct.length == 1) {
			return arrAct[1];
		} else {
			return arrAct;
		}
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
	 * Get default resource path for a package
	 * @param {String} The package name (ck-viewer by default)
	 * @return {String}
	 */
	getPath: function(pkg) {
		// Ext.manifest.paths doesn't exist in production and testing !
		// Ext.manifest.profile can be empty in production mode.

		// TODO : testing mode not implemented

		// In Development
		// Do not use spcecial debug comment
		// Special case with ck-viewer build in dev mode.
		if(this.getEnv()=='development') {
			var path = '';
			if(Ext.manifest.paths && Ext.manifest.paths.Ck) {
				var basePath = Ext.manifest.paths.Ck;
				basePath = basePath.replace('/Ck.js',''); // special hack
				basePath = basePath.replace('/src','');
				if(!Ext.isEmpty(pkg)) {
					basePath = basePath.replace("ck-viewer", pkg);
				}
				path = basePath + '/resources';
			}
			return Ck.getOption('inlineResources') || path;
		}

		// In Production
		pkg = (Ext.isEmpty(pkg))? "ck-viewer" : pkg;
		if(window.cordova){
			// Mobile app use relative path
			return Ext.manifest.profile + '/resources/' + pkg;
		} else {
			// Standard web app need to add full url
			var locationPath = location.pathname;
			if (locationPath.indexOf('.') != -1) {
				locationPath = locationPath.split('/').slice(0,-1).join('/') + '/';
			}
			var baseUrl = location.protocol +'//'+ location.host + locationPath;
			var resourcesUrl = Ck.getOption('inlineResources') || '/resources/' + pkg;
			return baseUrl + (Ext.manifest.profile || '') + resourcesUrl;
		}

		// TODO : when used without CMD - include inline API...
	},

	getOption: function (opt, defaultValue) {
		if(!Ext.manifest.ckClient) return defaultValue || false;
		return Ext.manifest.ckClient[opt] || defaultValue;
	},

	/**
	 * Get default API Url
	 *
	 * See app.json parameter 'ckClient.api'
	 * @return {string}
	 */
	getApi: function () {
		return this.getOption('api') || '';
	},


	zoomToExtent: function(extent) {
		this.getMap().getOlView().fit(extent, this.getMap().getOlMap().getSize());
	},

	/**
	 * @inheritdoc Ext#log
	 */
	log: function(opt) {
		if(opt) Ext.log(opt);
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
		if(!msg) return;
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
					var obj = new (Function.prototype.bind.apply(constructor, arguments));
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
	},

	/**
	 * @param {float}
	 * @return {Float} A normalized scale value, in 1 / X format.
	 *		 This means that if a value less than one ( already 1/x) is passed
	 *		 in, it just returns scale directly. Otherwise, it returns
	 *		 1 / scale
	 */
	normalizeScale: function(scale) {
		var normScale = (scale > 1.0) ? (1.0 / scale)
									  : scale;
		return normScale;
	},

	/**
	 * @param {Float}
	 * @param {ol.proj.ProjectionLike}
	 *
	 * @return {Float} The corresponding resolution given passed-in scale and unit
	 *	 parameters.  If the given scale is falsey, the returned resolution will
	 *	 be undefined.
	 */
	getResolutionFromScale: function(scale, proj) {
		var resolution;
		return ((Ck.CM_PER_INCH / 100) / Ck.DOTS_PER_INCH) * scale * proj.getMetersPerUnit();
	},

	/**
	 * @param {Float}
	 * @param {ol.proj.ProjectionLike}
	 *
	 * @return {Float} The corresponding scale given passed-in resolution and unit parameters.
	 */
	getScaleFromResolution: function(resolution, proj) {
		var proj = ol.proj.get(proj);
		return resolution * ((proj.getMetersPerUnit() * 100) / Ck.CM_PER_INCH) * Ck.DOTS_PER_INCH;
	},

	/**
	 * asynchronous sequential version of Array.prototype.forEach
	 * @param array the array to iterate over
	 * @param fn the function to apply to each item in the array, function
	 *		has two argument, the first is the item value, the second a
	 *		callback function
	 * @param callback the function to call when the forEach has ended
	 */
	asyncForEach: function(array, fn, callback) {
		array = array.slice(0); // Just to be sure
		function processOne() {
			var item = array.pop();
			fn(item, function(result, err) {
				if(array.length > 0) {
					processOne();
				} else {
					callback(result, err);
				}
			});
		}
		if(array.length > 0) {
			processOne();
		} else {
			callback();
		}
	},

	dataURItoBlob: function(dataURI) {
		// convert base64/URLEncoded data component to raw binary data held in a string
		var byteString;
		if (dataURI.split(',')[0].indexOf('base64') >= 0)
			byteString = atob(dataURI.split(',')[1]);
		else
			byteString = unescape(dataURI.split(',')[1]);

		// separate out the mime component
		var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

		// write the bytes of the string to a typed array
		var ia = new Uint8Array(byteString.length);
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		return new Blob([ia], {type:mimeString});
	},

	b64toBlob: function(b64Data, contentType, sliceSize) {
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		var byteCharacters = atob(b64Data);
		var byteArrays = [];

		for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		var blob = new Blob(byteArrays, {type: contentType});
		return blob;
	},

	fieldNameToLabel: function(name) {
		var nameProper = '';

		for (var i = 0; i < name.length; i++) {
			var character = name.substr(i, 1);
			if (character.toUpperCase() == character)
				nameProper += ' ';

			if (nameProper.length == 0)
				nameProper += character.toUpperCase();
			else
				nameProper += character;
		}
		if (nameProper.indexOf('Code ') == 0)
			nameProper = nameProper.substring(5);

		if (nameProper.length == nameProper.indexOf(' Id') + 3)
			nameProper = nameProper.substring(0, nameProper.length - 3);

		var regex = / Flag$/
		if (regex.test(nameProper))
			nameProper = nameProper.replace(regex, '');

		if (nameProper.indexOf(' Upd ') > -1)
			nameProper = nameProper.replace(' Upd ', ' Update ');

		return nameProper;

	},

	toCamelCase: function(name) {
		return name.substring(0, 1).toUpperCase() + name.substring(1);
	},

	// http://www.jstips.co/en/javascript/get-file-extension/
	getFileExtension: function(filename) {
		if(!filename) return '';
		if(!Ext.isString(filename)) return '';
		return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
	},

	removeId: function(name) {
		var regex = /\s?Id$/;
		if (regex.test(name))
			name = name.replace(regex, '');

		return name;
	},

	/**
	 * Reproject an extent
	 * @param {ol.Extent}
	 * @param {ol.proj.ProjectionLike}
	 * @param {ol.proj.ProjectionLike} Use WGS 84 if not set
	 * @return {ol.Extent}
	 */
	reprojectExtent: function(extent, from, to) {
		from = ol.proj.get(from);
		if(Ext.isEmpty(to)) {
			to = ol.proj.get("EPSG:4326");
		} else {
			to = ol.proj.get(to);
		}

		if(ol.proj.equivalent(to, from)) {
			return extent;
		} else {
			extent = ol.geom.Polygon.fromExtent(extent);
			extent.transform(from, to);
			return extent.getExtent();
		}
	},

	/**
	 * Reduce a BBox if it doesn't contained by other BBox
	 * Comparison is done in WGS84 projection
	 *
	 * @param {ol.Extent}		BBox to be limited
	 * @param {ol.Extent}		BBox who limit
	 * @param {ol.proj.ProjectionLike}	Projection of first BBox
	 * @param {ol.proj.ProjectionLike}	Projection of second BBox
	 * @param {ol.proj.ProjectionLike}	Output projection (equal to second BBox projection by default)
	 *
	 * @return {OpenLayers.Bounds} BBox retrécie
	 */
	limitBBox: function(BBox, limitBBox, srsBBox, srsLimitBBox, srsOut) {

		// On transforme les projections qui sont en string en objets
		srsBBox = ol.proj.get(srsBBox);
		srsLimitBBox = ol.proj.get(srsLimitBBox);

		if(srsOut == undefined) {
			srsOut = srsLimitBBox;
		} else {
			srsOut = ol.proj.get(srsOut);
		}

		// On convertie les BBox en 4326
		refSRS = ol.proj.get("EPSG:4326");
		BBox = this.reprojectExtent(BBox, srsBBox);
		limitBBox = this.reprojectExtent(limitBBox, srsLimitBBox);

		// On limite
		leftCoord	= (BBox[0] < limitBBox[0])?		limitBBox[0]		: BBox[0];
		bottomCoord	= (BBox[1] < limitBBox[1])?	limitBBox[1]	: BBox[1];
		rightCoord	= (BBox[2] > limitBBox[2])?	limitBBox[2]		: BBox[2];
		topCoord	= (BBox[3] > limitBBox[3])?		limitBBox[3]		: BBox[3];

		boundsOut = [leftCoord, bottomCoord, rightCoord, topCoord];

		if(!ol.proj.equivalent(srsOut, refSRS)) {
			boundsOut = ol.geom.Polygon.fromExtent(boundsOut);
			boundsOut.transform(refSRS, srsOut);
			boundsOut = boundsOut.getExtent();
		}

		return boundsOut;
	},

	/**
	 * Check if a function is present in the stack trace
	 * @param {Function}
	 * @param {Number} Recursion limit
	 * @return {Boolean}
	 */
	functionInStackTrace: function(fct, limit) {
		var exist = false, caller = arguments.callee.caller;
		limit = (Ext.isNumber(limit))? limit : 15;
		while(caller && !exist && limit > 0) {
			if(caller == fct) {
				exist = true;
			}
			caller = caller.arguments.callee.caller;
			limit--;
		}
		return exist;
	}
}).init();


/**
 * Override Ajax callback to fix Chrome and responseXML null member.
 * Caused by Content-Type equal to "vnd.ogc.wms_xml" instead of "xml"
 *
 * > Header edit Connection-Type "vnd.ogc.wms_xml" "xml"
 *
 * > SetEnvIfNoCase Connection "keep-alivea" HAVE_TOTO
 * > Header set Test "application/xml" env=HAVE_TOTO
 */
Ext.data.proxy.Ajax.prototype.createRequestCallback = function(request, operation) {
	var me = this;
	return function(options, success, response) {
		if (request === me.lastRequest) {
			me.lastRequest = null;
		}
		try {
			var oParser = new DOMParser();
			response.responseXML = oParser.parseFromString(response.responseText , "text/xml");
		} catch(e) {
			Ext.Msg.show({
				title: "Request error",
				msg: "Unable to create DomDocument from XML string",
				buttons: Ext.Msg.OK,
				icon: Ext.MessageBox.ERROR
			});
		} finally {
			me.processResponse(success, operation, request, response);
		}
	};
}
