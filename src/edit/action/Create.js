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
	itemId: 'edit-create',
	iconCls: 'fa fa-plus',
	tooltip: 'Create features',
	
	/** 
	 * True to snap vertex to nearest point
	 */
	snap: true,
	
	/**
	 * True to add point at GPS geolocation
	 */
	gps: false,

	/** 
	 * True to livesnap vertex to nearest point
	 */
	allowLiveSnap: false,
	
	/**
	 * Activate the geometry creation interaction
	 **/
	toggleAction: function(btn, status) {
		this.callParent(arguments);

		// Create the interaction if it doesn't already exist
		if(!this.drawInteraction && !btn.gps) {
			this.drawSource = new ol.source.Vector();
			this.drawInteraction = new ol.interaction.Draw({
				type: this.controller.getGeometryTypeBehavior(),
				snapGeometry: this.snapGeometry,
				source: this.drawSource
			});
			this.map.getOlMap().addInteraction(this.drawInteraction);
			
			// Livesnapping
			if(this.allowLiveSnap) {
				var snappingOptions = this.controller.getSnappingOptions();
				this.livesnap = new Ck.LiveSnap(snappingOptions);
				Ext.on("layerSnapActive", this.livesnap.manageLayerActive, this.livesnap);
				Ext.on("layerSnapTolerance", this.livesnap.manageLayerTolerance, this.livesnap);
			}
			
			// Overload the end-drawing callback to use snapGeometry
			this.drawInteraction.finishDrawing = function() {
				var sketchFeature = this.drawInteraction.abortDrawing_();
				
				if(!sketchFeature) {
					var coords = this.drawInteraction.sketchCoords_;
					if(coords && Ext.isArray(coords)) {
						var type = this.controller.getGeometryTypeBehavior();
						
						if(type == "Polygon") {
							sketchFeature = new ol.Feature(
								new ol.geom.Polygon(
									coords
								)
							);
						} else if(type == "LineString")  {
							sketchFeature = new ol.Feature(
								new ol.geom.LineString(
									coords
								)
							);
						} else {
							sketchFeature = new ol.Feature(
								new ol.geom.Point(
									coords
								)
							);
						}
					}				
				}

				var geometry = sketchFeature.getGeometry();	
				var opt = {
					layers		: this.controller.getSnappingOptions(),
					layer		: this.getLayer(),
					geometries	: [geometry],
					callback	: this.endProcess,
					scope		: this
				}
				if(opt.layers.length > 0) {
					var geometry = Ck.Snap.snap(opt);
				} else {
					this.endProcess(geometry);
				}
			}.bind(this);
			
			this.interactions["drawInteraction"] = this.drawInteraction;
		}

		if(btn.gps){
			if(status) {
				var geoloc = this.getMap().geolocation.getPosition();
				// geoloc = [1424431, 2232227]; Testing
				if(Ext.isArray(geoloc)) {
					var geomType = this.controller.getGeometryTypeBehavior();
					if(geomType=='Point') {
						if(!this.drawSource) {
							this.drawSource = new ol.source.Vector();
						}
						
						// Create un new  feature
						var geometry = new ol.geom.Point(geoloc)
						var feature = new ol.Feature({
							geometry: geometry,
							status: "CREATED"
						});
						this.drawSource.addFeature(feature);
						this.endProcess(geometry);
						btn.toggle(false);
						Ext.Msg.show({
							title: "Creation",
							message: "Point added at GPS position : [ " + geoloc[0] + ", "+ geoloc[1] + "]",
							buttons: Ext.Msg.OK,
							icon: Ext.Msg.INFO
						});
					}
				} else {
					Ext.Msg.show({
						title: "Create features",
						message: "GPS position not available",
						buttons: Ext.Msg.OK,
						icon: Ext.Msg.ERROR
					});
				}				
			}			
		} else {
			this.drawInteraction.setActive(status);
		}
	},

	doAction: function(btn) {
		this.callParent(arguments);
	},

	// A voir si plus fonctionnel !
	// Create object with GPS position
	// doAction: function(btn) {
		// if(btn.gps) this.toggleAction(btn, false);		
	// },
	
	/**
	 * Hang the polygon's points to those nearest according to the tolerance.
	 * @params {ol.Feature}
	 **/
	endProcess: function(geometry) {
		
		var sketchFeature = new ol.Feature({
			geometry: geometry,
			status: "CREATED"
		});
		
		goog.asserts.assert(!goog.isNull(sketchFeature));
		var coordinates;
		var geometry = sketchFeature.getGeometry();
		
		if(!this.gps) {
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
		}

		// Cast multi-part geometries
		switch(this.controller.getGeometryTypeBehavior()) {
			case ol.geom.GeometryType.MULTI_POINT :
				sketchFeature.setGeometry(new ol.geom.MultiPoint([coordinates]));
				break;
			case ol.geom.GeometryType.MULTI_LINE_STRING :
				sketchFeature.setGeometry(new ol.geom.MultiLineString([coordinates]));
				break;
				sketchFeature.setGeometry(new ol.geom.MultiPolygon([coordinates]));
			case ol.geom.GeometryType.MULTI_POLYGON :
		}

		if(!this.gps) {
			this.drawInteraction.dispatchEvent(new ol.interaction.DrawEvent(ol.interaction.DrawEventType.DRAWEND, sketchFeature));
		}
		
		this.controller.fireEvent("featurecreate", sketchFeature);
	}
});