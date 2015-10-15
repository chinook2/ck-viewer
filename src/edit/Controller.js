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
	 * Fires when user want to save vertex change
	 * @param {ol.Feature}
	 */
	 
	/**
	 * @event featuregeometry
	 * Fires when user want to save vertex change
	 * @param {ol.Feature}
	 */
	 
	/**
	 * @event featureattribute
	 * Fires when user want to save vertex change
	 * @param {ol.Feature}
	 */
	 
	/**
	 * @event featureremove
	 * Fires when user want to save vertex change
	 * @param {ol.Feature}
	 */
	
	/**
	 * @protected
	 */
	init: function(view) {
		var conf = view.editConfig;
		conf.editController = this;
		conf.layer = view.layer;
		this.layer = view.layer;
		
		
		
		this.action = {
			"create": Ck.getAction("ckEditCreate"),
			"attribute": Ck.getAction("ckEditAttribute"),
			"geometry": Ck.getAction("ckEditGeometry"),
			"delete": Ck.getAction("ckEditDelete")
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
		
		// Display vertex panel for line and polygon
		if(view.layer.ckParams.geometryType != "Point") {
			var vertexContainer = Ext.getCmp("edit-vertexpanel");
			vertexContainer = (Ext.isEmpty(vertexContainer))? view : vertexContainer;
		
			this.vertexPanel = Ext.create("widget.ckedit-vertex", conf);
			vertexContainer.add(this.vertexPanel);
		
			// Add listeners
			this.vertex = this.vertexPanel.getController();
			this.vertex.addListener("validate", this.saveVertexChange, this);
			this.vertex.addListener("cancel", this.cancelVertexChange, this);
			this.vertex.addListener("beginsession", this.beginVertexChange, this);
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
	 * Display the global edit panel or the specific vertex panel alternately.
	 * Or display specified panel
	 * @param {Ext.panel.Panel} The panel to display
	 */
	switchPanel: function(panel) {
		if(Ext.isEmpty(panel)) {
			this.editPanelVisible = !this.editPanelVisible;
			this.historyPanel.setVisible(this.editPanelVisible);
			this.vertexPanel.setVisible(this.editPanelVisible);
		} else {
			this.historyPanel.setVisible(panel == this.historyPanel);
			this.vertexPanel.setVisible(panel == this.vertexPanel);
			this.editPanelVisible = (panel == this.historyPanel);
		}
	},
	
	beginVertexChange: function(feautre) {
		this.action["geometry"].vertexInteraction.setActive(false);
	},
	
	saveVertexChange: function(feature, changed) {
		this.switchPanel();
		this.action["geometry"].reset();
		if(changed) {
			this.fireEvent("featuregeometry", feature);
		}
		this.action["geometry"].vertexInteraction.setActive(true);
	},
	
	cancelVertexChange: function(feature) {
		this.switchPanel();
		this.action["geometry"].reset();
		this.action["geometry"].vertexInteraction.setActive(true);
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
