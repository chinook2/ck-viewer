/**
 * Edit tool used to crop new feature
 */
Ext.define('Ck.edit.action.Crop', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditCrop',

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'fa fa-crop',
	tooltip: 'Crop features',
	
	/**
	 * The layer what host the crop line
	 */
	editCropLayer: null,

	/**
	 * The feature what is currently cropping
	 * @property {ol.Feature}
	 */
	cropFeature: null,
	
	/**
	 * Indicate if the edited layer is a multi-feature layer (like MultiLineString)
	 */
	multi: null,
	
	/**
	 * Activate the geometry crop interaction. First, select the geom what want to crop.
	 **/
	toggleAction: function(btn, status) {
		this.callParent([btn]);
		
		var source = this.getLayerSource();

		// Crop the interaction if it doesn't already exist
		if(!this.cropInteraction) {
			this.createInteraction();
		}
		
		this.multi = (Ext.isEmpty(this.multi))? (this.getGeometryType().indexOf("Multi") !== -1) : this.multi;

		this.cropInteraction.setActive(status);

		if(!status) {
			this.cropInteraction.getFeatures().clear();
			if(this.cropDrawInteraction) this.cropDrawInteraction.setActive(false);
			if(this.editCropLayer) this.editCropLayer.getSource().clear();
		}
	},
	
	/**
	 * Create the select interaction.
	 * @param {Object}
	 */
	createInteraction: function(config) {
		if(Ext.isEmpty(config)) {
			config = {}
		}
		
		// Set the affected layer
		this.layer = (Ext.isEmpty(config.layers))? undefined : config.layers[0];
		
		Ext.apply(config, {
			style: this.cropSelectedStyle,
			layers: [this.getLayer()]
		});
		
		this.cropInteraction = Ck.create("ol.interaction.Select", config);
		this.olMap.addInteraction(this.cropInteraction);

		this.cropInteraction.getFeatures().on('add', function (e) {
			this.cropFeature = e.element;
			// One selected object, we lock selection on it
			this.cropInteraction.setActive(false);
			this.editCropDraw();
		}.bind(this));
		this.interactions["cropInteraction"] = this.cropInteraction;
		this.cropInteraction.setActive(false)
	},

	/**
	 *	Active the draw mode to draw one line (2 points) for cropping the selected feature
	 */
	editCropDraw: function() {
		// Couche temporaire de dessin
		if(!this.editCropLayer){
			this.editCropLayer = new ol.layer.Vector({
				source: new ol.source.Vector({
					projection: this.olMap.getView().getProjection().getCode()
				}),
				style: this.cropLayerStyle,
				displayInLayerSwitcher: false
			});

			this.getMap().addSpecialLayer(this.editCropLayer);
		}
		this.editCropLayer.getSource().on("addfeature", this.editCropFeature.bind(this));

		if(!this.cropDrawInteraction){
			this.cropDrawInteraction = new ol.interaction.Draw({
				source: this.editCropLayer.getSource(),
				type: "LineString"
			});
			this.olMap.addInteraction(this.cropDrawInteraction);
			this.interactions["cropDrawInteraction"] = this.cropDrawInteraction;
		}
		this.cropDrawInteraction.setActive(true);
	},

	/**
	 *	Crop the selected feature with the drawing line and update the layer
	 **/
	editCropFeature: function(evt) {
		// Cropping line
		var featureLine = evt.feature;

		var layer = this.getLayer();
		var source = this.getLayerSource(layer);

		// We keep a backup of the feature
		var cropFeatureBackup = this.cropFeature.clone();

		// From > https://github.com/Turfjs/turf-crop/blob/master/index.js
		var geojson  = new ol.format.GeoJSON();
		var line = geojson.writeFeatureObject(featureLine);
		var poly = geojson.writeFeatureObject(this.cropFeature);

		// The first and the last point of the line must be outside of the polygon
		if(turf.inside(turf.point(line.geometry.coordinates[0]), poly) || turf.inside(turf.point(line.geometry.coordinates[line.geometry.coordinates.length-1]), poly)) {
			Ext.Msg.show({
				icon: Ext.Msg.WARNING,
				message: "The first and the last point must be outside of the polygon",
				buttons: Ext.Msg.OK
			});
			// Remove the cropping line
			this.editCropLayer.getSource().clear();
			return;
		}

		// Remove the cropping line
		this.editCropLayer.getSource().clear();

		var _axe = turf.buffer(line, 0.0001, 'meters').features[0];		// turf-buffer issue #23
		var _body = turf.erase(poly, _axe);
		var pieces = [];

		if (_body.geometry.type == 'Polygon' ){
			pieces.push(turf.polygon(_body.geometry.coordinates));
		}else{
			_body.geometry.coordinates.forEach(function(a){
				pieces.push(turf.polygon(a));
			});
		}

		// There is a problem, go out
		if(pieces.length==1){
			return;
		}

		// Remove the original polygon
		var properties = this.cropFeature.getProperties();
		delete properties.geometry;

		source.removeFeature(this.cropFeature);
		this.cropInteraction.getFeatures().clear();

		// Add the 2 pieces, result of the crop
		var d = new Date();
		date = Ext.Date.format(d, 'Y-m-d');

		var features = [];

		// First pass to simplify the geometries
		pieces.forEach(function(p, idx, pcs){
			pcs[idx] = turf.simplify(p, 0.001, true);
		});

		// Second pass to node the geometries
		pieces.forEach(function(p, idx, pcs){
			pcs[idx] = turf.snap(p, pieces, 0.001);
		});

		pieces.forEach(function(p, i){
			var f = geojson.readFeature(p);
			var c = 'A' + Ext.Date.format(d, 'YmdHis') + i;
			f.setProperties({
				status: "CUT",
				date: date,
				cedula: c
			});
			features.push(f)

		}, this);
		source.addFeatures(features);

		// La découpe est terminée, on désactive le dessin de la ligne de découpe
		this.cropDrawInteraction.setActive(false);

		if(this.winCrop) {
			this.winCrop.close();
		}
		
		// If is not a multi-geom we have to ask to the user witch polygon keep attributes
		if(this.multi) {
			this.endCrop(features[0]);
		} else {
			features[0].setStyle(this.cropSelectedStyle);
			// Choice the polygon what keep attributes data
			this.winCrop = new Ext.window.Window({
				title: "Witch polygon keep attribute data ?",
				height: 160,
				width: 300,
				defaultAlign: "tr-tr",
				constrain: true,
				closable: false,
				layout: "fit",
				modal: true,
				items: [{
					xtype: "form",
					items: [{
						xtype: "fieldcontainer",
						defaultType: "radiofield",
						defaults: {
							flex: 1
						},
						layout: "hbox",
						items: [{
							boxLabel: "First polygon",
							name: "polygonCrop",
							inputValue: 1,
							id: "polygonCrop0",
							checked: true,
							listeners: {
								change: function(rad, newValue, oldValue, eOpts) {
									var style = (newValue) ? this.cropSelectedStyle : null;
									features[0].setStyle(style);
								},
								scope: this
							}
						},{
							boxLabel: "Second polygon",
							name: "polygonCrop",
							inputValue: 2,
							id: "polygonCrop1",
							listeners: {
								change: function(rad, newValue, oldValue, eOpts) {
									var style = (newValue) ? this.cropSelectedStyle : null;
									features[1].setStyle(style);
								},
								scope: this
							}
						}]
					}],
					buttons: [{
						text: 'Validate',
						listeners: {
							click: function(btn, e, opt) {
								var form = btn.up('form').getForm();
								if(form.isValid()) {
									var values = form.getFieldValues();
									features[values.polygonCrop - 1].setProperties(properties);
									features[values.polygonCrop - 1].setStyle(null);
									delete cropFeatureBackup;

									this.endCrop(features[values.polygonCrop - 1]);
								}
							},
							scope: this
						}
					},{
						text: 'Cancel',
						listeners: {
							click: function(btn, e, opt) {
								features.forEach(function(f){
									source.removeFeature(f);
								})
								source.addFeature(cropFeatureBackup);
								this.endCrop();
							},
							scope: this
						}
					}]
				}]
			});

			this.winCrop.show();
		}
	},

	/**
	 * Close crop session
	 */
	endCrop: function(ft) {
		if(!Ext.isEmpty(ft)) {
			this.controller.fireEvent("featurecrop", ft);
		}
		this.cropInteraction.setActive(true);
		if(this.winCrop) {
			this.winCrop.close();
		}
	},

	/**
	 *	Return the style to applicate to the selected features
	 **/
	cropSelectedStyle: function(feature, resolution) {
		return [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: "yellow",
					width: 3
				}),
				fill: new ol.style.Fill({
					color: "rgba(0, 0, 255, 0.1)"
				}),
				zIndex: 10000
			})
		];
	}
});