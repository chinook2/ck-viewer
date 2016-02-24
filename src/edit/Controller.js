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
		snappingOptionsId: "edit-snapping-settings"
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

			this.vertexPanel = Ext.create("widget.ckedit-vertex", conf);
			vertexContainer.add(this.vertexPanel);
			this.mainWindow.manageVisibility();

			// Add listeners
			this.vertex = this.vertexPanel.getController();
			Ext.apply(this.vertex, conf);

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
	 * Called by the action Ck.edit.action.Geometry.
	 * @param {ol.Feature}
	 */
	startGeometryEdition: function(feature) {
		// Add the feature, if not already added, to the collection
		if(this.getIsWMS()) {
			var ft = this.wfsSource.getFeatureById(feature.getId());

			if(Ext.isEmpty(ft)) {
				this.wfsSource.addFeature(feature);
			} else {
				feature.setGeometry(ft.getGeometry());
			}
		}
		if(this.getMultiBehavior()) {
			this.startFeatureEdition(feature);
		} else {
			this.startVertexEdition(feature);
		}
	},

	/**
	 *
	 */
	deleteFeature: function(feature) {
		var ft = this.wfsSource.getFeatureById(feature.getId());
		if(ft) {
			this.wfsSource.removeFeature(ft);
		}
		
		this.wfsSource.addFeature(feature);
		feature.setStyle(Ck.map.Style.redStroke);
		if(!this.getIsWMS()) {
			var src = this.getLayer().getSource();
			src.removeFeature(feature);
		}
		this.fireEvent("featureremove", feature);
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
			this.switchPanel(this.vertexPanel);
		}
	},

	pointTranslateEnd: function(a,b,c,d) {
		this.fireEvent("featuregeometry", a.features.item(0));
	},

	/**
	 * Set position from GPS location
	 * @param {ol.Coordinate}
	 */
	setPosition: function(coord) {
		if(!Ext.isEmpty(this.currentFeature)) {
			if(this.currentFeature.getGeometry().getType().indexOf("Point") == -1) {
				this.vertex.fireEvent("geolocation", coord);
			} else {
				var geom = this.currentFeature.getGeometry();
				if(this.currentFeature.getGeometry().getType().indexOf("Multi") == -1) {
					geom.setCoordinates(coord);
				} else {
					geom.setCoordinates([coord]);
				}
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
	getSnappingSettings: function() {
		var config, cmp = Ext.getCmp("edit-snapping-settings");
		if(cmp) {
			config = Ext.getCmp("edit-snapping-settings").getController().getSettings();
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
		if(this.getIsWMS() && this.wfsLayer) {
			return this.wfsSource;
		} else {
			return this.getLayer().getSource();
		}
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
	 * Save the changes. If it concerne
	 */
	save: function() {
		if(this.getIsWMS()) {
			var layer = this.getLayer();
			
			var ope = layer.ckLayer.getOffering("wfs").getOperation("GetFeature");
			var geometryName = layer.getExtension("geometryColumn");

			var currSrs = this.getMap().getProjection().getCode();
			var lyrSrs = ope.getSrs();

			// Loop on history store items
			var ft, inserts = [], updates = [], deletes = [];
			for(var i = 0; i < this.history.store.getCount(); i++) {
				data = this.history.store.getAt(i).data;
				ft = data.feature

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
			
			
		}
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

	}
});
