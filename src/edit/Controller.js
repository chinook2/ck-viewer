/**
 * Controller of the edit panel. An edit panel consists of :
 *
 * - Edit action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.edit.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckedit',
	
	editPanelVisible: true,
	
	config: {		
		layer: null,
		
		/**
		 * Indicate if the edited layer is a multi-feature layer (like MultiLineString)
		 */
		multi: false,
		
		/**
		 * If the edited layer is a WMS layer
		 */
		isWMS: false
	},
	
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
		this.callParent([view]);
		
		this.setLayer(view.initialConfig.layer);
		//this.setOpenner(view.initialConfig.openner);
		this.setMulti((view.initialConfig.layer.getExtension("geometryType").indexOf("Multi") != -1));
		
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
			this.wfsLayer.setMap(this.getOlMap());
		}
		
		var conf = view.editConfig;
		conf.editController = this;
		conf.layer = view.layer;
		conf.multi = this.getMulti();
		
		// When user edit a multi-feature layer we have to prepare sub-feature and hide advance operation menu
		if(this.getMulti()) {
			var featureContainer = Ext.getCmp("edit-featurepanel");
			featureContainer = (Ext.isEmpty(featureContainer))? view : featureContainer;
		
			this.featurePanel = Ext.create("widget.ckedit-feature", conf);
			featureContainer.add(this.featurePanel);
		
			// Add listeners
			this.feature = this.featurePanel.getController();
			Ext.apply(this.feature, conf);
			this.relayEvents(this.feature, ["sessionstart"], "feature");
			this.feature.addListener("validate", this.saveFeatureChange, this);
			this.feature.addListener("cancel", this.cancelFeatureChange, this);
			
			
			
			// Hide feature splitting button
			var tbar = this.getView().items.getAt(0).getDockedItems()[0];
			tbar.items.getAt(4).getMenu().items.getAt(0).setVisible(false);
		}
		
		// Display vertex panel for line and polygon
		if(view.layer.getExtension("geometryType") != "Point") {
			var vertexContainer = Ext.getCmp("edit-vertexpanel");
			vertexContainer = (Ext.isEmpty(vertexContainer))? view : vertexContainer;
		
			this.vertexPanel = Ext.create("widget.ckedit-vertex", conf);
			vertexContainer.add(this.vertexPanel);
		
			// Add listeners
			this.vertex = this.vertexPanel.getController();
			Ext.apply(this.vertex, conf);
			
			var receiver = (this.getMulti())? this.feature : this;
			this.relayEvents(this.vertex, ["sessionstart"], "vertex");
			this.vertex.addListener("validate", receiver.saveVertexChange, receiver);
			this.vertex.addListener("cancel", receiver.cancelVertexChange, receiver);
		}
		
		this.historyView = Ext.create("widget.ckedit-history", conf);
		this.history = this.historyView.getController();
		Ext.apply(this.history, conf);
		this.history.createListeners(this);
		
		this.historyPanel = Ext.getCmp("edit-historypanel");
		if(this.historyPanel) {
			this.historyPanel.add(this.historyView);
		}
		
		this.on("featurecreate", this.onCreate, this);
	},
	
	/**
	 * When user has create a geom.
	 * Have to cast into multi-geom if necessary
	 * @param {ol.Feature}
	 */
	onCreate: function(feature) {
		feature.setStyle(Ck.map.Style.greenStroke);
		var source = this.getSource();
		if(this.getMulti()) {
			var type = "Multi" + feature.getGeometry().getType();
			feature = Ck.create("ol.Feature", {
				geometry: Ck.create("ol.geom." + type, [feature.getGeometry().getCoordinates()])
			});
		}
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
		if(this.getMulti()) {
			this.startFeatureEdition(feature);
		} else {
			this.startVertexEdition(feature);
		}
	},
	
	/**
	 * 
	 */
	deleteFeature: function(feature) {
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
		if(this.getLayer().getExtension("geometryType") == "Point") {
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
	
	/**************************************************************************************/
	/********************************* Sub-feature events *********************************/
	/**************************************************************************************/	
	/**
	 * For feature panel validating
	 * @param {ol.Feature}
	 * @param {Boolean}
	 */
	saveFeatureChange: function(feature, changed) {
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
		
		var win = this.view.up('window');
		if(win) {
			win.close();
		}
	},
	
	/**
	 * Save the changes. If it concerne
	 */
	save: function() {
		if(this.getIsWMS()) {
			var data, ft, inserts = [], updates = [], deletes = [], ope = this.getLayer().ckLayer.getOffering("wfs").getOperation("GetFeature");
			var geometryName = this.getLayer().getExtension("geometryColumn");
			var multiForReal = this.getLayer().getExtension("multiForReal");
			
			var currSrs = this.getMap().getProjection().getCode();
			var lyrSrs = ope.getSrs();
			
			var f = Ck.create("ol.format.WFS", {
				featureNS: "http://mapserver.gis.umn.edu/mapserver",
				gmlFormat: Ck.create("ol.format.GML2"),
				featureType: ope.getLayers()
			});
			
			// Loop on history store items
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
				if(multiForReal === true && data.actionId != 3 && !Ext.isEmpty(geom) && geom.getType().indexOf("Multi") == -1) {
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
			
			var lyr = ope.getLayers().split(":");
			
			transacOpt = {
				featureNS		: "feature",
				srsName			: currSrs,
				featureType		: lyr[0],
				gmlOptions: {
					schemaLocation: "wfs"
				}
			};
			
			if(!Ext.isEmpty(lyr[1])) {
				transacOpt.featurePrefix = lyr[1];
			}
			
			var transac = f.writeTransaction(inserts, updates, deletes, transacOpt);
			
			// Temporary parent to get the whole innerHTML
			var pTemp = document.createElement("div");
			pTemp.appendChild(transac);
			
			// Do the getFeature query
			Ck.Ajax.post({
				scope: this,
				url: ope.getUrl(),
				rawData: pTemp.innerHTML,
				success: function(response) {
					this.fireEvent("savesuccess");
					var ins, upd, del;
					ins = response.responseXML.getElementsByTagName("totalInserted")[0];
					upd = response.responseXML.getElementsByTagName("totalUpdated")[0];
					del = response.responseXML.getElementsByTagName("totalDeleted")[0];
					
					if(ins || upd || del) {					
						var msg = "Registration successfully : <br/>";
						if(ins && ins.innerHTML != "0") {
							msg += "Inserted : " + ins.innerHTML + "<br/>";
						}
						if(upd && upd.innerHTML != "0") {
							msg += "Updated : " + upd.innerHTML + "<br/>";
						}
						if(del && del.innerHTML != "0") {
							msg += "Deleted : " + del.innerHTML;
						}
						
						Ext.Msg.show({
							title: "Edition",
							message: msg,
							buttons: Ext.Msg.OK,
							icon: Ext.Msg.INFO
						});
						this.reset();
					}
				},
				failure: function(response) {
					this.fireEvent("savefailed");
					var exception = response.responseXML.getElementsByTagName("ServiceException")[0];
					var msg = "Layer edition failed";
					if(exception) {
						var pre = document.createElement('pre');
						var text = document.createTextNode(exception.innerHTML);
						pre.appendChild(text);
						msg += ". Error message : <br/>" + pre.innerHTML;
					}
					
					Ext.Msg.show({
						title: "Edition",
						message: msg,
						buttons: Ext.Msg.OK,
						icon: Ext.Msg.ERROR
					});
				}
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
