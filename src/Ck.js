/**
 * @class Ck
 *
 * The Ck namespace (global object) encapsulates all classes, singletons, and
 * utility methods provided by Chinook's libraries 
 *
 * @singleton
 */
var Ck = Ck || {};

// @define Ck
Ext.apply(Ck, {
	
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
     * number will result in the callback being sorted before the others.  Priorities
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
	
	
	getInfos: function() {
		return Ext.manifest.packages['ck-viewer'];
	},
	getVersion: function() {
		return this.getInfos().version;
	},
	getEnvironment: function() {
		return this.getInfos().environment;
	},
	getEnv: function() {
		return this.getEnvironment();
	},
	
	
	log: function(opt) {
		Ext.log(opt);
	},
	error: function(msg) {
		Ext.log({
			level: 'error',
			msg: msg
		});
	},
	debug: function(msg, obj) {
		//<debug>
		Ext.log({
			level: 'info',
			msg: msg,
			dump: obj
		});
		//</debug>
	}
}).init();
