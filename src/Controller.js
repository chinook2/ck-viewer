/** 
 * Base controller for all ck.*.controller.
 * 
 * Add the {@link ckInit} function called on ckmapReady event.
 *
 */
Ext.define('Ck.Controller', {
	extend: 'Ext.app.ViewController',

	listen: {
		controller: {
			'ckmap': {
				// Called when map is ready
				ready: 'onMapReady',
				// Called when layers are added from context
				loaded: 'onMapLoaded'
			}
		}
	},
	
	_map: null,
	
	//init: function() {
	//},
	
	/**
	 * Called when the map is ready.
	 * @param {Ck.map.Controller} mapController The map controller
	 */
	ckInit: Ext.emptyFn,
	
	/**
	 * Called when the layers are ready from context.
	 * @param {Ck.map.Controller} mapController The map controller
	 */
	ckLayersInit: Ext.emptyFn,
	
	/**
	 * Called by 'ready' event of ckmap controller
	 * @protected
	 */
	onMapReady: function(mapController) {
		this._map = mapController;
		
		this.ckInit(mapController);
	},
	
	/**
	 * Called by 'loaded' event of ckmap controller
	 * @protected
	 */
	onMapLoaded: function(mapController) {		
		this._map = mapController;
		
		this.ckLayersInit(mapController);
	},
	
	/**
	 * Get the current map controller.
	 * @return {Ck.map.Controller} The map controller
	 */
	getMap: function() {
		return this._map;
	}
});
