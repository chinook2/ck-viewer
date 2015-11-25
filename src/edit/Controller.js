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
	 * @protected
	 */
	init: function(view) {
		this.layer = view.layer;
		this.multi = (this.layer.getExtension("geometryType").indexOf("Multi") != -1);
		
		var conf = view.editConfig;
		conf.editController = this;
		conf.layer = view.layer;
		conf.multi = this.multi;
		
		
		this.action = {
			"create": Ck.getAction("ckEditCreate"),
			"attribute": Ck.getAction("ckEditAttribute"),
			"geometry": Ck.getAction("ckEditGeometry"),
			"delete": Ck.getAction("ckEditDelete"),
			"crop": Ck.getAction("ckEditCrop"),
			"union": Ck.getAction("ckEditUnion")
		};
		
		for(var key in this.action) {
			Ext.apply(this.action[key], conf);
		}
		
		this.control({
			"ckedit button#close": {
				click: this.close,
				scope: this
			}
		});
		
		if(this.multi) {
			var featureContainer = Ext.getCmp("edit-featurepanel");
			featureContainer = (Ext.isEmpty(featureContainer))? view : featureContainer;
		
			this.featurePanel = Ext.create("widget.ckedit-feature", conf);
			featureContainer.add(this.featurePanel);
		
			// Add listeners
			this.feature = this.featurePanel.getController();
			Ext.apply(this.feature, conf);
			this.feature.addListener("beginsession", this.beginFeatureEdition, this);
			this.feature.addListener("validate", this.saveFeatureChange, this);
			this.feature.addListener("cancel", this.cancelFeatureChange, this);
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
			this.vertex.addListener("beginsession", receiver.beginVertexChange, receiver);
			this.vertex.addListener("validate", receiver.saveVertexChange, receiver);
			this.vertex.addListener("cancel", receiver.cancelVertexChange, receiver);
			// this.vertex.addListener("geometrychange", receiver.vertexChange, receiver);
		}
		
		
		this.historyPanel = Ext.getCmp("edit-historypanel");
		if(this.historyPanel) {
			this.historyView = Ext.create("widget.ckedit-history", conf);
			this.historyPanel.add(this.historyView);
			this.history = this.historyView.getController();
			Ext.apply(this.history, conf);
			this.history.createListeners(this);
		}
	},
	
	/**
	 * When the process goes through sub-feature edition
	 * @param {ol.Feature}
	 */
	beginFeatureEdition: function(feature) {
		this.action["geometry"].disableInteraction();
	},
	
	/**
	 * For feature panel validating
	 * @param {ol.Feature}
	 * @param {Boolean}
	 */
	saveFeatureChange: function(feature, changed) {
		this.switchPanel(this.historyPanel);
		this.action["geometry"].reset();
		if(changed) {
			this.fireEvent("featurechange", feature);
		}
		this.action["geometry"].enableInteraction();
	},
	
	/**
	 * When user cancel modification
	 * @param {ol.Feature}
	 */
	cancelFeatureChange: function(feature) {
		this.switchPanel(this.historyPanel);
		this.action["geometry"].reset();
		this.action["geometry"].enableInteraction();
	},
	
	
	
	
	
	/**
	 * Start a geometry edition session.
	 * If the layer is a multi-features layer, subfeatures panel is displayed, vertex panel otherwise
	 * @param {ol.Feature}
	 */
	startGeometryEdition: function(feature) {
		if(this.multi) {
			this.startFeatureEdition(feature);
		} else {
			this.startVertexEdition(feature.getGeometry());
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
	
	
	
	beginVertexChange: function() {
		this.action["geometry"].disableInteraction();
	},
	
	/**
	 * For vertex panel validating
	 */
	saveVertexChange: function(feature, changed) {
		this.switchPanel(this.historyPanel);
		this.action["geometry"].reset();
		if(changed) {
			this.fireEvent("featuregeometry", feature);
		}
		this.action["geometry"].enableInteraction();
	},
	
	/**
	 * When the user cancel his changes
	 */
	cancelVertexChange: function(feature) {
		
		this.switchPanel(this.historyPanel);
		this.action["geometry"].reset();
		this.action["geometry"].enableInteraction();
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
	
	close: function() {
		for(var key in this.action) {
			this.action[key].close.bind(this.action[key])();
		}
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
