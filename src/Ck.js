/*
 * @class Ck
 * 
 * 
 * @singleton
 */

Ext.define('Ck', {
	singleton: true,
	
	/**
	 *
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
	 *
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
	
	getVersion: function() {
		return '2.0.0';
	}
});

// Evite des erreur si on utilise un console.log() sur un navigateur qui ne le gère pas
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () { };
if (!window.console.info) window.console.info = function () { };
if (!window.console.warn) window.console.warn = function () { };
if (!window.console.error) window.console.error = function () { };
