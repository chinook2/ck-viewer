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
		this.geometryType = undefined;
		
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
		var map = Ck.getMap();
		map.getLayerById("osmimport_data").getSource().clear();
		map.getLayerById("osmimport_selection").getSource().clear();
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
			var layer = layersArray[i];
			if (layer.get("title") != undefined &&
				(layer.getSource() instanceof ol.source.ImageWMS)) {  // TODO Adapt filter to have correct layer type
				var layerObj = {title: layer.get("title"),
								id: layer.get("id")};
				layersList.push(layerObj);
			}
		}
		return layersList;
	},
	
	/**
	 * Returns the geometry type of a layer.
	 */
	getGeometryType: function(layer) {
		if (this.geometryType == undefined) {
			var geometryType = undefined;
			if (typeof layer.getSource().getFeatures === "function") {
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
			}
			this.geometryType = geometryType;
		}
		return this.geometryType;
	},
	
	/** 
	 * Method called when the user changes the selection of layer on which data will be integrated.
	 */
	onLayerSelectionChange: function(combobox, newValue, oldValue, eOpts) {
		// For WMS/WFS, the geometry type is set with the attributes
		this.updateAttributesTagsList();
	},
	
	/**
	 * Method called when the user change the selection of level of information to integrate.
	 */
	onInformationLevelChange: function(radioGroup, newValue, oldValue) {
		if (newValue.informationtointegrate == "coordstags") {
			this.updateAttributesTagsList();
		}
	},
	
	/**
	 * This method updates the grid of layer's attributes and OSM data tags.
	 */
	updateAttributesTagsList: function() {
		var records = this.getView().openner.osmapi.getData().items;
		this.updateSelectedLayerAttributs();
		var tagsOsm = this.getViewModel().data.tagsOsm;
		while (tagsOsm.length > 0) {
			tagsOsm.pop();
		}
		var tags = this.getOsmTags(records);
		if (tags.length > 0) {
			for (var i in tags) {
				tagsOsm.push(tags[i]);
			}
		}
		this.lookupReference("tagsgrid").getStore().load();
		this.updateAssociationButtons();
	},
	
	/** 
	 * Update the list of all the attributes found in the features of the integration layer.
	 */
	updateSelectedLayerAttributs: function() {
		var attributes = [];
		var selectedLayer = this.lookupReference("layerselection").getValue();
		if (selectedLayer) {
			var integrationLayer = Ck.getMap().getLayerById(selectedLayer);
			var layerSource = integrationLayer.getSource();
			if (layerSource instanceof ol.source.ImageWMS) {
				Ck.Ajax.get({
					scope: this,
					url: layerSource.url_,
					params: {
						service: "WFS",
						request: "DescribeFeatureType",
						typename: layerSource.getParams().LAYERS
					},
					withCredentials: true,
					useDefaultXhrHeader: false,
					success: function(response) {
						var attributes = [];
						var sequence = response.responseXML.getElementsByTagName("sequence")[0];
						var elements = sequence.getElementsByTagName("element");
						for (var elId in elements) {
							var el = elements[elId];
							if (typeof el.getAttribute === "function") {
								if (el.getAttribute("type") == "string") {  // Returns only string attributes
									attributes.push(el.getAttribute("name"));
								}
								if (el.getAttribute("type").startsWith("gml:")) {  // Get the geometry type
									this.geometryType = el.getAttribute("type")
														  .replace("gml:", "")
														  .replace("PropertyType", "");
								}
							}
						}
						this.updateAttributesInGrid(attributes);
						this.lookupReference("geometrylabel").setText("Geometry: " + this.geometryType);
					},
					failure: function() {
						this.updateAttributesInGrid(attributes); // Let empty grid
					}
				});
			}
		} else {
			this.updateAttributesInGrid(attributes);
		}
	},
	
	/**
	 * Method to update the grid of layer's attributes.
	 */
	updateAttributesInGrid: function(attributes) {
		var layersAttributes = this.getViewModel().data.layersAttributes;
		while (layersAttributes.length > 0) {
			layersAttributes.pop();
		}
		attributes = Ext.Array.remove(attributes, "geometry");
		attributes = Ext.Array.map(Ext.Array.sort(attributes), function(attr) {return {"attr": attr, "tag": ""};});
		if (attributes.length > 0) {
			for (var i in attributes) {
				layersAttributes.push(attributes[i]);
			}
		}
		this.lookupReference("attributesgrid").getStore().load();
	},
	
	/**
	 * Returns the list of all the tags (key part) found in the given OSM data.
	 */
	getOsmTags: function(records) {
		var tags = [];
		for (var i in records) {
			var record = records[i];
			if (record.containsSearchedTags() && record.data.tags) {
				tags = Ext.Array.merge(tags, Object.keys(record.data.tags));
				
				// Get the relation members tags for specific integration (copyTo Point, LineString, Polygon)
				var selectedLayer = this.lookupReference("layerselection").getValue();
				if (selectedLayer) {
					var integrationLayer = Ck.getMap().getLayerById(selectedLayer);
					var integrationGeometryType = "" + this.getGeometryType(integrationLayer);
					if ((this.lookupReference("geometrytointegrate").getValue().geometrytointegrate == "selectedone") &&
						(["Point", "LineString", "Polygon"].indexOf(integrationGeometryType) > -1)) {
						for (var memberId in record.data.members) {
							var member = record.getSubElement(records, record.data.members[memberId].ref);
							if (record.calculateGeom(member.data, records).getType() == integrationGeometryType) {
								for (var key in member.data.tags) {
									Ext.Array.include(tags, "rel:" + key);
								}
							}
						}
					}
				}
			}
		}
		tags = Ext.Array.map(Ext.Array.sort(tags), function(tag) {return {"tag": tag};});
		return tags;
	},
	
	/**
	 * Method called when the user clicks on the button associate in the attributes/tags panel.
	 * Associate the selected tag with the selected attribute.
	 */
	onAssociateTagClick: function() {
		var viewmodel = this.getViewModel();
		var attrList = viewmodel.data.layersAttributes;
		var tagList = viewmodel.data.tagsOsm;
		var attrGrid = this.lookupReference("attributesgrid");
		var tagGrid = this.lookupReference("tagsgrid");
		var selectedAttr = attrGrid.getSelection();
		var selectedTag = tagGrid.getSelection();
		if (selectedAttr.length != 1 || selectedTag.length != 1) { // 1 and only 1 line of each grid shall be selected
			Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'You shall select 1 and only 1 attribute and 1 and only 1 tag for the association',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.WARNING
				});
		} else {
			var attrName = selectedAttr[0].data.attr;
			var tagName = selectedTag[0].data.tag;
			var previousTag = selectedAttr[0].data.tag;
			
			// 1 - Add tag to attr
			for (var i in attrList) {
				if (attrList[i].attr == attrName) {
					attrList[i].tag = tagName;
					break;
				}
			}
			// 2 - Remove tag from tags
			var indexToRemove = -1;
			for (var i in tagList) {
				if (tagList[i].tag == tagName) {
					indexToRemove = i;
					break;
				}
			}
			tagList.splice(indexToRemove, 1);
			// 3 - Add previous tag to tags
			if (previousTag != "") {
				var indexToInsert = -1;
				for (var i in tagList) {
					if (tagList[i].tag > previousTag) {
						indexToInsert = i;
						break;
					}
				}
				tagList.splice(indexToInsert, 0, {tag: previousTag});
			}

			attrGrid.getStore().load();
			tagGrid.getStore().load();
		}
		this.updateAssociationButtons();
	},
	
	/**
	 * Method called when the user clicks on the button dissociate in the attributes/tags panel.
	 * Dissociates the tags from the selected attribute(s).
	 */
	onDissociateTagClick: function() {
		var viewmodel = this.getViewModel();
		var attrList = viewmodel.data.layersAttributes;
		var tagList = viewmodel.data.tagsOsm;
		var attrGrid = this.lookupReference("attributesgrid");
		var tagGrid = this.lookupReference("tagsgrid");
		var selectedAttr = attrGrid.getSelection();
		for (var i in selectedAttr) {
			// 1 - Add tag in tags
			if (selectedAttr[i].data.tag !=  "") {
				var indexToInsert = -1;
				for (var j in tagList) {
					if (tagList[j].tag > selectedAttr[i].data.tag) {
						indexToInsert = j;
						break;
					}
				}
				tagList.splice(indexToInsert, 0, {tag: selectedAttr[i].data.tag});
			}
			// 2 - Remove tag from attribute
			for (var j in attrList) {
				if (attrList[j].attr == selectedAttr[i].data.attr) {
					attrList[j].tag = "";
					break;
				}
			}
		}
		attrGrid.getStore().load();
		tagGrid.getStore().load();
		this.updateAssociationButtons();
	},
	
	/** 
	 * This method update the disabled state of the attributes/tags assocation buttons.
	 * State is defined by list length and selected values
	 */
	updateAssociationButtons: function() {
		var viewmodel = this.getViewModel();
		var attrList = viewmodel.data.layersAttributes;
		var tagList = viewmodel.data.tagsOsm;
		var selectedAttr = this.lookupReference("attributesgrid").getSelection();
		var selectedTag = this.lookupReference("tagsgrid").getSelection();

		// Button associate
		this.lookupReference("btnAssociate").setDisabled((tagList.length == 0) || (attrList == 0) || (selectedTag.length == 0) || (selectedAttr.length == 0));
		// Button dissociate
		var nbAttrWithoutTag = Ext.Array.filter(selectedAttr, function(attr) {return attr.data.tag == "";}).length;
		this.lookupReference("btnDissociate").setDisabled(nbAttrWithoutTag == selectedAttr.length);
	},
	
	/**
	 * Method called in defered to compute one record for the integration.
	 * Call next one or ends the integration (if there is no next one).
	 */
	computeFeature: function() {
		try {
			var record = this.records[this.nbFeaturesComputed];
			var features = this.convertData(record, this.integrationLayer, this.allRecords, this.attrTagConfig);
			this.featuresToIntegrate = this.featuresToIntegrate.concat(features);
			this.nbFeaturesComputed++;
			var progress = this.nbFeaturesComputed / this.records.length;
			this.waitMsg.updateProgress(progress, Math.round(progress * 100) + "%");
			if (this.nbFeaturesComputed < this.records.length) {
				Ext.defer(this.computeFeature, 1, this);
			} else {
				console.log(this.featuresToIntegrate); // TODO Remove test log
				this.saveData(this.integrationLayer, this.featuresToIntegrate);	
			}
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
	
	/**
	 * Method called when the user clicks on the integration button.
	 * Execute the integration according the user's configuration on panel.
	 */
	onIntegrationClick: function() {
		try {
			var selectedLayer = this.lookupReference("layerselection").getValue();
			if (selectedLayer) {
				this.integrationLayer = Ck.getMap().getLayerById(selectedLayer);
				this.allRecords = this.getView().openner.osmapi.getData().items;
				this.records = Ext.Array.filter(this.allRecords,
					function(record) {return record.containsSearchedTags();});
				this.attrTagConfig = [];
				if (this.lookupReference("informationtointegrate").getValue().informationtointegrate == "coordstags") {
					var attrList = this.getViewModel().data.layersAttributes;
					this.attrTagConfig = Ext.Array.filter(attrList, function(attr) {return attr.tag != "";});
				}
				this.featuresToIntegrate = [];
				this.nbFeaturesComputed = 0;

				this.waitMsg = Ext.Msg.show({
					closable: false,
					message: "Integrating data, please wait...",
					progress: true,
					width: 400
				});
				// Compute records one by one in defered call to update the progress bar.
				Ext.defer(this.computeFeature, 5, this);
			} else {
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'Select a layer for integration',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.ERROR
				});
			}
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
	
	/**
	 * This method converts a data from OSM format (as imported) to layer format.
	 * Conversion is done on geometry (correct projection) and (tags / attributes)
	 */
	convertData: function(data, integrationLayer, records, attributesTagsConfig) {
		var convertedData = [];
		var newProjection = Ck.getMap().getOlMap().getView().getProjection();  // TODO change to get the projection of integration layer
		var features = undefined;
		var integrateAllGeometry = this.lookupReference("selectAllGeometries").checked;
		var integrationGeometryType = "" + this.getGeometryType(integrationLayer);
		if (integrationGeometryType == "undefined") { // Copy all
			features = data.copyToUndefined(records, attributesTagsConfig);
		} else {
			if (integrateAllGeometry) {  // Need some conversions
				features = data["convertTo" + integrationGeometryType](records, attributesTagsConfig);
			} else {  // Copy only if geometry corresponds
				features = data["copyTo" + integrationGeometryType](records, attributesTagsConfig);
			}
		}
		
		// Transform into layer's projection.
		if (features != undefined) {
			for (var i in features) {
				var feature = features[i];
				feature.getGeometry().transform(this.OSM_PROJECTION, newProjection);
				convertedData.push(feature);
			}
		}
		return convertedData;
	},	
	
	/** 
	 * Method to save the data in the server.
	 */
	saveData: function(integrationLayer, features) {
		this.waitMsg = Ext.Msg.show({
			msg: 'Sending data to server, please wait...',
			autoShow: true,
			width: 400,
			wait: {
				interval: 200
			}
		});
		var wfs = new ol.format.WFS();
		var transac = wfs.writeTransaction(
			features, // Inserts
			undefined, // Updates
			undefined, // Deletes
			{ // Options
				featureNS: "http://www.opengis.net/wfs",
				featurePrefix: "",
				featureType: "feature:" + integrationLayer.getSource().getParams().LAYERS,
				nativeElements: []
			}
		);
		var oSerializer = new XMLSerializer();
		var sXML = oSerializer.serializeToString(transac);
		sXML = sXML.replace(/<geometry/g, "<feature:the_geom").replace(/<\/geometry/g, "</feature:the_geom");
		
		// Send features to server and handle response
		Ck.Ajax.post({
			scope: this,
			url: integrationLayer.getSource().url_,
			xmlData: sXML,
			withCredentials: true,
			useDefaultXhrHeader: false,
			success: function(response) {
				var resp = wfs.readTransactionResponse(response.responseXML);
				var nbInserted = resp.transactionSummary.totalInserted;
				this.waitMsg.close();
				// Refresh the map
				integrationLayer.getSource().updateParams({"time": Date.now()});
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'Integration of data from OpenStreetMap succeed. ' + nbInserted + ' elements integrated.',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.INFO
				});
			},
			failure: function(response, options) {
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'An error occured while integrating the data.',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.ERROR
				});
			}
		});
	}
});
