/**
 * Controller of the addlayer panel. An addlayer panel consists of :
 *
 * - AddLayer action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.goto.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckgoto',

	config: {
		/**
		 * Number of digit after comma for decimal unit
		 * @prop {Integer}
		 */
		mPrecision: 4,
		
		/**
		 * Number of digit after comma for degree unit
		 * @prop {Integer}
		 */
		degPrecision: 8,
		
		/**
		 * Name of layer for display marker
		 * @prop {String}
		 */
		layerName: "ckGotoMarker",
		
		/**
		 * To empty fields on marker cleaning
		 * @prop {Boolean}
		 */
		clearCoordinates: false,
		
		/**
		 * Zoom on goto action
		 * @prop {Integer}
		 */
		zoom: null
	},
	
	/**
	 * Current projection used
	 * @var {ol.proj}
	 */
	proj: null,

	/**
	 * Current unit used
	 * @var {String}
	 */
	unit: "dec",

	/**
	 * Sub components for each units
	 * @var {Ext.form.FieldContainer}
	 */
	dec: null,
	dms: null,
	dm: null,
	
	/**
	 * Map projection
	 * @var {ol.proj}
	 */
	mapProj: null,
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent([view]);
		
		this.initConfig(view.gotoConfig);

		if (!this.mapProj) {
			this.mapProj = this.getOlView().getProjection();
		}

		this.layer = Ck.create("ol.layer.Vector", {
			id: this.getConfig("layerName"),
			source: new ol.source.Vector({
				projection: this.mapProj
			}),
			style: new ol.style.Style({
				image: new ol.style.Icon(({
					anchor: [0.5, 0.5],
					src: Ck.getPath() + "/images/crosshair.png"
				}))
			}),
			zIndex: Ck.Style.zIndex.featureOverlay
		});
		this.layer.setMap(this.getOlMap());
	},

	render: function(view) {
		this.dec = view.getComponent("goto-dec").getController();
		this.dms = view.getComponent("goto-dms").getController();
		this.dm = view.getComponent("goto-dm").getController();

		// Init projection with map projection
		var projCode = this.mapProj.getCode();
		if(view.getComponent("projection").getStore().find("code", projCode) != -1) {
			view.getComponent("projection").setValue(projCode);
		} else {
			Ck.log("The map projection does not exists in the combobox store of Search by Coordinates")
		}

		if (this.getClearCoordinates() === false) {
			this.loadCenter();
		}

	},

	projChange: function(cbx, value) {
		// Hide or display units radio
		var oldProj = this.proj;
		this.proj = ol.proj.get(value);

		var fcUnits = this.view.getComponent("units");
		if(this.proj.getUnits() == "degrees") {
			// fcUnits.setVisible(true); // Disable for now, can be enable later
		} else {
			fcUnits.setVisible(false);
			fcUnits.getComponent("units-dec").setValue(true);
		}

		var geom = this.getGeometry();
		if(oldProj) {
			// Reproject coordinates
			this.loadCoordinates({
				point: geom,
				proj: oldProj
			})
		}
	},

	/**
	 * Display coordinates form according unit
	 */
	unitChange: function(rb, value) {
		this.unit = rb.inputValue;
		this.view.getComponent("goto-" + rb.inputValue).setVisible(value);
	},

	/**
	 * Get center of current view and load coordinates into fields
	 */
	loadCenter: function() {
		var geom = new ol.geom.Point(this.getOlView().getCenter());

		this.loadCoordinates({
			point: geom,
			proj: this.mapProj
		});
	},

	/**
	 * Load coordinates into fields.
	 * Transform coordinates from data.proj (old) to this.proj (new)
	 * @params {Object} Object with point and proj members
	 */
	loadCoordinates: function(data) {
		if(!this.proj) return;
		var fcUnit = ["dec"];
		/* Disable for now
		if(this.proj.getUnits() == "degrees") {
			fcUnit.push("dms", "dm")
		} */

		// Transform
		var pt = data.point;
		var c = null;

		if (pt) {
			if(!ol.proj.equivalent(data.proj, this.proj)) {
				pt.transform(data.proj, this.proj);
			}

			// Truncate values to number of desired decimal
			var prec = (this.proj.getUnits() == "degrees")? this.getConfig("degPrecision") : this.getConfig("mPrecision");
			c = pt.getCoordinates();

			c[0] = parseFloat(c[0]).toFixed(prec);
			c[1] = parseFloat(c[1]).toFixed(prec);
		}

		fcUnit.forEach(function(id) {
			this[id].setCoordinates(c);
			this[id].setProjection(this.proj);
		}.bind(this));
	},

	/**
	 * Make fields empty
	 */
	clearCoordinates: function () {
		var fcUnit = ["dec"];

		fcUnit.forEach(function(id) {
			this[id].setCoordinates(null);
		}.bind(this));
	},

	/**
	 * Return point geometry using current coordinates from fields
	 * @return {ol.geom.Point}
	 */
	getGeometry: function() {
		var c = this[this.unit].getCoordinates();
		if (c === null) {
			return false;
		}
		return new ol.geom.Point(c);
	},

	goTo: function() {
		var geom = this.getGeometry();
		if(this.proj && geom) {
			// Transform coordinate to map proj
			if(!ol.proj.equivalent(this.proj, this.mapProj)) {
				geom.transform(this.proj, this.mapProj);
			}

			var ft = new ol.Feature({
				geometry: geom
			});
			this.getMap().setCenter(geom.getCoordinates());
			this.layer.getSource().addFeature(ft);
			
			if(Ext.isNumber(this.getZoom())) {
				this.getMap().setZoomScale(this.getZoom());
			}
		}
	},

	clearMarker: function() {
		this.layer.getSource().clear();
		if (this.getClearCoordinates() === true) {
			this.clearCoordinates();
		}
	}
});
