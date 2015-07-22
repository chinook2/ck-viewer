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
				ckmapReady: 'onMapReady'
			}
		}
	},
	
	_map: null,
	
	//init: function() {
	//},
	
	/**
	 * Called when the map is ready.
	 * @param {Ck.map.Controller} The map controller
	 */
	ckInit: Ext.emptyFn,
	
	/**
	 * Called by ckmapReady event of ckmap controller
	 * @protected
	 */
	onMapReady: function(mapController) {
		this._map = mapController;
		
		this.ckInit(mapController);
	},
	
	/**
	 * Get the current map controller.
	 * @return {Ck.map.Controller} The map controller
	 */
	getMap: function() {
		return this._map;
	}
});
