/**
 * ViewController used to manage the Integration Panel of OSM Import.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.integration.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportintegration',
	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		this.openner = this.getView().openner;

		/**
         * Init Constants
		 */
		
		
	
		/**
		 * Init the controls from View.
		 */
		this.control({
			"ckosmimportintegration button#cancel": {
				click: this.onCancelClick
			},
			"ckosmimportintegration button#integration": {
				click: this.onIntegrationClick
			},
			"ckosmimportintegration button#integrationfinished": {
				click: this.onIntegrationFinishedClick
			},
			"ckosmimportintegration #layerselection": {
				change: this.onLayerSelectionChange
			}
		});
		
		/**
		 * Init the view
		 */
		var layersList = this.getLayersList();
		this.getViewModel().data.layersList = layersList;
		if (layersList.length > 0) {
			this.lookupReference("layerselection").select(layersList[0].id);
		}
	},
		
	/**
	 * Hide the integration panel
	 */
	onCancelClick: function() {
		this.openner.close();
	},
	
	/**
	 * Indicate to the tool that the user has finished the integration of data.
	 */
	onIntegrationFinishedClick: function() {
		this.openner.finishIntegration();
		this.openner.close();
	},
	
	/**
	 * Returns the list of all the layers in the map which can integrate OSM data.
	 */
	getLayersList: function() {
		var layersList = [];
		var layersArray = Ck.getMap().getLayers().getArray();
		for (var i in layersArray) {
			if (layersArray[i].get("title") != undefined) {
				var layerObj = {title: layersArray[i].get("title"),
								id: layersArray[i].get("id")};
				layersList.push(layerObj);
			}
		}
		return layersList;
	},
	
	/** 
	 * Method called when the user changes the selection of layer on which data will be integrated.
	 */
	onLayerSelectionChange: function(combobox, newValue, oldValue, eOpts) {
		var selectedLayer = Ck.getMap().getLayer(newValue);
		var geometryType = selectedLayer.ckParams.geometryType;
		this.lookupReference("geometrylabel").setText("Géométrie: " + geometryType);
	},
	
	/**
	 * Method called when the user clicks on the integration button.
	 * Execute the integration according the user's configuration on panel.
	 */
	onIntegrationClick: function() {
		var selectedLayer = this.lookupReference("layerselection").getValue();
		var integrationLayer = Ck.getMap().getLayer(selectedLayer);
		Ext.define("GeoJsonModel", {
			extend: "Ext.data.Model",
			fields: [
					{name: "type", defaultValue: "Feature"},
					{name: "properties"},
					{name: "bbox"},
					{name: "geometry"}
				],
				 clientIdProperty: "clientId"});
		var layerStore = Ext.create("Ext.data.Store", {
			model: "GeoJsonModel",
			proxy: {
				type: 'ajax',
				url: integrationLayer.get("url"),
				limitParam: false,
				pageParam: false,
				startParam: false,
 				noCache: false,
				writer: {
					type: "json",
					clientIdProperty: "clientId"
				}
			}
		});
		
		layerStore.load({
			scope: this,
			callback:function(loadedFeatures, operation, success) {
				var newFeatures = [];
				var records = this.getView().openner.osmapi.getData().items;
				console.log(loadedFeatures);
				var features = loadedFeatures[0].data.features;
				console.log(features);
				for (var i in records) {
					var record = records[i];
					if (record.containsSearchedTags([{tag:"[amenity=post_box]"}])) {
						var geom = record.calculateGeom();
						var feature = new ol.Feature(
									Ext.apply({
										geometry: geom
									})
								);				
						newFeatures.push(feature);
						console.log(geom.getCoordinates());
						var featureObj = {
							type: "Feature",
							properties: {},
							bbox: [],
							geometry: {
								type: "Point",
								coordinates: geom.getCoordinates()
								
							}
						};
						features.push(featureObj);
					}
				}
				console.log(loadedFeatures);
				layerStore.setData(loadedFeatures);
				console.log(layerStore);
				console.log(layerStore.getModel());
				layerStore.update();
				integrationLayer.getSource().addFeatures(newFeatures);
			}
		});
		
		/*layerStore.beginUpdate();
		
		for (var i in records) {
			var record = records[i];
			if (record.containsSearchedTags([{tag:"[amenity=post_box]"}])) {
				var feature = new ol.Feature(
							Ext.apply({
								geometry: record.calculateGeom()
							})
						);				
				newFeatures.push(feature);
				layerStore.add(feature);
			}
		}
		console.log(layerStore.getData());
		layerStore.endUpdate();
		layerStore.update();
		integrationLayer.getSource().addFeatures(newFeatures);*/
		
	}
});
