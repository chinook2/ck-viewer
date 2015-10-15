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
	 * Activate the geometry crop interaction
	 **/
	toggleAction: function(btn, status) {
		this.associatedEl = btn;
		this.used = true;
		var source = this.getLayerSource();

		// Crop the interaction if it doesn't already exist
		if(!this.cropInteraction) {
			this.cropInteraction = new ol.interaction.Select({
				layers: [this.getLayer()],
				style: this.cropSelectedStyle
			});
			this.olMap.addInteraction(this.cropInteraction);

			this.cropInteraction.getFeatures().on('add', function (e) {
				this.cropFeature = e.element;

				// On a 1 objet en sélection on bloque la sélection
				this.cropInteraction.setActive(false);

				this.editCropDraw();
			}, this);
		}

		this.cropInteraction.setActive(status);

		 if(!status) {
			this.cropInteraction.getFeatures().clear();
			if(this.cropDrawInteraction) this.cropDrawInteraction.setActive(false);
			if(this.editCropLayer) this.editCropLayer.getSource().clear();
		}
	},

	/**
	 *	Active the draw mode to draw one line (2 points) for cropping the selected feature
	 **/
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

			this.olMap.addLayer(this.editCropLayer);
		}
		this.editCropLayer.getSource().on("addfeature", this.editCropFeature, this);

		if(!this.cropDrawInteraction){
			this.cropDrawInteraction = new ol.interaction.Draw({
				source: this.editCropLayer.getSource(),
				type: "LineString"
			});
			this.olMap.addInteraction(this.cropDrawInteraction);
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

		features[0].setStyle(this.cropSelectedStyle);

		// La découpe est terminée, on désactive le dessin de la ligne de découpe
		this.cropDrawInteraction.setActive(false);

		if(this.winCrop) {
			this.winCrop.close();
		}

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
	},

	/**
	 * Close crop session
	 */
	endCrop: function(ft) {
		if(!Ext.isEmpty(ft)) {
			this.editController.fireEvent("featurecrop", ft);
		}
		this.cropInteraction.setActive(true);
		this.winCrop.close();
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
	},

	closeAction: function() {
		if(this.used) {
			this.drawInteraction.setActive(false);
			this.olMap.removeInteraction(this.drawInteraction);
			delete this.drawInteraction;
		}
	}
});