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
		// Integration Layer
		this.iLayer = {id: undefined,
					   layer: undefined,
					   geometry: undefined,
					   projection: undefined,
					   attributes: []};
		
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
	 * This method ask the server to get informations about the selected layer.
	 * Once done, view is updated to display these informations.
	 */
	readSelectedLayerInformations: function() {
		this.waitMsg = Ext.Msg.show({
			closable: false,
			message: "Loading...",
			wait: {
				interval: 200
			},
			width: 400
		});
		// Initialise integrationLayer
		this.iLayer = {id: undefined,
					   layer: undefined,
					   geometry: undefined,
					   projection: undefined,
					   attributes: []};
	    var selectedLayer = this.lookupReference("layerselection").getValue();
		if (selectedLayer) {
			this.iLayer.id = selectedLayer;
			this.iLayer.layer = Ck.getMap().getLayerById(selectedLayer);
			// Read geometry and call for other informations in case of success
			this.readSelectedLayerGeometry();
		} else { // Set defaults values
			this.updateAttributesTagsList();
			this.lookupReference("geometrylabel").setText("Geometry: " + "undefined");
		}
	},
	
	/**
	 * This method call the server to get the Geometry of the layer.
	 * In case of success call readSelectedLayerInfo
	 */
	readSelectedLayerGeometry: function() {
		var layerSource = this.iLayer.layer.getSource();
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
				var sequence = response.responseXML.getElementsByTagName("sequence")[0];
				var elements = sequence.getElementsByTagName("element");
				for (var elId in elements) {
					var el = elements[elId];
					if (typeof el.getAttribute === "function") {
						if (el.getAttribute("type").startsWith("gml:")) {  // Get the geometry type
							this.iLayer.geometry = el.getAttribute("type")
													 .replace("gml:", "")
													 .replace("PropertyType", "");
							break;
					   }
					}
				}
				this.lookupReference("geometrylabel").setText("Geometry: " + this.iLayer.geometry);

				// Read next part:
				this.readSelectedLayerInfo();
			},
			failure: function(response, opts) {
				this.lookupReference("geometrylabel").setText("Geometry: " + "undefined");
				this.waitMsg.close();
				var msg = "";
				if (response.status == 0) {
					msg = "No connection to Internet available or no response before timeout";
				} else {
					msg = "Unable to read layer information";
				}
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: msg,
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.ERROR
				});
			}
		});
	},

	/**
	 * This method call the server to get the Information of the layer.
	 * Read attributes
	 * Read Projection
	 */	
	readSelectedLayerInfo: function() {
		var layerSource = this.iLayer.layer.getSource();
		Ck.Ajax.get({
			scope: this,
			url: layerSource.url_,
			params: {
				service: "repository",
				request: "getLayer",
				layer: layerSource.getParams().LAYERS
			},
			withCredentials: true,
			useDefaultXhrHeader: false,
			success: function(response) {
				var srs = response.responseXML.getElementsByTagName("SRS")[0].childNodes[0].nodeValue;
				this.iLayer.projection = srs;
				
				var attrs = [];
				var idField = response.responseXML.getElementsByTagName("FeatureId")[0].childNodes[0].nodeValue;
				var fields = response.responseXML.getElementsByTagName("Fields")[0];
				for (var i in fields.childNodes) {
					var field = fields.childNodes[i];
					var tagTypes = ["string", "integer", "boolean"];
					if (typeof field.getElementsByTagName === "function" &&
						tagTypes.indexOf(field.getElementsByTagName("type")[0].childNodes[0].nodeValue) > -1 &&
						field.getElementsByTagName("stAlias")[0].childNodes[0].nodeValue != idField) {
						var attr = {alias: field.getElementsByTagName("alias")[0].childNodes[0].nodeValue,
									attr: field.getElementsByTagName("stAlias")[0].childNodes[0].nodeValue,
									tag: "",
									type: field.getElementsByTagName("type")[0].childNodes[0].nodeValue};
						attrs.push(attr);
					}
				}
				this.iLayer.attributes = attrs;
				this.updateAttributesTagsList();
				
				this.waitMsg.close();
			},
			failure: function(response, opts) {
				this.waitMsg.close();
				var msg = "";
				if (response.status == 0) {
					msg = "No connection to Internet available or no response before timeout";
				} else {
					msg = "Unable to read layer information";
				}
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: msg,
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.ERROR
				});
			}
		});
	},
	
	/** 
	 * Method called when the user changes the selection of layer on which data will be integrated.
	 */
	onLayerSelectionChange: function(combobox, newValue, oldValue, eOpts) {
		this.readSelectedLayerInformations();
	},
	
	/**
	 * This method updates the grid of layer's attributes and OSM data tags.
	 */
	updateAttributesTagsList: function() {
		var records = this.getView().openner.osmapi.getData().items;
		
		// Update attributes
		var layersAttributes = this.getViewModel().data.layersAttributes;
		while (layersAttributes.length > 0) {
			layersAttributes.pop();
		}
		// Sort attributes by alias
		var attributes = Ext.Array.sort(this.iLayer.attributes,
			function(a, b) {
				result = 0;
				if (a.alias > b.alias) result = 1;
				else if (a.alias < b.alias) result = -1;
				return result;
			}
		);
		if (attributes.length > 0) {
			for (var i in attributes) {
				layersAttributes.push(attributes[i]);
			}
		}
		this.lookupReference("attributesgrid").getStore().load();
		
		// Update Tags
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
		
		// Update Buttons
		this.updateAssociationButtons();
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
				if (this.iLayer.id && record.data.members) {
					var integrationGeometryType = this.iLayer.geometry;
					if ((this.lookupReference("geometrytointegrate").getValue().geometrytointegrate == "selectedone") &&
						(["Point", "LineString", "Polygon"].indexOf(this.iLayer.geometry) > -1)) {
						var membersRef = [];
						for (var mId in record.data.members) {
							membersRef.push(record.data.members[mId].ref);
						}
						for (var recId in records) {
							// Add relation tags to determine member's geometry
							var rec = records[recId];
							var membertags = {};
							for (var key in record.data.tags) {
								membertags[key] = record.data.tags[key];
							}
							for (var key in rec.data.tags) {
								membertags[key] = rec.data.tags[key];
							}
							var element = {type: rec.data.type,
										   tags: membertags,
										   geometry: rec.data.geometry,
										   lat: rec.data.lat,
										   lon: rec.data.lon};
							if (membersRef.indexOf(rec.id) > -1 &&
								record.calculateGeom(element, records).getType() == this.iLayer.geometry) {
								var memberKeys = [];
								for (key in rec.data.tags) {
									memberKeys.push("rel:" + key);
								}
								tags = Ext.Array.merge(tags, memberKeys);								
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
			var features = this.convertData(record, this.iLayer.layer, this.allRecords, this.attrTagConfig);
			this.featuresToIntegrate = this.featuresToIntegrate.concat(features);
			this.nbFeaturesComputed++;
			var progress = this.nbFeaturesComputed / this.records.length;
			this.waitMsg.updateProgress(progress, Math.round(progress * 100) + "%");
			if (this.nbFeaturesComputed < this.records.length) {
				Ext.defer(this.computeFeature, 1, this);
			} else {
				if (this.featuresToIntegrate.length > 0) {
					this.saveData(this.iLayer.layer, this.featuresToIntegrate);	
				} else {
					Ext.MessageBox.show({
						title: 'OSM Import',
						msg: 'There are no feature to integrate according the configuration',
						width: 500,
						buttons: Ext.MessageBox.OK,
						icon: Ext.Msg.WARNING
					});
				}
			}
		} catch (exception) {
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
			if (this.iLayer.id) {
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
					message: "Computing data for integration, please wait...",
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
		var features = undefined;
		var integrateAllGeometry = this.lookupReference("selectAllGeometries").checked;
		if (this.iLayer.geometry == "undefined") { // Copy all
			features = data.copyToUndefined(records, attributesTagsConfig);
		} else {
			if (integrateAllGeometry) {  // Need some conversions
				features = data["convertTo" + this.iLayer.geometry](records, attributesTagsConfig);
			} else {  // Copy only if geometry corresponds
				features = data["copyTo" + this.iLayer.geometry](records, attributesTagsConfig);
			}
		}
		
		// Transform into layer's projection.
		if (features != undefined) {
			for (var i in features) {
				var feature = features[i];
				feature.getGeometry().transform(this.OSM_PROJECTION, this.iLayer.projection);
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
			timeout: 120000,
			success: function(response) {
				try {
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
				} catch (exception) {
					this.waitMsg.close();
					Ext.MessageBox.show({
						title: 'OSM Import',
						msg: 'Integration of data from OpenStreetMap succeed. Unable to read response.',
						width: 500,
						buttons: Ext.MessageBox.OK,
						icon: Ext.Msg.WARNING
					});
				}
			},
			failure: function(response, options) {
				var msg = "";
				if (response.status == 0) {
					msg = "No connection to Internet available or no response before timeout";
				} else {
					msg = "An error occured while integrating the data.";
				}
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: msg,
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.ERROR
				});
			}
		});
	}
});
