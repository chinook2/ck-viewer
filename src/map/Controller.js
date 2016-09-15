/**
 * The map controller allow to interact with the map. You can use the Ck.map.Model binding to control the map from a view
 * or you can use directly the map controller functions from another controller or a Ck.Action.
 * 
 * ### ckmap is the controller
 *
 * The events like ckmapReady, the Ck.Controller#getMap (and by inheritance getMap() of all the ck controllers) return a Ck.map.Controller.
 *
 * Example in Ck.map.action.ZoomIn :
 *
 *		var map = Ck.getMap();
 *		map.setZoom( map.getZoom() + 1 );
 *
 * Example in Ck.legend.Controller : 
 *
 *     var layers = this.getMap().getLayers()
 *
 * ### Events relay
 * 
 * The map controller relay also ol.Map events like addLayer.
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
	 * @event layersloaded
	 * Fires when all layers are loaded
	 */
	 
	/**
	 * @event layersloading
	 * Fires when layers begin to load
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
	 * @event removelayer
	 * Fires when layer is removed from the map
	 * @param {ol.layer.*} layer
	 */
	
	/**
	 * @propety {boolean}
	 * True when OpenLayers map is rendered (or rendering)
	 */
	rendered: false,
	
	/**
	 * @propety {Ck.legend.Controller}
	 * Legend associated to this map
	 */
	legend: null,
	
	draw: {},
	
	/**
	 * @var {ol.Geolocation}
	 */
	geolocation: null,

	/**
	 * Init the map component, init the viewModel.
	 * @protected
	 */
	init: function() {
		var v = this.getView();
		
		if(Ck.params.context) {
			v.setContext(Ck.params.context);
		}

		// Create controls
		var olControls = [];
		var control, controls = v.getControls();
		for(var controlName in controls) {
			if(controls[controlName]===false) continue;
			control = Ck.create("ol.control." + controlName, controls[controlName]);
			if(control) {
				olControls.push(control);
			}
		}
		
		if(controls.ZoomSlider) {			
			v.addCls((controls.ZoomSlider.style)? controls.ZoomSlider.style : "zoomslider-style1");
		}
		
		// Create interactions
		var olInteractions = []
		var interaction, interactions = v.getInteractions();
		for(var interactionName in interactions) {
			interaction = Ck.create("ol.interaction." + interactionName, interactions[interactionName]);
			if(interaction) {
				olInteractions.push(interaction);
			}
		}
		
		// Create the map
		var olMap = new ol.Map({
			view: new ol.View({
				center: v.getCenter(),
				zoom: v.getZoom()
			}),
			controls: olControls,
			interactions: olInteractions
		});
		
		this.bindMap(olMap);
		
		this.on("layersloading", this.layersLoading, this);
		this.on("layersloaded", this.layersLoaded, this);
		this.layersAreLoading = false;
		
		// Relay olMap events
		olMap.getLayers().on('add', function(colEvent) {
			var layer = colEvent.element;
			// Alias to get extension property directly
			layer.getExtension = function(key) {
				return (Ext.isEmpty(this.get("extension")))? undefined : this.get("extension")[key];
			};
			this.fireEvent('addlayer', layer);
		}, this);
		olMap.getLayers().on('remove', function(colEvent) {
			var layer = colEvent.element;
			this.fireEvent('removelayer', layer);
		}, this);		
	},
			
	layersLoading: function() {
		this.layersAreLoading = true;
	},
	
	layersLoaded: function() {
		this.layersAreLoading = false;
	},
	
	/**
	 * Init the context map. Called when map is ready.
	 * @param {undefined/Object} Object with features, id, properties and type members
	 * @protected
	 */
	initContext: function(context) {
		var vm = this.getViewModel();
		
		if(!context) {
			var contextName = this.getView().getContext();
			this.getContext(contextName);
			return;
		}
		
		var owc = new Ck.Owc({
			data: context
		});
		if(!owc) {
			Ck.log("This context is not a OWS context !");
			return;
		}
		
		this.originOwc = owc;
		
		var v = this.getView();
		var olMap = this.getOlMap();
		var olView = this.getOlView();

		proj4.defs("EPSG:3943", "+proj=lcc +lat_1=42.25 +lat_2=43.75 +lat_0=43 +lon_0=3 +x_0=1700000 +y_0=2200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

		var viewProj = owc.getProjection();
		var viewScales = owc.getScales();
		
		// Set scales for combobox and olView
		var vmStores = vm.storeInfo;
		vmStores.scales = new Ext.data.Store({
			fields: ['res', 'scale'],
			data: viewScales
		});
		
		vm.setStores(vmStores);
		
		// Reset olView because "set" and "setProperties" method doesn't work for min/maxResolution
		olMap.setView(new ol.View({
			projection: viewProj,
			center: v.getCenter(),
			zoom: v.getZoom(),
			minResolution: viewScales[0].res,
			maxResolution: viewScales[viewScales.length-1].res
		}));
		this.bindMap(olMap);
		
		// Remove all layers
		this.getLayers().clear();
		
		// Use specific user zoom and extent from ckmap view. (different from default values)
		var cfg = v.initialConfig;
		if(cfg.zoom) this.setZoom(cfg.zoom);
		if(cfg.center) this.setCenter(cfg.center);
		if(cfg.extent) this.setExtent(cfg.extent);
		
		// Set the bbox from context only if no zoom / center or extent
		if(!cfg.zoom && !cfg.center && !cfg.extent) this.setExtent(owc.getExtent());
		
		owc.getLayers().forEach(function(layer) {
			var params, opt_options;
			
			var olLayer, olLayerType, olSourceOptions, olSource,
				olSourceAdditional = {},
				olStyle = false;
			var mainOffering = layer.getOffering(0);
				
			var olSource = this.createSource(mainOffering, layer, owc);
			
			switch(mainOffering.getType()) {					
				case "wfs":
				case 'geojson':
					olStyle = Ck.map.Style.style;
					break;
			}
			
			
			if(!Ext.isEmpty(olSource)) {
				var cluster = layer.getExtension("cluster");
				if(cluster) {
					var styleCache = {};
					var nbFeatures = false;
					olStyle = function(opt, source, feature, resolution) {
						var size = feature.get('features').length;
						var style = styleCache[size];
						if (!style) {
							var minSize = opt.minSize || 10;
							var maxSize = opt.maxSize || opt.distance || 60;
							if(!nbFeatures) nbFeatures = source.getFeatures().length;
							var ptRadius = minSize + ((size * maxSize) / nbFeatures);
							style = [new ol.style.Style({
								image: new ol.style.Circle({
									radius: ptRadius,
									stroke: new ol.style.Stroke({
										color: '#fff'
									}),
									fill: new ol.style.Fill({
										color:	'rgba(51,153,204,0.75)'
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
					}.bind(undefined, cluster, olSource)
				}
				
				var extent = layer.getExtent(viewProj) || owc.getExtent();
				
				var ckLayerSpec = vm.getData().ckOlLayerConnection[mainOffering.getType()];
				
				// Create others source
				var sources = {};
				var off, offs = layer.getOfferings();
				for(var i = 1; i < offs.length; i++) {
					off = offs[i];
					if(!Ext.isArray(sources[off.getType()])) {
						sources[off.getType()] = [];
					}
					sources[off.getType()].push(this.createSource(off, layer, owc));
				}
				
				// Reference main source into sources properties
				if(!Ext.isArray(sources[mainOffering.getType()])) {
					sources[mainOffering.getType()] = [];
				}
				sources[mainOffering.getType()].push(olSource);
				
				// Layer creation	
				olLayer = Ck.create("ol.layer." + ckLayerSpec.layerType, {
					id: layer.getId(),
					title: layer.getTitle(),
					source: olSource,
					sources: sources,
					extent: extent,
					style: olStyle,
					visible: layer.getVisible(),
					path: layer.getExtension('path') || "",
					extension: layer.getExtension()
				});
				
				if(olLayer) {					
					olLayer.ckLayer = layer;
					this.getOlMap().addLayer(olLayer);
				}
			}
		}, this);
		
		// Init GPS manager
		if(cfg.geolocation === true) {
			this.geolocation = new ol.Geolocation({
				projection: viewProj,
				tracking: true,
				trackingOptions: {
					enableHighAccuracy: true,
					// timeout: 5000,
					maximumAge: 0
				}
			});
			this.geolocation.on('error', function(error) {
				Ck.error("GPS : "+ error.message);
			});
		}
		
		// Fire when layers are loaded
		Ck.log('fireEvent ckmapLoaded');
		this.fireEvent('loaded', this);
		Ext.GlobalEvents.fireEvent('ckmapLoaded', this);
	},
	
	/**
	 * Create a source from an offering
	 * @param {Ck.owcLayerOffering}
	 * @param {Ck.owcLayer}
	 * @param {Ck.owc}
	 * @return {ol.Source}
	 */
	createSource: function(offering, layer, owc) {
		var mainOperation;
		var olSourceAdditional = {
			layer: layer,
			offering: offering
		};
		var ckLayerSpec = this.getViewModel().getData().ckOlLayerConnection[offering.getType()];
			
		if(Ext.isEmpty(ckLayerSpec)) {
			Ck.error("Layer of type " + offering.getType() + " is not supported by Chinook 2.");
		} else {
			switch(offering.getType()) {
				case 'osm':
					olSourceOptions = {
						layer: 'osm'
					};
					break;
					
				case 'wms':
					mainOperation = offering.getOperation("GetMap");
					olSourceOptions = {
						url: this.getMapUrl(mainOperation.getUrl()),
						params: mainOperation.getParams()
					};
					if(!isNaN(offering.getData().ratio)) {
						olSourceOptions.ratio = offering.getData().ratio;
					}
					break;
					
				case 'wmts':
					mainOperation = offering.getOperation("GetTile");
					params = mainOperation.getParams();
					// get resolution from main view. need inverse order
					var resolutions = owc.getResolutions(false);
					
					// generate resolutions and matrixIds arrays for this WMTS
					var matrixIds = [];
					for (var z = 0; z < resolutions.length; ++z) {
						matrixIds[z] = z;
					};
					
					olSourceOptions = {
						url: this.getMapUrl(mainOperation.getUrl()),
						layer: params.LAYER,
						matrixSet: params.TILEMATRIXSET,
						format: params.FORMAT || 'image/png',
						style: params.STYLE || 'default',
						
						// TODO : use extent, resolutions different from main view.
						tileGrid: new ol.tilegrid.WMTS({
							origin: ol.extent.getTopLeft(owc.getExtent()),
							resolutions: resolutions,
							matrixIds: matrixIds
						})
					};
					break;
					
				case "wfs":
					var format;
					mainOperation = offering.getOperation("GetFeature");
					
					switch(mainOperation.getType()) {
						case "xml":
							format = new ol.format.WFS();
							break;
						case "json":
							format = new ol.format.JSONFeature();
							break;
						case "text":
							format = new ol.format.TextFeature();
							break;
					}
					format.defaultDataProjection = ol.proj.get(mainOperation.getSrs());
					
					olSourceOptions = {
						url		: this.getMapUrl(mainOperation.getHref()),
						format	: format
					};
					break;
				
				case 'geojson':
					mainOperation = offering.getOperation("GetMap");
					olSourceOptions = {
						url: this.getMapUrl(mainOperation.getUrl()),
						format: new ol.format.GeoJSON()
					};
					break;
			}
			
			var olSource = Ck.create("ol.source." + ckLayerSpec.source, olSourceOptions);
			
			// For vector layer only, if we want a clustered representation
			var cluster = layer.getExtension('cluster');
			if(cluster) {
				// TODO : check if scope is ok with N layers
				var olSrcVector = olSource;
				var dist = cluster.distance || 60;
				olSource = new ol.source.Cluster({
					distance: dist,
					source: olSrcVector
				});
			}
		}
		Ext.apply(olSource, olSourceAdditional);
		return olSource;
	},
	
	getMapUrl: function(url) {
		if(!Ext.manifest.ckClient) return url;
		
		var tpl = new Ext.Template(url);
		return tpl.apply(Ext.manifest.ckClient);
	},
	
	/**
	 * Load the context. Called by initContext.
	 * @param {String} The name of the context to load.
	 * @return {Object} The OWS Context. 
	 * @protected
	 */
	getContext: function(contextName) {
		Cks.get({
			url: this.getFullUrl(contextName),
			scope: this,
			success: function(response){
				var owc = Ext.decode(response.responseText);
				this.initContext(owc);
			},
			failure: function(response, opts) {
				Ck.error('Error when loading "'+contextName+'" context !. Loading the default context...');
				this.getContext('ck-default');
			}
		});
	},
	
	/**
	 * Bind the map with the model. Update the model on map moveend event.
	 * @param {ol.Map} olMap
	 * @protected
	 */
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
			
			// TODO : proper destroy panel/controller...
			if(v.destroyed) return;
			if(vm.destroyed) return;
			//
			
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
	 * Getter for the viewModel. See Ck.map.Model for the list of avaible configs.
	 *
	 *		 ckmap.get('center')
	 *
	 * @param {String} property The parameter to retrieve
	 * @return {Object/Array/String}
	 */
	get: function(property) {
		return this.getViewModel().get(property);
	},
	
	/**
	 * Setter for the viewModel. See Ck.map.Model for the list of avaible configs.
	 *
	 *		 ckmap.set('center', [10, 10])
	 *
	 * @param {String} property The parameter to update
	 * @param {String} value The value
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
	 * 
	 */
	getLegend: function() {
		return this.legend;
	},

	/**
	 * Get the map projection.
	 * @return {ol.proj.Projection} proj
	 */
	getProjection: function() {
		return  this.getOlView().getProjection();
	},

	/**
	 * Get the center of the current view.
	 */
	getCenter: function() {
		return this.getOlView().getCenter();
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
	 * Get the current map extent.
	 */
	getExtent: function() {
		return this.getOlView().calculateExtent(this.getOlMap().getSize());
	},
	
	/**
	 * Fit the map view to the passed extent.
	 * @param {ol.Extent} extent An array of numbers representing an extent: [minx, miny, maxx, maxy].
	 */
	setExtent: function(extent) {
		return this.getOlView().fit(extent, this.getOlMap().getSize());
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
	 * @param {Function/undefined} Function with 1 param of ol.layer. Return true to add the layer to the result array
	 * @return {ol.Collection} If no function was passed so all layers are returned
	 */
	getLayers: function(fct) {
		var res, layers = this.getOlMap().getLayers();
		if(Ext.isEmpty(fct)) {
			res = layers;
		} else {
			res = new ol.Collection();
			layers.forEach(function(lyr) {
				if(fct(lyr)) {
					res.push(lyr);
				}
			});
		}
		return res;
	},
	
	/**
	 * Get a layer according the passed function
	 * @param {Function}
	 * @return {ol.Layer/undefined} 
	 */
	getLayer: function(fct) {
		var layers = this.getLayers().getArray();
		
		for(var i = 0; i < layers.length; i++) {
			if(fct(layers[i])) {
				return layers[i];
			}
		}
		
		return undefined;
	},
	
	/**
	 * Get a layer by ID.
	 * @param {String}
	 * @return {ol.Layer/undefined} 
	 */
	getLayerById: function(id) {
		return this.getLayer(function(lyr) {
			return (lyr.get("id") == id);
		});
	},
	
	/**
	 * 
	 */
	getLayersStore: function() {
		var res = [];
		this.getLayers().forEach(function(lyr) {
			// TODO improve true layer detection
			if(lyr.getProperties().title) {
				res.push({
					"id": lyr.get("title"),
					"data": lyr
				});
			}
		});
		return res;
	},
	
	/**
	 * Return the available resolution nearest to the specified value
	 * @param {Float}	The required resolution
	 * @param {Boolean}	False to return the lower resolution
	 * @param {Float}	More than 0 to return a non neighbor resolution
	 */
	getNearestResolution: function(res, upper, offset) {
		var nrRes, idx = 0, mapRes = this.originOwc.getResolutions(true);
		nrRes = mapRes[idx];
		
		while(Ext.isNumeric(mapRes[idx + 1]) && nrRes < res) {
			nrRes = mapRes[++idx];
		}
		
		// nrRes is the resolution next the specified resolution
		if(upper) {
			for(var i = 0; i < offset; i++) {
				if(Ext.isNumeric(mapRes[idx + 1])) {
					nrRes = mapRes[++idx];
				}
			}
		} else {
			offset++;
			for(var i = 0; i < offset; i++) {
				if(Ext.isNumeric(mapRes[idx - 1])) {
					nrRes = mapRes[--idx];
				}
			}
		}
		
		return nrRes;
	},
	
	/**
	 * Return true if at least one layers is loading. False otherwise
	 */
	isLayerLoading: function() {
		return this.layersAreLoading;
	},
	
	/**
	 *	Resize the map when the view is resized.
	 * Render the map if it's not rendered (first call)
	 * @protected
	 */
	resize: function() {
		var v = this.getView();
		var m = this.getOlMap();
		if(!this.rendered){
			m.setTarget(v.body.id);
			this.rendered = true;
			
			// Fire map ready when it's rendered
			Ck.log('fireEvent ckmapReady');
			this.fireEvent('ready', this);
			Ext.GlobalEvents.fireEvent('ckmapReady', this);
			
			this.initContext();
			
			// Force init size
			var size = v.getSize();
			m.setSize([size.width, size.height]);
		} else {
			m.updateSize();
		}
	},
	
	/**
	 * Reset the current view to initial extend
	 */
	resetView: function() {
		this.setExtent(this.originOwc.getExtent());
	},
	
	redraw: function() {
		this.getLayers().forEach(function(layer) {
			var source = layer.getSource();
			if(source.getParams && source.updateParams) {
				var params = source.getParams();
				source.updateParams(params);
			}
		});
	},
	
	/**
	 * Apply the given function to all layers of the map
	 */
	applyFunction: function(fct) {
		this.getLayers().forEach(fct);
	},
	
	applyEffect: function(effectName, layer) {
		var kernel = Ck.normalizeKernel(effectName);
		if(!kernel) {
			return false;
		}
		
		var applyEffect = function(layer) {
			layer.on("postcompose", function(event) {
				Ck.convolve(event.context, kernel);
			})
		}
		
		if(layer) {
			applyEffect(layer);
		} else {
			this.applyFunction(applyEffect);
		}
	}
});
