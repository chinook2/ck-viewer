/**
 * Edit tool used to create new feature
 */
Ext.define('Ck.edit.action.Create', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditCreate',

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'fa fa-plus',
	tooltip: 'Create features',

	/**
	 * Activate the geometry creation interaction
	 **/
	toggleAction: function(btn, status) {
		this.used = true;
		var source = this.getLayerSource();

		// Create the interaction if it doesn't already exist
		if(!this.drawInteraction) {
			this.drawInteraction = new ol.interaction.Draw({
				features: new ol.Collection(source.getFeatures()),
				source: source,
				type: this.getGeometryType(),
				snapGeometry: this.snapGeometry
			});
			this.map.getOlMap().addInteraction(this.drawInteraction);
			
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
					case ol.geom.GeometryType.MULTI_POLYGON :
						sketchFeature.setGeometry(new ol.geom.MultiPolygon([coordinates]));
				}

				if(!goog.isNull(this.drawInteraction.features_)) {
					this.drawInteraction.features_.push(sketchFeature);
				}
				if(!goog.isNull(this.drawInteraction.source_)) {
					this.drawInteraction.source_.addFeature(sketchFeature);
				}

				this.endAction(sketchFeature);
				this.drawInteraction.dispatchEvent(new ol.interaction.DrawEvent(ol.interaction.DrawEventType.DRAWEND, sketchFeature));
			}.bind(this);
		}

		this.drawInteraction.setActive(status);


		/** For GPS
		if(!this.geolocation) {
			var app = Panama.app.getApplication();
			this.geolocation = app.geolocation;

			// add a marker to display the current location
			if(!Ext.get('location-gps')) {
				var body = Ext.getBody();
				body.insertHtml("BeforeEnd", "<div id=\"location-gps\" class=\"marker-gps\"><span class=\"geolocation\"></span></div>");
			}

			this.geolocationMarker = new ol.Overlay({
				element: document.getElementById('location-gps'),
				positioning: 'center-center'
			});
			map.addOverlay(this.geolocationMarker);

			// Update geolocationMarker's position via GPS
			this.geolocation.on('change', function(evt) {
				var p = this.geolocation.getPosition();
				this.geolocationMarker.setPosition(p);
			}, this);
		}


		if(!this.btnCreateGPS) {
			this.btnCreateGPS = Ext.create('Ext.Button', {
				text: 'GPS<br>A&ntilde;adir',
				renderTo: Ext.getBody(),
				floating: true,
				style: {
					bottom: '150px',
					right: '20px'
				},
				handler: function() {
					var coord = this.geolocation.getPosition();

					if(!coord) {
						Ck.error("No GPS plugged.");
						return;
					}

					var p = map.getPixelFromCoordinate(coord);
					var e = {
						map: map,
						pixel: p,
						coordinate: coord
					};
					this.drawInteraction.downPx_ = e.pixel;
					this.drawInteraction.handleUpEvent_(e);
				},
				scope: this
			});
		}

		// Active ou non le GPS / tracking
		if(this.geolocation) this.geolocation.setTracking(status);
		if(this.btnCreateGPS) this.btnCreateGPS.setVisible(status);
		if(Ext.get('location-gps')) Ext.get('location-gps').setVisible(status);

		*/
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
		var coordinates = coordinates[0];
		var source = this.getLayerSource();

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
					// Pour rajouter le point sur le polygon auquel on se rattache s'il n'est pas présent
					/*
					var coords = geom.getCoordinates();
					var pointFound = false;
					for(var j=0; j<coords[0].length; j++) {
						var currPoint = coords[0][j];
						if(currPoint[0] == point[0] && currPoint[1] == point[1]) {
							pointFound = true;
							break;
						}
					}
					if(pointFound === false) {
						for(var j=0; j<coords[0].length-1; j++) {
							var currPoint = coords[0][j];
							var nextPoint = coords[0][j+1];
							var a = (nextPoint[1] - currPoint[1]) / (nextPoint[0] - currPoint[0]);
							var b = currPoint[1] - (a * currPoint[0]);
							var test = (point[1] >= ((a * point[0]) +b) - 1) && (point[1] <= ((a * point[0]) +b) + 1);
							if(test) {
								coords[0].splice(j++, 0, point);
							}
						}
					}
					geom.setCoordinates(coords);
					feat.setGeometry(geom);
					*/
				}
			}
		}

		var d = new Date();
		date = Ext.Date.format(d, 'Y-m-d');
		var ced = 'A' + Ext.Date.format(d, 'YmdHis');

		var f = new ol.Feature({
			geometry: new ol.geom.Polygon([coordinates]),
			status: "CREATED",
			date: date,
			cedula: ced
		});

		return f;
	},
	
	closeAction: function() {
		if(this.used) {
			this.drawInteraction.setActive(false);
			this.map.getOlMap().removeInteraction(this.drawInteraction);
			delete this.drawInteraction;
		}
	}
});