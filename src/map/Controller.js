/**
 *
 */
Ext.define('Ck.map.Controller', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.ckmap',
	
	/**
	 * @event ckmapReady
	 * Fires when the map is ready (rendered)
	 * @params {Ck.map.Controller} this
	 */
	
	
	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		var v = this.getView();
		
		if(!(v.getMap() instanceof ol.Map)){
			var olMap = new ol.Map({
				view: new ol.View({
					center: v.getCenter(),
					zoom: v.getZoom()
				}),
				
				layers: [
					new ol.layer.Tile({
						source: new ol.source.MapQuest({layer: 'osm'}),
						title: 'Open Stree Map'
					}),
					new ol.layer.Image({
						source: new ol.source.ImageWMS({
							url: 'http://localhost:8080/projets/__Chinookgs/app/1.6/demo_l93/www/index.php',
							params: {
								'LAYERS': 'region',
								'VERSION': '1.1.0'
							}
						}),
						extent: [-610070.44,5042682.29,1082551.12,6644802.40],
						title: 'Régions',
						path: 'GEOFLA'
					}),
					new ol.layer.Image({
						source: new ol.source.ImageWMS({
							url: 'http://localhost:8080/projets/__Chinookgs/app/1.6/demo_l93/www/index.php',
							params: {
								'LAYERS': 'departement',
								'VERSION': '1.1.0'
							}
						}),
						extent: [156745.83,5220016.20,579901.22,5620546.22],
						title: 'Départements',
						path: 'GEOFLA',
                        visible: false
					})
				]
			});
			v.setMap(olMap);
			
			var vm = this.getViewModel();		   
			
			var p = v.getCoordPrecision();
			var olv = olMap.getView();
			
			var proj = olv.getProjection().getCode();
			var units = olv.getProjection().getUnits();
			vm.set('olview.projection.code', proj);
			vm.set('olview.projection.units', units);
			
			olMap.on('moveend', function(e){

				var c = olv.getCenter();
				vm.set('olview.center', c );
				
				var res = olv.getResolution();
				vm.set('olview.resolution', res );
				
				var rot = olv.getRotation();
				vm.set('olview.rotation', rot );
				
				var extent = olv.calculateExtent(olMap.getSize());
				var bl = ol.extent.getBottomLeft(extent);
				var tr = ol.extent.getTopRight(extent);
				vm.set('extent', [
					ol.coordinate.format(bl, '{x}', p),
					ol.coordinate.format(bl, '{y}', p),
					ol.coordinate.format(tr, '{x}', p),
					ol.coordinate.format(tr, '{y}', p)
				]);
				
				var z = olv.getZoom();
				vm.set('zoom', z);
			});
			
			
		}
	},
	
	/**
	 * Getter for the viewModel.
	 */
	get: function(property) {
		return this.getViewModel().get(property);
	},
	
	/**
	 * Setter for the viewModel.
	 */
	set: function(property, value) {
		return this.getViewModel().set(property, value);
	},
	
	
	/**
	 * Get the current map controller.
	 * @return {Ck.map.Controller} The map controller
	 */
	getMap: function() {
		return this.getView().getMap();
	},
	
	/**
	 * Get the Ol view associated with this map..
	 * @return {ol.View} The view that controls this map. 
	 * @protected
	 */
	getMapView: function() {
		return this.getMap().getView();
	},
	
	/**
	 * Set the center of the current view.
	 * @params {ol.Coordinate} center An array of numbers representing an xy coordinate. Example: [16, 48].
	 */
	setCenter: function(c) {
		return this.getMapView().setCenter(c);
	},
	
	/**
	 * Set the resolution for this view.
	 * @params {Number} res The resolution of the view.
	 */
	setResolution: function(res) {
		return this.getMapView().setResolution(res);
	},

	/**
	 * Set the rotation for this view.
	 * @params {Number} rot The rotation of the view in radians.
	 */
	setRotation: function(rot) {
		return this.getMapView().setRotation(rot);
	},
	
	/**
	 * Fit the map view to the passed extent.
	 * @params {ol.Extent} extent An array of numbers representing an extent: [minx, miny, maxx, maxy].
	 */
	setExtent: function(extent) {
		return this.getMapView().fitExtent(extent, this.getMap().getSize());
	},
	
	/**
	 * Get the current zoom level. Return undefined if the current resolution is undefined or not a "constrained resolution".
	 * @return {Number} zoom
	 */
	getZoom: function() {
		return this.getMapView().getZoom();
	},
	
	/**
	 * Zoom to a specific zoom level.
	 * @params {Number} zoom The zoom level 0-n
	 */
	setZoom: function(zoom) {
		return this.getMapView().setZoom(zoom);
	},
	
	/**
	 * Get the collection of layers associated with this map.
	 *	@return {ol.Collection} 
	 */
	getLayers: function() {
		return this.getMap().getLayers();
	},
	
	
	/**
	 *	Resize the map when the view is resized.
	 * Render the map if it's not rendered (first call)
	 */
	resize: function() {
		var v = this.getView();
		var m = v.getMap();
		if(!m.isRendered()){
			m.setTarget(v.body.id);
			
			// Fire map ready when it's rendered
			this.fireEvent('ckmapReady', this);
		} else {
			m.updateSize();
		}
	}
	 
});
