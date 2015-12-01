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
	
	/**
	 * Indicate if the edited layer is a multi-feature layer (like MultiLineString)
	 */
	multi: false,
	
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
	 * Fires when feature or vertex session is complete
	 */
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.layer = view.layer;
		this.multi = (this.layer.getExtension("geometryType").indexOf("Multi") != -1);
		
		this.control({
			"ckedit button#close": {
				click: this.close,
				scope: this
			}
		});
		
		var conf = view.editConfig;
		conf.editController = this;
		conf.layer = view.layer;
		conf.multi = this.multi;
		
		// When user edit a multi-feature layer we have to prepare sub-feature and hide advance operation menu
		if(this.multi) {
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
			
			var receiver = (this.multi)? this.feature : this;
			this.relayEvents(this.vertex, ["sessionstart"], "vertex");
			this.vertex.addListener("validate", receiver.saveVertexChange, receiver);
			this.vertex.addListener("cancel", receiver.cancelVertexChange, receiver);
		}
		
		
		this.historyPanel = Ext.getCmp("edit-historypanel");
		if(this.historyPanel) {
			this.historyView = Ext.create("widget.ckedit-history", conf);
			this.historyPanel.add(this.historyView);
			this.history = this.historyView.getController();
			Ext.apply(this.history, conf);
			this.history.createListeners(this);
		}
		
		this.on("featurecreate", this.onCreate, this);
	},
	
	/**
	 * When user has create a geom.
	 * Have to cast into multi-geom if necessary
	 * @param {ol.Feature}
	 */
	onCreate: function(feature) {
		var source = this.layer.getSource();
		if(this.multi) {
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
		if(this.multi) {
			this.startFeatureEdition(feature);
		} else {
			this.startVertexEdition(feature);
		}
	},
	
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
		if(feature.getGeometry().getType() != "Point") {
			this.vertex.loadFeature(feature);
			this.switchPanel(this.vertexPanel);
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
		this.switchPanel(this.historyPanel);
		if(changed) {
			this.fireEvent("featuregeometry", feature);
		}
		this.fireEvent("sessioncomplete", feature);;
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
	
	close: function() {
		if(this.vertex) {
			this.vertex.close.bind(this.vertex)();
		}
		if(this.history) {
			this.history.close.bind(this.history)();
		}
		var win = this.view.up('window');
		if (win) {
			win.close();
		}
	}
});
