/**
 * ViewController used to manage the Integration Panel of OSM Import.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.integration.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportintegration',

	/**
     * Init Constants
	 */
	OSM_PROJECTION: "EPSG:4326",

	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		this.openner = this.getView().openner;
		
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
		this.waitMsg = Ext.MessageBox.wait("Integrating data, please wait...");
		Ext.defer(
			function() {
				try {
					var selectedLayer = this.lookupReference("layerselection").getValue();
					var integrationLayer = Ck.getMap().getLayerById(selectedLayer);
					if (typeof integrationLayer.getSource().getFeatures === "function") {
						var newFeatures = this.getFeaturesToIntegrate(integrationLayer);
						integrationLayer.getSource().addFeatures(newFeatures);
					}
					this.waitMsg.close();
					Ext.MessageBox.show({
						title: 'OSM Import',
						msg: 'Integration of data from OpenStreetMap succeed. ' + newFeatures.length + ' elements integrated.',
						width: 500,
						buttons: Ext.MessageBox.OK,
						icon: Ext.Msg.INFO
					});
				} catch (exception) {
					console.log(exception.stack);  // TODO Remove this exception log
					Ext.MessageBox.show({
						title: 'OSM Import',
						msg: 'An error occured while integrating the data.',
						width: 500,
						buttons: Ext.MessageBox.OK,
						icon: Ext.Msg.ERROR
					});
				}
			},
			100,
			this
		);
	},
	
	/**
	 * This method return a list of features ready to integrate according the configuration. 
	 */
	getFeaturesToIntegrate: function(integrationLayer) {
		var featuresToIntegrate = [];
		var records = this.getView().openner.osmapi.getData().items;
		for (var i in records) {
			var record = records[i];
			if (record.containsSearchedTags()) {  // Filter records to get only searched elements (not sub nodes or members)
				var features = this.convertData(record, integrationLayer, records);
				featuresToIntegrate = featuresToIntegrate.concat(features);
			}
		}
		return featuresToIntegrate;
	},
	
	/**
	 * This method converts a data from OSM format (as imported) to layer format.
	 * Conversion is done on geometry (correct projection) and (tags / attributes)
	 */
	convertData: function(data, integrationLayer, records) {
		var convertedData = [];
		var newProjection = Ck.getMap().getOlMap().getView().getProjection();  // TODO change to get the projection of integration layer
		var geom = undefined;
		var integrateAllGeometry = this.lookupReference("selectAllGeometries").checked;
		var integrationGeometryType = "" + this.getGeometryType(integrationLayer);
		if (integrationGeometryType == "undefined") { // Copy all
			geom = data.calculateGeom(newProjection, undefined, true, records);  // TODO Change to not use GeometryCollection
		} else {
			if (integrateAllGeometry) {  // Need some conversions
				geom = data["convertTo" + integrationGeometryType](records);
			} else {  // Copy only if geometry corresponds
				geom = data["copyTo" + integrationGeometryType](records);
			}
			// TODO geometry undefined
			// TODO others geometries
		}
		
		// Transform into layer's projection and create Feature.
		if (geom != undefined) {
			if (Ext.isArray(geom)) {
				for (var i in geom) {
					geom[i].transform(this.OSM_PROJECTION, newProjection);
					convertedData.push(new ol.Feature(
						Ext.apply({
							geometry: geom[i]
						})
					));
				}
			} else {
				geom.transform(this.OSM_PROJECTION, newProjection);
				convertedData = [new ol.Feature(
						Ext.apply({
							geometry: geom
						})
					)];
			}
		}
		return convertedData;
	},
	
	/** 
	 * Method to save the data in the server.
	 */
	saveData: function() {
		
	}
});
