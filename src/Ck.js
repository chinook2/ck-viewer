/*
 * @class Ck
 * 
 * 
 * @singleton
 */
Ext.ns('Ck');

// @define Ck
Ext.apply(Ck, {
	/**
	 * 
	 */
	params: null,
	
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
	}
});

/**
 * Load Ck classes
 */
Ext.require([
	'Ck.Controller',
	'Ck.Ajax',
	
	'Ck.Map',
	'Ck.Legend',
	'Ck.Toolbar'
]);

/**
 * Init global variable on page load
 */
Ext.onReady(function(){
	Ck.params = Ext.Object.fromQueryString(location.search);
});
