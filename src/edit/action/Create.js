/**
 * Edit tool used to create new feature.
 * this.layer define with layer will be used for snapping
 */
Ext.define('Ck.edit.action.Create', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditCreate',

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'fa fa-plus',
	tooltip: 'Create features',

	toggleGroup: 'ckmapAction',

	/**
	 * True to snap vertex to nearest point
	 */
	snap: true,

	/**
	 * Activate the geometry creation interaction
	 **/
	toggleAction: function(btn, status) {
		this.callParent([btn]);

		// Create the interaction if it doesn't already exist
		if(!this.drawInteraction) {
			this.drawSource = this.getLayerSource();
			this.drawInteraction = new ol.interaction.Draw({
				type: this.getGeometryType(),
				//snapGeometry: this.snapGeometry,
				source: this.drawSource
			});
			this.getMap().getOlMap().addInteraction(this.drawInteraction);

			/*
			// Overload the end-drawing callback to use snapGeometry
			this.drawInteraction.finishDrawing = function() {
				var sketchFeature = this.drawInteraction.abortDrawing_();
				sketchFeature = this.snapGeometry(sketchFeature);

				goog.asserts.assert(!goog.isNull(sketchFeature));
				var coordinates;
				var geometry = sketchFeature.getGeometry();
				switch(this.drawInteraction.mode_) {
					case ol.interaction.DrawMode.POINT:
						goog.asserts.assertInstanceof(geometry, ol.geom.Point);
						coordinates = geometry.getCoordinates();
						break;
					case ol.interaction.DrawMode.LINE_STRING :
						goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
						coordinates = geometry.getCoordinates();
						// Remove the redundant last point
						coordinates.pop();
						geometry.setCoordinates(coordinates);
						break;
					case ol.interaction.DrawMode.POLYGON :
						goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
						// When we finish drawing a polygon on the last point,
						// the last coordinate is duplicated as for LineString
						// we force the replacement by the first point
						this.drawInteraction.sketchPolygonCoords_ = geometry.getCoordinates();
						this.drawInteraction.sketchPolygonCoords_[0].pop();
						this.drawInteraction.sketchPolygonCoords_[0].push(this.drawInteraction.sketchPolygonCoords_[0][0]);
						geometry.setCoordinates(this.drawInteraction.sketchPolygonCoords_);
						coordinates = geometry.getCoordinates();
						break;
				}

				// cast multi-part geometries
				switch(this.drawInteraction.type_) {
					case ol.geom.GeometryType.MULTI_POINT :
						sketchFeature.setGeometry(new ol.geom.MultiPoint([coordinates]));
						break;
					case ol.geom.GeometryType.MULTI_LINE_STRING :
						sketchFeature.setGeometry(new ol.geom.MultiLineString([coordinates]));
						break;
						sketchFeature.setGeometry(new ol.geom.MultiPolygon([coordinates]));
					case ol.geom.GeometryType.MULTI_POLYGON :
				}

				this.drawInteraction.dispatchEvent(new ol.interaction.DrawEvent(ol.interaction.DrawEventType.DRAWEND, sketchFeature));
				this.controller.fireEvent("featurecreate", sketchFeature);
			}.bind(this);
			*/

			this.interactions["drawInteraction"] = this.drawInteraction;
		}

		if(status && btn.single === true){
			if(this.drawSource) this.drawSource.clear();
			this.drawInteraction.on('drawstart', function(){
				if(this.drawSource) this.drawSource.clear();
			}, this);
		}

		this.drawInteraction.setActive(status);
	},

	/**
	 * Hang the polygon's points to those nearest according to the tolerance.
	 * @params {ol.Feature}
	 **/
	snapGeometry: function(feature) {
		var geometry = feature.getGeometry();
		var extent = geometry.getExtent();

		// Récupération des features dans un buffer d'extent du feature
		var buffer = [
			extent[0] - this.getTolerance(),
			extent[1] - this.getTolerance(),
			extent[2] + this.getTolerance(),
			extent[3] + this.getTolerance()
		];

		var featuresInExtent = [];

		var coordinates = geometry.getCoordinates();
		var type = feature.getGeometry().getType();
		if(type != "Point") {
			var coordinates = coordinates[0];
		}
		var source = this.getLayerSource();

		if(type != "Point" && this.snap) {
			// Loop on vertex of the feature
			for(var i=0; i<coordinates.length - 1; i++ ) {
				var coordinate = coordinates[i];
				var feat = source.getClosestFeatureToCoordinate(coordinate);
				// If nearest feature was found
				if(!Ext.isEmpty(feat)) {
					var geom = feat.getGeometry();
					var point = geom.getClosestPoint(coordinate).slice(0, 2); // Find the nearest point of the feature (force 2D)
					var line = new ol.geom.LineString([coordinate, point]);
					var length = line.getLength();

					// Si on rentre dans la tolérance
					if(length <= this.getTolerance()) {
						coordinates[i] = point;
					}
				}
			}
		}

		if(type.indexOf("multi") != -1) {
			coordinates = [coordinates];
		}

		var d = new Date();
		date = Ext.Date.format(d, 'Y-m-d');
		var ced = 'A' + Ext.Date.format(d, 'YmdHis');

		var f = new ol.Feature({
			geometry: Ck.create("ol.geom." + type, coordinates),
			status: "CREATED"
		});

		return f;
	}
});
