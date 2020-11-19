/**
 */
Ext.define('Ck.map.action.draw.Action', {
	extend: 'Ck.Action',
	itemId: 'drawPoint',
	toggleGroup: 'ckmapDraw',

	drawId: "default",
	interaction: null,
	win: null,

	requires: [
		'Ck.Draw'
	],

	constructor: function() {
		this.callParent(arguments);
	},

	/**
	 *
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();

		this.getDraw(map);

		map.on("contextloading", function() {
			if (this.getBtn()) {
				this.getBtn().toggle(false);
			}
		}, this);
	},

	/**
	 * [destroy description]
	 */
	destroy: function() {
		// TODO: review draw instance managment !
		var ckmap = this.getMap();
		if (ckmap) {
			delete ckmap.draw[this.draw.getId()];
		}

		this.draw = null;
		this.interaction = null;
	},

	/**
	 * [toggleAction description]
	 * @param  {Ext.button.Button} btn     [description]
	 * @param  {boolean} pressed [description]
	 */
	toggleAction: function(btn, pressed, opt) {
		if (this.interaction) {
			this.draw.getOlMap().removeInteraction(this.interaction);
		}

		this.createInteraction(opt);
		
		if (pressed) {
			this.interaction.setActive(true);
		} else {
			this.interaction.setActive(false);
		}

		if (pressed && btn.single === true) {
			if (this.draw.getSource()) this.draw.getSource().clear();
			this.interaction.on('drawstart', function(evt) {
				this.draw.getSource().clear();
			}, this);
		}

		var type = this.type ? this.type : (/modify$/i.test(this.itemId) ? "Modify" : "");
		console.log(type);
		if (type) {
			this.draw.activeDraw(type, pressed);
		}
	},

	/**
	 * Create the draw interaction
	 * @param {Object} Options to pass to the interaction instantiation
	 */
	createInteraction: function(opt) {
		opt = (Ext.isObject(opt))? opt : {};
		
			if (this.type == 'Circle') {
				var wgs84Sphere = new ol.Sphere(6378137 * 1.47);
				function geometryFunction(coordinates, geometry) {
					if (!geometry) {
						geometry = new ol.geom.Polygon(null);
					}
					var center = coordinates[0];
					var last = coordinates[1];
					var dx = center[0] - last[0];
					var dy = center[1] - last[1];
					var radius = Math.sqrt(dx * dx + dy * dy);
					var circle = ol.geom.Polygon.circular(wgs84Sphere, ol.proj.toLonLat(center), radius);
					circle.transform('EPSG:4326', 'EPSG:3857');
					geometry.setCoordinates(circle.getCoordinates());
					return geometry;
				}
				this.interaction = new ol.interaction.Draw(Ext.applyIf(opt, {
					source: this.draw.getSource(),
					type: this.type,
					geometryFunction: geometryFunction,
					maxPoints: 2,
					style: Ck.Style.drawStyle
				}));
 			
			} else {
				if(this.type == "Text"){
					strtype = "Point";
				}else{
					strtype = this.type;
				}
				this.interaction = new ol.interaction.Draw(Ext.applyIf(opt, {
					source: this.draw.getSource(),
					type: strtype,
					style: Ck.Style.drawStyle
				}));
			}
		
		this.draw.getOlMap().addInteraction(this.interaction);
		var drawSource = this.draw.getSource();
		/*drawSource.on('addfeature', function(feature){
			var geojsonStr = (new ol.format.GeoJSON()).writeFeatures(drawSource.getFeatures());
			localStorage.setItem("shapes", geojsonStr);
			
			var features = drawSource.getFeatures();
			if (features.length > 0) {
				var styles = [];
				for(i = 0; i < features.length; i++) {
					styles[i] = features[i].getStyle();
				}
				localStorage.setItem("shapesStyle", JSON.stringify(styles));
			}
			
		});*/
		this.objprt.recupStyle(this.type);
	},

	/**
	 * [updateInteraction description]
	 * @param  {[type]} style [description]
	 */
	updateInteraction: function(style) {
		this.interaction.on('drawstart', function(evt) {
		    evt.feature.setStyle([style]);
		});
	},

	/**
	 * [getDraw description]
	 * @param  {[type]} map [description]
	 */
	getDraw: function(map) {
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: this.drawId
		});
		this.draw.win = this.win;
	},

	/**
	 * [getFeatures description]
	 */
	getFeatures: function() {
		return this.draw.getSource().getFeatures();
	}
});
