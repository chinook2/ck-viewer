/**
 *
 */
Ext.define('Ck.map.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckmap',
	
	requires: [
		'Ck.format.OWSContext'
	],
	
	/**
	 * @event ready
	 * Fires when the map is ready (rendered)
	 * @param {Ck.map.Controller} this
	 */
	
	/**
	 * @event ckmapReady
	 * Global event. Fires when the map is ready (rendered)
	 *
	 *		Ext.on('ckmapReady', function(map) {
	 *			this._map = map;
	 *			// Do it here ...
	 *		}, this);
	 * 
	 * @param {Ck.map.Controller} this
	 */
	
	/**
	 * @event loaded
	 * Fires when the map is ready (rendered) and all the layers of the current context are loaded
	 * @param {Ck.map.Controller} this
	 */
	/**
	 * @event ckmapLoaded
	 * Global event. Fires when the map is ready (rendered) and all the layers of the current context are loaded.
	 *
	 *		Ext.on('ckmapLoaded', function(map) {
	 *			this._map = map;
	 *			// Do it here ...
	 *		}, this);
	 *
	 * @param {Ck.map.Controller} this
	 */
	
	/**
	 * @event addlayer
	 * Fires when layer is added to the map
	 * @param {ol.layer.*} layer
	 */
	
	
	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		var v = this.getView();
		
		if(Ck.params.context) {
			v.setContext(Ck.params.context);
		}

		var olMap = new ol.Map({
			view: new ol.View({
				center: v.getCenter(),
				zoom: v.getZoom()
			})
		});
		
		this.bindMap(olMap);
		
		// Relay olMap events
		olMap.getLayers().on('add', function(colEvent) {
			var layer = colEvent.element;
			this.fireEvent('addlayer', layer);
		}, this);
	},
	
	initContext: function(context) {
		if(!context) {
			var contextName = this.getView().getContext();
			this.getContext(contextName);
			return;
		}
		
		var owc = new Ck.Owc(context);
		if(!owc) {
			Ck.log("This context is not a OWS context !");
			return;
		}
				
		// remove all layers
		this.getLayers().clear();
		
		// set the bbox
		this.setExtent( owc.getExtent() );
		
		owc.getLayers().forEach(function(lyr) {
			var layer = owc.getLayer(lyr);
			if(!layer) return;
			
			var olLayer, olLayerType, olSource, olStyle = false;
			
			switch(layer.getType()) {
				case 'osm':
					olLayerType = 'Tile';
					olSource = new ol.source.MapQuest({
						layer: 'osm'
					});
					break;
					
				case 'wms':
					olLayerType = 'Image';
					olSource = new ol.source.ImageWMS({
						url: layer.getHref(false),
						params: layer.getHrefParams()
					});
					break;
					
				case 'geojson':
					olLayerType = 'Vector';
					olSource = new ol.source.Vector({
						url: layer.getHref(false),
						format: new ol.format.GeoJSON()
					});
					olStyle = Ck.map.Style.style;
					
					var cluster = layer.getExtension('cluster');
					if(cluster) {
						// TODO : check if scope is ok with N layers
						var styleCache = {};
						var nbFeatures = false;
						var olSrcVector = olSource;
						var dist = cluster.distance || 60;
						olSource = new ol.source.Cluster({
							distance: dist,
							source: olSrcVector
						});
						olStyle = function(feature, resolution) {
							var size = feature.get('features').length;
							var style = styleCache[size];
							if (!style) {
								var minSize = cluster.minSize || 10;
								var maxSize = cluster.maxSize || cluster.distance || 60;
								if(!nbFeatures) nbFeatures = olSrcVector.getFeatures().length;
								var ptRadius = minSize + ((size * maxSize) / nbFeatures);
								style = [new ol.style.Style({
									image: new ol.style.Circle({
										radius: ptRadius,
										stroke: new ol.style.Stroke({
											color: '#fff'
										}),
										fill: new ol.style.Fill({
											color:  'rgba(51,153,204,0.75)'
										})
									}),
									text: new ol.style.Text({
										text: size.toString(),
										scale: ptRadius * .1,
										fill: new ol.style.Fill({
											color: '#fff'
										})
									})
								})];
								styleCache[size] = style;
							}
							return style;
						}
					}
					break;
			}
			
			if(olLayerType) {
				olLayer = new ol.layer[olLayerType]({
					source: olSource,
					extent: layer.getExtent(),
					title: layer.getTitle(),
					style: olStyle,
					visible: layer.getVisible(),
					path: layer.getExtension('path')
				});
				
			}
			if(olLayer) {
				this.getOlMap().addLayer(olLayer);
			}
		}, this);
		
		// Fire when layers are loaded
		Ck.debug('fireEvent ckmapLoaded');
		this.fireEvent('loaded', this);
		Ext.GlobalEvents.fireEvent('ckmapLoaded', this);
	},
	
	getContext: function(contextName) {
		var path = Ext.manifest.profile + '/resources/ck-viewer';
		//<debug>
		// mini hack to load static resource in dev and prod (this is ignored in prod) !
		path = 'packages/local/ck-viewer/resources';
		//</debug>	
		Cks.get({
			url: path +'/context/'+contextName+'.json',
			scope: this,
			success: function(response){
				var owc = Ext.decode(response.responseText);
				this.initContext(owc);
			},
			failure: function(response, opts) {
				Ck.error('Error when loading "'+contextName+'" context !. Loading the default context...');
				this.getContext('default');
			}
		});
	},
	
	bindMap: function(olMap) {
		var v = this.getView();
		var vm = this.getViewModel();
		
		v.setMap(olMap);
		
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
	 * Get the map associated with the controller.
	 * @return {ol.Map} The Ol map
	 */
	getOlMap: function() {
		return this.getView().getMap();
	},
	
	/**
	 * Get the Ol view associated with this map..
	 * @return {ol.View} The view that controls this map. 
	 * @protected
	 */
	getOlView: function() {
		return this.getOlMap().getView();
	},
	
	/**
	 * Set the center of the current view.
	 * @param {ol.Coordinate} center An array of numbers representing an xy coordinate. Example: [16, 48].
	 */
	setCenter: function(c) {
		return this.getOlView().setCenter(c);
	},
	
	/**
	 * Set the resolution for this view.
	 * @param {Number} res The resolution of the view.
	 */
	setResolution: function(res) {
		return this.getOlView().setResolution(res);
	},

	/**
	 * Set the rotation for this view.
	 * @param {Number} rot The rotation of the view in radians.
	 */
	setRotation: function(rot) {
		return this.getOlView().setRotation(rot);
	},
	
	/**
	 * Fit the map view to the passed extent.
	 * @param {ol.Extent} extent An array of numbers representing an extent: [minx, miny, maxx, maxy].
	 */
	setExtent: function(extent) {
		return this.getOlView().fitExtent(extent, this.getOlMap().getSize());
	},
	
	/**
	 * Get the current zoom level. Return undefined if the current resolution is undefined or not a "constrained resolution".
	 * @return {Number} zoom
	 */
	getZoom: function() {
		return this.getOlView().getZoom();
	},
	
	/**
	 * Zoom to a specific zoom level.
	 * @param {Number} zoom The zoom level 0-n
	 */
	setZoom: function(zoom) {
		return this.getOlView().setZoom(zoom);
	},
	
	/**
	 * Get the collection of layers associated with this map.
	 *	@return {ol.Collection} 
	 */
	getLayers: function() {
		return this.getOlMap().getLayers();
	},
	
	
	/**
	 *	Resize the map when the view is resized.
	 * Render the map if it's not rendered (first call)
	 */
	resize: function() {
		var v = this.getView();
		var m = this.getOlMap();
		if(!m.isRendered()){
			m.setTarget(v.body.id);
			
			this.initContext();
			
			// Fire map ready when it's rendered
			Ck.debug('fireEvent ckmapReady');
			this.fireEvent('ready', this);
			Ext.GlobalEvents.fireEvent('ckmapReady', this);
		} else {
			m.updateSize();
		}
	}
	 
});
