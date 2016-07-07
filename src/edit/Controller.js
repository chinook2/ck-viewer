/**
 * Controller of the edit panel. An edit panel consists of :
 *
 * - Edit action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 *
 * There are 2 value of type. The real type of the layer and the considered type for edition.
 */
Ext.define('Ck.edit.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckedit',

	editPanelVisible: true,
	
	/**
	 * @var {ol.Feature}
	 * Current edited feature
	 */
	currentFeature: null,
	
	/**
	 * @var {Ext.button.Button}
	 * Button for geolocation with ckEditGeolocation action
	 */
	geolocationBtn: null,

	config: {
		openner: null,

		layer: null,

		/**
		 * Emulate single geometry. True to considerate geometry as simple geom
		 */
		emulateSimple: true,

		/**
		 * If the edited layer is a WMS layer
		 */
		isWMS: false,

		/**
		 * Indicate if the edited layer is a multi-feature layer for real(like MultiLineString)
		 */
		multi: false,

		/**
		 * Type of the layer. If it's a multi-geometry layer and emulateSimple is true then this value will be simple name geometry type
		 */
		geometryType: "",
		
		/**
		 * True for looped geometry like polygon
		 */
		loopedType: false,

		/**
		 * Indicate if we have to display multi-geometry UI
		 */
		multiBehavior: false,

		/**
		 * Considerate geometry type. It can be different from geometryType only if emulateSimple is true
		 */
		geometryTypeBehavior: "",
		
		/**
		 * The id of the snapping options panel
		 */
		snappingOptionsId: "edit-snapping-options"
	},

	/**
	 * @event geolocation
	 * Fire when geolocation informations is send to this controller
	 * @param {ol.Coordinate}
	 */
	 
	/**
	 * @event featurecreate
	 * Fires when a feature was created
	 * @param {ol.Feature}
	 */

	/**
	 * @event featuregeometry
	 * Fires when a feature geometry was modified
	 * @param {ol.Feature}
	 */

	/**
	 * @event featureattribute
	 * Fires when a feature attribute was modified
	 * @param {ol.Feature}
	 */

	/**
	 * @event featureremove
	 * Fires when a feature was removed
	 * @param {ol.Feature}
	 */

	/**
	 * @event featurecrop
	 * Fires when a feature was croped
	 * @param {ol.Feature}
	 */

	/**
	 * @event featureunion
	 * Fires when a feature was gathered
	 * @param {ol.Feature}
	 */

	/**
	 * @event sessionstart
	 * Fires when feature or vertex session began
	 */

	/**
	 * @event sessioncomplete
	 * Fires when feature or vertex session is complete (not saved)
	 */

	/**
	 * @event savesuccess
	 * Fires when change saved successfully
	 */

	/**
	 * @event savefailed
	 * Fires when change saved successfully
	 */

	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent(arguments);
		var geometryType, geometryTypeBehavior;

		// Geometry type
		var geometryType = this.getLayer().getExtension("geometryType");
		
		// Type compatibility
		switch(geometryType) {
			case "Line":
				geometryType = "LineString";
				break;
		}
		
		// Looped geometry have specific vertex behavior
		if(geometryType.indexOf("Polygon") != -1) {
			this.setLoopedType(true);
		}
		
		if(geometryType.indexOf("Multi") == -1) {
			this.setEmulateSimple(false);
			geometryTypeBehavior = geometryType;
		} else if(this.getEmulateSimple()) {
			geometryTypeBehavior = geometryType.substr(5);
		} else {
			geometryTypeBehavior = geometryType;
		}

		this.setGeometryType(geometryType);
		this.setGeometryTypeBehavior(geometryTypeBehavior);

		this.setMulti(geometryType.indexOf("Multi") != -1);
		this.setMultiBehavior(geometryTypeBehavior.indexOf("Multi") != -1);
		
		// Reference to the main toolbar
		var tbar = view.items.getAt(0).getDockedItems()[0];

		this.control({
			"ckedit button#cancel": {
				click: function() {
					if(this.history.store.getCount() != 0) {
						Ext.Msg.show({
							title: "Edition",
							message: "Are you sure to cancel all modifications ?",
							buttons: Ext.Msg.YESNO,
							icon: Ext.Msg.QUESTION,
							scope: this,
							fn: function(btn) {
								if (btn === 'yes') {
									this.cancel();
								}
							}
						});
					}
				},
				scope: this
			},"ckedit button#save": {
				click: this.save,
				scope: this
			},"ckedit button#close": {
				click: function() {
					if(this.history.store.getCount() != 0) {
						Ext.Msg.show({
							title: "Edition",
							message: "Close edit session without save any changes ?",
							buttons: Ext.Msg.YESNO,
							icon: Ext.Msg.QUESTION,
							scope: this,
							fn: function(btn) {
								if (btn === 'yes') {
									this.cancel();
									this.close();
								}
							}
						});
					} else {
						this.wfsSource.clear();
						this.close();
					}
				},
				scope: this
			}
		});

		// Check if the layer is a WMS or WFS
		if(!(this.getLayer().getSource() instanceof ol.source.Vector)) {
			source = this.getLayer().get("sources");
			if(source["wfs"]) {
				source = source["wfs"][0];
				this.setIsWMS(true);
			} else {
				Ck.error("Layer \"" + this.getLayer().get("title") + "\" doesn't have WFS parameters");
				return false;
			}
		}

		// Create a vector layer to host features of WMS layer
		if(!this.wfsLayer) {
			this.wfsLayer = Ck.create("ol.layer.Vector", {
				id: this.getLayer().getProperties().id + "vector-features",
				source: new ol.source.Vector(),
				style: Ck.map.Style.orangeStroke,
				zIndex: Ck.map.Style.zIndex.featureOverlay
			});
			this.wfsFeatures = [];
			this.wfsSource = this.wfsLayer.getSource();
			this.getMap().addSpecialLayer(this.wfsLayer);
		}

		var conf = view.editConfig;
		conf.editController = this;
		conf.layer = view.layer;
		conf.multi = this.getMultiBehavior();
		
		// Feature panel : when user edit a multi-feature layer we have to prepare sub-feature and hide advance operation menu
		if(conf.multi) {
			var featureContainer = Ext.getCmp("edit-featurepanel");
			if(Ext.isEmpty(featureContainer)) {
				if(view.getPanelContainer() == "same") {
					featureContainer = view;
				} else {
					featureContainer = this.getMainWindow();
				}
			}

			this.featurePanel = Ext.create("widget.ckedit-feature", conf);
			featureContainer.add(this.featurePanel);
			this.mainWindow.manageVisibility();

			// Add listeners
			this.feature = this.featurePanel.getController();
			Ext.apply(this.feature, conf);
			this.relayEvents(this.feature, ["sessionstart"], "feature");
			this.feature.addListener("validate", this.saveFeatureChange, this);
			this.feature.addListener("cancel", this.cancelFeatureChange, this);



			// Hide feature splitting button
			var vertexLive = tbar.getComponent("vertex-live-edit");
			if(vertexLive) {
				vertexLive.getComponent("edit-crop").setVisible(false);
			}
		}

		
		// Vertex panel : display vertex panel for line and polygon
		if(this.getGeometryTypeBehavior() != "Point") {
			var vertexContainer = Ext.getCmp("edit-vertexpanel");
			if(Ext.isEmpty(vertexContainer)) {
				if(view.getPanelContainer() == "same") {
					vertexContainer = view;
				} else {
					vertexContainer = this.getMainWindow();
				}
			}

			var vertexConf = conf;
			vertexConf.scrollable = true;
			this.vertexPanel = Ext.create("widget.ckedit-vertex", vertexConf);
			this.vertexPanel.getController().controller = this;
			vertexContainer.add(this.vertexPanel);
			this.mainWindow.manageVisibility();
			this.vertexContainer = vertexContainer;
			
			// Add listeners
			this.vertex = this.vertexPanel.getController();
			Ext.apply(this.vertex, vertexConf);

			var receiver = (this.getMultiBehavior())? this.feature : this;
			this.relayEvents(this.vertex, ["sessionstart"], "vertex");
			this.vertex.addListener("validate", receiver.saveVertexChange, receiver);
			this.vertex.addListener("cancel", receiver.cancelVertexChange, receiver);
		}
		
		
		// History panel. Everytime used, but not necessarily visible
		var historyContainer = Ext.getCmp("edit-historypanel");
		if(Ext.isEmpty(historyContainer)) {
			if(view.getPanelContainer() == "same") {
				historyContainer = view;
			} else {
				historyContainer = this.getMainWindow();
			}
		}
		
		// Hide "Add to GPS position" button if is not a point layer
		// if(Ck.isDesktop() || geometryType.search("Point") === -1) {
			// var gpsAdd = tbar.getComponent("edit-create-gps");
			// if(gpsAdd) {
				// gpsAdd.hide();
			// }
		// }

		// Geolocation button
		this.on("geolocation", this.setPosition, this);
		this.geolocationBtn = tbar.getComponent("edit-geolocation");
		
		this.historyView = Ext.create("widget.ckedit-history", conf);
		this.historyView.setVisible(view.getUseHistory());
		this.history = this.historyView.getController();
		Ext.apply(this.history, conf);
		this.history.createListeners(this);

		historyContainer.add(this.historyView);
		this.mainWindow.manageVisibility();
		
		this.on("featurecreate", this.onCreate, this);
		
		Ck.getMap().on("contextloading", function(ctx) {
			this.close();		
		}, this);
	},
	
	/**
	 * 
	 */
	getMainWindow: function() {
		if(Ext.isEmpty(this.mainWindow)) {
			this.mainWindow = Ck.create("Ext.window.Window", {
				title: "Edition",
				height: 400,
				width: 400,
				layout: "fit",
				closable: false
			});
			
			this.mainWindow.on("add", function(win, item) {
				item.on("show", win.manageVisibility);
				item.on("hide", win.manageVisibility);
			});
			
			this.mainWindow.manageVisibility = function() {
				var visible = false;
				for(var i = 0; (i < this.items.getCount() && !visible); i++) {
					visible = !this.items.getAt(i).hidden;
				}
				this.setVisible(visible);
			}.bind(this.mainWindow);
			
			this.mainWindow.show();
		}
		
		// JMA hard fix temp !
		this.mainWindow.hide();
		//
		
		return this.mainWindow;
	},

	/**
	 * When user has create a geom.
	 * Have to cast into multi-geom if necessary
	 * @param {ol.Feature}
	 */
	onCreate: function(feature) {
		feature.setStyle(Ck.map.Style.orangeStroke);
		var source = this.getSource();
		
		var id = "";
		if(this.getIsWMS()) {
			id = "CREATED_" + this.getSource().getFeatures().length;
		} else {
			id = "CREATED_" + this.getLayer().getSource().getFeatures().length;
		}
		
		feature.setId(id);
		
		// if(this.getMultiBehavior()) {
			// var type = "Multi" + feature.getGeometry().getType();
			// feature = Ck.create("ol.Feature", {
				// geometry: Ck.create("ol.geom." + type, [feature.getGeometry().getCoordinates()])
			// });
		// }
		source.addFeature(feature);
	},

	/**************************************************************************************/
	/******************************** Click on edit button ********************************/
	/**************************************************************************************/
	/**
	 * Start a geometry edition session.
	 * If the layer is a multi-features layer, subfeatures panel is displayed, vertex panel otherwise.
	 * Called by the action Ck.edit.action.Geometry only.
	 * @param {ol.Feature}
	 */
	startGeometryEdition: function(feature) {
		var geom = feature.getGeometry();
		
		// If it's a multi geom and we only edit geom as simple -> simplify geometry
		if((geom.getType().indexOf("Multi") != -1) && this.getEmulateSimple()) {
			feature.setGeometry(geom["get" + this.getGeometryTypeBehavior()](0));
		}
		
		// Add the feature, if not already added, to the collection
		var ft = this.wfsSource.getFeatureById(this.getFid(feature));

		if(Ext.isEmpty(ft)) {
			var cloneFeat = feature.clone();
			cloneFeat.setId(feature.getId());
			this.wfsSource.addFeature(cloneFeat);
			ft = this.wfsSource.getFeatureById(this.getFid(feature));
		} else {
			ft.setGeometry(ft.getGeometry());
		}
		
		if(this.getMultiBehavior()) {
			this.startFeatureEdition(ft);
		} else {
			this.startVertexEdition(ft);
		}
	},

	/**
	 *
	 */
	deleteFeature: function(feature) {
		var ft = this.wfsSource.getFeatureById(this.getFid(feature));
		if(ft) {
			this.wfsSource.removeFeature(ft);
		}
		
		var cloneFeat = feature.clone();
		cloneFeat.setId(feature.getId());
		this.wfsSource.addFeature(cloneFeat);
		ft = this.wfsSource.getFeatureById(this.getFid(feature));
				
		ft.setStyle(Ck.map.Style.redStroke);
		this.fireEvent("featureremove", ft);
	},

	/**************************************************************************************/
	/********************************** Geometry edition **********************************/
	/**************************************************************************************/
	/**
	 * When the edited layer is a multi-feature layer.
	 * Open sub-features selection panel
	 * @param {ol.Feature}
	 */
	startFeatureEdition: function(feature) {
		this.feature.loadFeature(feature);
		this.switchPanel(this.featurePanel);
	},

	/**
	 * Edit a simple geometry (polygon, line or point)
	 * @param {ol.geom.SimpleGeometry}
	 */
	startVertexEdition: function(feature) {
		this.currentFeature = feature;
		if(this.getGeometryTypeBehavior() == "Point") {
			this.geolocationBtn.enable();
			if(this.moveInteraction) {
				this.getOlMap().removeInteraction(this.moveInteraction);
			}
			this.moveInteraction = new ol.interaction.Translate({
				features: new ol.Collection([feature])
			});
			this.moveInteraction.on("translateend", this.pointTranslateEnd, this);
			this.getOlMap().addInteraction(this.moveInteraction);

			// delete this.moveInteraction.previousCursor_;
			this.moveInteraction.setActive(true);
		} else {
			this.vertex.loadFeature(feature);
			// JMA Hard fix - by defaut live edit
			this.geolocationBtn.enable();
			this.vertex.liveAction();
			this.vertex.on("geometrychange", function(feature){
				this.fireEvent("featuregeometry", feature);
			}, this);
			//
			
			this.switchPanel(this.vertexPanel);
		}
	},

	/**
	 * On feature translating
	 * @param {ol.interaction.TranslateEvent}
	 */
	pointTranslateEnd: function(evt) {
		// Do snapping
		var feature = evt.features.item(0);
		var geometry = feature.getGeometry();
		
		var opt = {
			layers		: this.getSnappingOptions(),
			layer		: this.getLayer(),
			geometries	: [geometry],
			callback	: function(feature, geometry) {
				feature.setGeometry(geometry);
				this.fireEvent("featuregeometry", feature);
			}.bind(this, feature),
			scope		: this
		}
		
		if(opt.layers.length > 0) {
			var geometry = Ck.Snap.snap(opt);
		} else {
			this.fireEvent("featuregeometry", feature);
		}
	},

	/**
	 * Set position from GPS location
	 * @param {ol.Coordinate}
	 */
	setPosition: function(coord) {
		if(coord && !Ext.isEmpty(this.currentFeature)) {
			if(this.currentFeature.getGeometry().getType().indexOf("Point") == -1) {
				this.vertex.fireEvent("geolocation", coord);
			} else {
				var geom = this.currentFeature.getGeometry();
				if(this.currentFeature.getGeometry().getType().indexOf("Multi") == -1) {
					geom.setCoordinates(coord);
				} else {
					geom.setCoordinates([coord]);
				}
				this.fireEvent("featuregeometry", this.currentFeature);
			}
		}
	},
	
	/**************************************************************************************/
	/********************************* Sub-feature events *********************************/
	/**************************************************************************************/
	/**
	 * For feature panel validating
	 * @param {ol.Feature}
	 * @param {Boolean}
	 */
	saveFeatureChange: function(feature, changed) {
		this.geolocationBtn.disable();
		this.switchPanel(this.historyPanel);
		if(changed) {
			this.fireEvent("featuregeometry", feature);
		}
		this.fireEvent("sessioncomplete", feature);
	},

	/**
	 * When user cancel modification
	 * @param {ol.Feature}
	 */
	cancelFeatureChange: function(feature) {
		this.geolocationBtn.disable();
		this.switchPanel(this.historyPanel);
		this.fireEvent("sessioncomplete", feature);
	},

	/**************************************************************************************/
	/*********************************** Vertex events ************************************/
	/**************************************************************************************/
	/**
	 * For vertex panel validating
	 * @param {ol.Feature}
	 * @param {Boolean}
	 */
	saveVertexChange: function(feature, changed) {
		this.switchPanel(this.historyPanel);
		if(changed) {
			this.fireEvent("featuregeometry", feature);
		}
		this.fireEvent("sessioncomplete", feature);
	},

	/**
	 * When the user cancel his changes
	 * @param {ol.Feature}
	 */
	cancelVertexChange: function(feature) {
		this.switchPanel(this.historyPanel);
		this.fireEvent("sessioncomplete", feature);
	},

	/**************************************************************************************/
	/*************************************** Utils ****************************************/
	/**************************************************************************************/
	/**
	 *
	 */
	getSnappingOptions: function() {
		var config, cmp = Ext.getCmp("edit-snapping-options");
		if(cmp) {
			config = cmp.getController().getSettings();
		} else {
			config = [];
		}
		
		return config
	},
	
	/**
	 * Return the source of the current layer
	 * @return {ol.source}
	 */
	getSource: function() {
		return this.wfsSource;
	},

	/**
	 * Display the specified panel
	 * @param {Ext.panel.Panel} The panel to display
	 */
	switchPanel: function(panel) {
		if(this.historyPanel) {
			this.historyPanel.setVisible(this.historyPanel == panel);
		}
		if(this.vertexPanel) {
			this.vertexPanel.setVisible(this.vertexPanel == panel);
		}
		if(this.featurePanel) {
			this.featurePanel.setVisible(this.featurePanel == panel);
		}
	},

	/**
	 * Cancel all modifications.
	 */
	cancel: function() {
		var data, ft;

		if(this.getIsWMS()) {
			this.wfsSource.clear();
		} else {
			for(var i = 0; i < this.history.store.getCount(); i++) {
				data = this.history.store.getAt(i).data;
				switch(data.actionId) {
					case 0:
						// Create
						// this.wfsSource.removeFeature(data.feature);
						break;
					case 1:
					case 2:
					case 4:
					case 5:
						// Geometry or attributes, crop or union
						updates.push(ft);
						break;
					case 3:
						// Remove
						deletes.push(ft);
						break;
				}
			}
		}
		this.history.store.removeAll();
	},

	close: function() {

		if(this.vertex) {
			this.vertex.close.bind(this.vertex)();
		}
		if(this.history) {
			this.history.close.bind(this.history)();
		}
		if(this.feature) {
			this.feature.close.bind(this.feature)();
		}
		
		if(this.mainWindow) {
			this.mainWindow.close();
		}
		if(this.wfsLayer) {
			this.getMap().removeSpecialLayer(this.wfsLayer);
		}
		
		if(this.moveInteraction) {
			this.getOlMap().removeInteraction(this.moveInteraction);
		}
		
		this.getOpenner().close();
	},

	/**
	 * Save the changes.
	 */
	save: function() {
		if(this.getIsWMS()) {
			this.saveFeatures(this.saveWMS);
		}
	},
	
	saveFeatures: function(saveFunction) {
		var layer = this.getLayer();

		var ope = null;
		if(this.getIsWMS()) {
			ope = layer.ckLayer.getOffering("wfs").getOperation("GetFeature");
		} else {
			ope = layer.ckLayer.getOffering("geojson").getOperation("GetMap");
		}
		
		var geometryName = layer.getExtension("geometryColumn");

		var currSrs = this.getMap().getProjection().getCode();
		var lyrSrs = ope.getSrs();

		// Loop on history store items
		var ft, inserts = [], updates = [], deletes = [];
		for(var i = 0; i < this.history.store.getCount(); i++) {
			data = this.history.store.getAt(i).data;
			ft = data.feature
			ft.setStyle(null);
			
			if(currSrs != lyrSrs) {
				ft.getGeometry().transform(currSrs, lyrSrs);
			}

			if(!Ext.isEmpty(geometryName) && geometryName != ft.getGeometryName()) {
				ft.set(geometryName, ft.getGeometry());
				ft.unset("geometry");
				ft.setGeometryName(geometryName);
			}

			// Cast to multi geometry if needed (except for deletion, if geom is set and if it doesn't already a multi geom)
			var geom = ft.getGeometry();
			if(data.actionId != 3 && !Ext.isEmpty(geom) && (geom.getType() != this.getGeometryType())) {
				var mGeom = Ck.create("ol.geom.Multi" + geom.getType(), [geom.getCoordinates()]);
				ft.setGeometry(mGeom);
			}

			switch(data.actionId) {
				case 0:
					// Create
					inserts.push(ft);
					break;
				case 1:
					if(this.vertex !== undefined) {
						this.vertex.closeAll();
					}
				case 2:
				case 4:
				case 5:
					// Geometry or attributes, crop or union
					updates.push(ft);
					break;
				case 3:
					// Remove
					deletes.push(ft);
					break;
			}
		}
		
		saveFunction.call(this, inserts, updates, deletes);
	},
	
	/**
	*	Save the changes for a WMS layer
	**/
	saveWMS: function(inserts, updates, deletes) {	
		Ck.Ajax.sendTransaction(layer, {
			inserts: inserts,
			updates: updates,
			deletes: deletes
		},{
			fn: function() {
				this.fireEvent("savesuccess");
				this.reset();
			},
			scope: this
		},{
			fn: function() {
				this.fireEvent("savefailed");
			},
			scope: this
		});
	},
	
	reset: function() {
		if(this.history) {
			this.history.reset.bind(this.history)();
		}

		if(this.getIsWMS()) {
			this.wfsSource.clear();

			// Redraw
			src = this.getLayer().getSource();
			var params = src.getParams();
			params.t = new Date().getMilliseconds();
			src.updateParams(params);
		}

	},
	
	/**
	*	Get the feature ID
	**/
	getFid: function(feature) {
		var layer = this.getLayer();
		var extension = layer.getExtension("fidColumn");
		
		if(!Ext.isEmpty(extension) && feature.getId() === undefined) {
			feature.setId(feature.get(extension));
		}
		
		return feature.getId();
	}
});
