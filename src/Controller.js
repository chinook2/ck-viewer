/** 
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
	
	ckInit: Ext.emptyFn,
	
	onMapReady: function(mapController) {
		this._map = mapController;
		
		this.ckInit(mapController);
	},
	
	getMap: function() {
		return this._map;
	}
});
