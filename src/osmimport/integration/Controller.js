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
		if (typeof integrationLayer.getSource().getFeatures === "function") {
			var newFeatures = this.getFeaturesToIntegrate(integrationLayer);
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
	 * This method return a list of features ready to integrate according the configuration. 
	 */
	getFeaturesToIntegrate: function(integrationLayer) {
		var featuresToIntegrate = [];
		var integrationGeometryType = this.getGeometryType(integrationLayer);
		var records = this.getView().openner.osmapi.getData().items;
		for (var i in records) {
			var record = records[i];
			if (record.containsSearchedTags()) {
				var feature = this.convertData(record, integrationLayer, records);
				if (feature) {
					if (feature.getGeometry().getType() == "GeometryCollection") {
						var geometries = feature.getGeometry().getGeometries();
						for (var memberId in geometries) {
							var member = new ol.Feature(
								Ext.apply({
									geometry: geometries[memberId]
								})
							);
							featuresToIntegrate.push(member);
						}
					} else {
						featuresToIntegrate.push(feature);
					}
				}
			}
		}
		return featuresToIntegrate;
	},
	
	/**
	 * This method converts a data from OSM format (as imported) to layer format.
	 * Conversion is done on geometry (correct projection) and (tags / attributes)
	 */
	convertData: function(data, integrationLayer, records) {
		var convertedData = undefined;
		var newProjection = Ck.getMap().getOlMap().getView().getProjection();  // TODO change to get the projection of integration layer
		var geom = undefined;
		var integrateAllGeometry = this.lookupReference("selectAllGeometries").checked;
		var integrationGeometryType = "" + this.getGeometryType(integrationLayer);
		
		if (integrationGeometryType == "undefined") { // Copy all
			geom = data.calculateGeom(undefined, undefined, false, records);
		} else {
			if (integrateAllGeometry) {  // Need some conversions
				geom = data["convertTo" + integrationGeometryType](records);
			} else {  // Copy only if geometry corresponds
				if (data.data.type == "relation") {
					var relGeom = geom = data.calculateGeom(undefined, undefined, false, records);
					if (relGeom.getGeometry && relGeom.getGeometry().getType() == "Polygon" && integrationGeometryType == "Polygon") {
						geom = relGeom
					} else {
						var geoms = []
						for (var i in data.data.members) {
							var member = data.getSubElement(records, data.data.members[i].ref);
							if ((member.type != "relation") && (member.isGeometryType(integrationGeometryType))) {
								geoms.push(member.calculateGeom(undefined, undefined, false, records));
							}
						}
						geom = new ol.geom.GeometryCollection(geoms);
					}
					
				} else {
					if (data.isGeometryType(integrationGeometryType)) {
						geom = data.calculateGeom(undefined, undefined, false, records);
					}
				}
			}
		}
		if (geom != undefined) {
			geom.transform("EPSG:4326", newProjection); // TODO Apply correct elements?
			var convertedData = new ol.Feature(
						Ext.apply({
							geometry: geom
						})
					);
		}
		return convertedData;
	},
	
	/** 
	 * Method to save the data in the server.
	 */
	saveData: function() {
		
	}
});
