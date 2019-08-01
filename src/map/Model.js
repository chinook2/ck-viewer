/**
 * Data binding for map view. Allow to display parameters in the view and change parameters (two-way).
 * 
 * ### Simple binding
 * 
 * Parameters that can be displayed in the view (map view or child view)
 *
 *  - zoom
 *  - extent
 *  - xmin, ymin, xmax, ymax (calculated from extent)
 *  - scale
 * 
 * ### Two-way binding
 *
 * Parameters that can be displayed in the view and edited. Changing a parameter change the map parameter.
 *
 *  - x, y
 *  - center
 *  - resolution
 *  - rotation
 *
 * ### Examples
 *
 * Display the current center of the map
 *
 *     {
 *     	"xtype": "tbtext",
 *     	"bind": {
 *     		"html": "Centre : {x} {y}"
 *     	}
 *     }
 *
 *
 * Diplay the current extent of the map
 *
 *     {
 *     	"xtype": "tbtext",
 *     	"bind": {
 *     		"html": "Bbox : {xmin},{ymin},{xmax},{ymax}"
 *     	}
 *     }
 *
 *
 * Add un combobox to show the current scale and change it as well.
 *
 *     {
 *     	"xtype": "combo",
 *     	"fieldLabel": "Echelle",
 *     	"displayField": "scale",
 *     	"valueField": "res",
 *     	"reference": "mapScales",
 *     	"bind": {
 *     		"value": "{resolution}",
 *     		"store":"{scales}"
 *     	}
 *     }
 */
Ext.define('Ck.map.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckmap',

	data: {
		// view
		olview: {
			center: undefined,
			resolution: undefined,
			rotation: undefined,
			
			projection:  {
				code: undefined,
				units: undefined
			}
		},
		
		ckOlLayerConnection :{
			"osm": {
				"source": "XYZ",
				"layerType": "Tile"
			},
			"ign": {
				"source": "WMTS",
				"layerType": "Tile"
			},
			"wmts": {
				"source": "WMTS",
				"layerType": "Tile"
			},
			"xyz": {
				"source": "TileImage",
				"layerType": "Tile"
			},
			"wms": {
				"source": "ImageWMS",
				"layerType": "Image"
			},
			"wfs": {
				"source": "Vector",
				"layerType": "Vector"
			},
			"geojson": {
				"source": "Vector",
				"layerType": "Vector"
			}
		},
		
		/**
		 * @cfg {Number}
		 * Current zoom level of the map.
		 */
		zoom: undefined,

		/**
		 * @cfg {Array}
		 * Current extent of the map [xmin, ymin, xmax, ymax].
		 */
		extent: undefined
	},

	/**
	 * @ignore
	 */
	formulas: {
		/**
		 * @cfg {Number}
		 * Current xmin of the map.
		 */
		xmin: function(get){
			return get('extent')[0];
		},

		/**
		 * @cfg {Number}
		 * Current ymin of the map.
		 */
		ymin: function(get){
			return get('extent')[1];
		},

		/**
		 * @cfg {Number}
		 * Current xmax of the map.
		 */
		xmax: function(get){
			return get('extent')[2];
		},

		/**
		 * @cfg {Number}
		 * Current ymax of the map.
		 */
		ymax: function(get){
			return get('extent')[3];
		},
		
		
		
		/**
		 * @cfg {Number}
		 * Current center 'x' of the map. Calculated from center, and update center on change.
		 * Use Ck.Map#coordPrecision to format the number.
		 *
		 * Two-way binding
		 */
		x: {
			get: function(get) {
				return Number(ol.coordinate.format(get('olview.center'), '{x}', this.getCoordPrecision()));
			},
			set: function(x) {
				this.set('center', [Number(x), this.get('y')]);
			}
		},

		/**
		 * @cfg {Number}
		 * Current center 'y' of the map. Calculated from center, and update center on change.
		 * Use Ck.Map#coordPrecision to format the number.
		 *
		 * Two-way binding
		 */
		y: {
			get: function(get) {
				return Number(ol.coordinate.format(get('olview.center'), '{y}', this.getCoordPrecision()));
			},
			set: function(y) {
				this.set('center', [this.get('x'), Number(y)]);
			}
		},
		
		/**
		 * @cfg {Number}
		 * Current scale of the map (calculated from resolution).
		 */
		scale: function(get){
			return this.getScale(get('olview.resolution'), get('olview.projection.units'));
		},

		/**
		 * @cfg {Array}
		 * Current center of the map [x, y].
		 *
		 * Two-way binding
		 */
		center: {
			get: function(get) {
				return get('olview.center');
			},
			set: function(value) {
				this.getViewController().setCenter(value);
			}
		},
		
		/**
		 * @cfg {Number}
		 * Current resolution of the map.
		 *
		 * Two-way binding
		 */
		resolution: {
			get: function(get) {
				return get('olview.resolution');
			},
			set: function(value) {
				this.getViewController().setResolution(value);
			}
		},
		
		/**
		 * @cfg {Number}
		 * Current rotation of the map.
		 *
		 * Two-way binding
		 */
		rotation: {
			get: function(get) {
				return get('olview.rotation');
			},
			set: function(value) {
				this.getViewController().setRotation(value);
			}
		}		
	},
	
	/**
	 * @ignore
	 */
	stores: {
		scales: {
			fields: ['res', 'scale'],
			data: []
		}
	},
	
	
	
	/**
	 * Calculate the scale of the map from resolution and map unit.
	 * @return {Number} scale
	 * @private
	 */
	getScale: function(res, unit) {
		var dpi = 25.4 / 0.28;
		var mpu = ol.proj.METERS_PER_UNIT[unit];
		return Math.round(res * mpu * 39.37 * dpi);
	},
	
	
	/**
	 * Get the map controller.
	 * @return {Ck.map.Controller} controller
	 * @private
	 */
	getViewController: function() {
		return this.getView().getController();
	},
	
	
	/**
	 * Get the coordinates precision from the Ck.Map#coordPrecision.
	 * @return {Number} coordPrecision
	 * @private
	 */
	getCoordPrecision: function() {
		if(!this.coordPrecision) {
			this.coordPrecision = this.getView().getCoordPrecision();
		}
		return this.coordPrecision;
	}
});