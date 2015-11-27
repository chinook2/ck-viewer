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
		Ck.getMap().getLayerById("osmimport_data").getSource().clear();
		Ck.getMap().getLayerById("osmimport_selection").getSource().clear();
		this.openner.finishIntegration();
		this.openner.close();
	},
	
	/**
	 * Returns the list of all the layers in the map which can integrate OSM data.
	 */
	getLayersList: function() {
		var layersList = [];
		var layersArray = Ck.getMap().getLayers().getArray();  // TODO use a filter to have only the corrects layers.
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
	 * Returns the geometry type of a layer.
	 */
	getGeometryType: function(layer) {
		var geometryType = undefined;
		var layerData = layer.getSource().getFeatures();
		for (var i in layerData) {
			var geom = layerData[i].getGeometry().getType();
			if (geometryType == undefined) {
				geometryType = geom;
			} else if (geometryType != geom) {
				geometryType = undefined;
				break;
			}
		}
		return geometryType;
	},
	
	/** 
	 * Method called when the user changes the selection of layer on which data will be integrated.
	 */
	onLayerSelectionChange: function(combobox, newValue, oldValue, eOpts) {
		var selectedLayer = Ck.getMap().getLayerById(newValue);
		var geometryType = undefined;
		if (typeof selectedLayer.getSource().getFeatures === "function") {
			geometryType = this.getGeometryType(selectedLayer);
		}
		this.lookupReference("geometrylabel").setText("Geometry: " + geometryType);
	},
	
	/**
	 * Method called when the user clicks on the integration button.
	 * Execute the integration according the user's configuration on panel.
	 */
	onIntegrationClick: function() {
		var selectedLayer = this.lookupReference("layerselection").getValue();
		var integrationLayer = Ck.getMap().getLayerById(selectedLayer);
		var integrationGeometryType;
		var newFeatures = [];
		if (typeof integrationLayer.getSource().getFeatures === "function") {
			integrationGeometryType = this.getGeometryType(integrationLayer);
			var records = this.getView().openner.osmapi.getData().items;
			for (var i in records) {
				var record = records[i];
				if (record.containsSearchedTags() &&
					record.isGeometryType(integrationGeometryType)) {
					var feature = this.convertData(record, integrationLayer);
					newFeatures.push(feature);
				}
			}
			integrationLayer.getSource().addFeatures(newFeatures);
		}
		Ext.MessageBox.show({
			title: 'OSM Import',
			msg: 'Integration of data from OpenStreetMap succeed. ' + newFeatures.length + ' elements integrated.',
			width: 500,
			buttons: Ext.MessageBox.OK,
			icon: Ext.Msg.INFO
		});
	},
	
	/**
	 * This method converts a data from OSM format (as imported) to layer format.
	 * Conversion is done on geometry (correct projection) and (tags / attributes)
	 */
	convertData: function(data, integrationLayer) {
		var convertedData;
		var newProjection = Ck.getMap().getOlMap().getView().getProjection();  // TODO change to get the projection of integration layer
		var geom = data.calculateGeom(newProjection);  // TODO tranform with correct projection
		var convertedData = new ol.Feature(
					Ext.apply({
						geometry: geom
					})
				);	
		return convertedData;
	},
	
	/** 
	 * Method to save the data in the server.
	 */
	saveData: function() {
		
	}
});