/**
 * ViewController used to manage the Import Panel of OSM Import.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportimport',

	/**
     * Constants
	 */
	OSM_PROJECTION: "EPSG:4326",
	NB_FEATURES_MAX: 200,
	// Style to be applied by default to the imported data.
	DEFAULT_STYLE: new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(255, 0, 0, 0.4)'
		}),
		stroke: new ol.style.Stroke({
			color: 'rgb(255, 0, 0)',
			width: 2
		}),
		image: new ol.style.Circle({
			radius: 7,
			fill: new ol.style.Fill({
				color: 'rgba(255, 0, 0, 0.4)'
			}),
			stroke: new ol.style.Stroke({
				color: 'rgb(255, 0, 0)',
				width: 2
			})
		})
	}),
	OSM_SEL_LYR_ID: "osmimport_selection",
	OSM_DATA_LYR_ID: "osmimport_data",
	
	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		this.vm = this.getViewModel();
		this.openner = this.getView().openner;
		this.olMap = Ck.getMap().getOlMap();
		
		// Init of the Map Elements for Selection
		if (Ck.getMap().getLayerById(this.OSM_SEL_LYR_ID)) {
			this.selectionVector = Ck.getMap().getLayerById(this.OSM_SEL_LYR_ID);
			this.selectionSource = this.selectionVector.getSource();
		} else {
			this.selectionSource = new ol.source.Vector({wrapX:false});
			this.selectionVector = new ol.layer.Vector({
				source: this.selectionSource,
				style: new ol.style.Style({
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.4)'
					}),
					stroke: new ol.style.Stroke({
						color: 'rgb(255, 204, 51)',
						width: 2
					}),
					image: new ol.style.Circle({
						radius: 7,
						fill: new ol.style.Fill({
							color: 'rgb(255, 204, 51)'
						})
					})
				}),
				id: this.OSM_SEL_LYR_ID
			});
			this.olMap.addLayer(this.selectionVector);
		}
		this.mapInteraction = undefined;
		
		/**
		 * Init the Map Elements for Display results
		 */
		if (Ck.getMap().getLayerById(this.OSM_DATA_LYR_ID)) {
			this.displayVector = Ck.getMap().getLayerById(this.OSM_DATA_LYR_ID);
		} else  {
			this.displaySource = new ol.source.Vector();
			this.displayVector = new ol.layer.Vector({
				source: this.displaySource,
				style: this.DEFAULT_STYLE,
				id: this.OSM_DATA_LYR_ID
			});
			this.olMap.addLayer(this.displayVector);
		}
		
		/**
		 * Init the Message Boxes attributes.
		 */
		this.waitMsg = undefined;
	},
		
	/**
	 * Method launched on cancel click.
	 * Hide the import panel
	 */
	cancel: function() {
		this.selectionVector.getSource().clear();
		this.stopZoneSelection();
		this.openner.close();
	},
	
	/**
	 * Method launched when a node in the OSM Tags Tree is checked or unchecked.
	 * - update the list of checked tags in the ViewModel.
	 */
	onTreeOsmTagsChange: function(node, checked) {
		var checkedTags = this.vm.data.checkedTags;
		var obj = {
			text: node.data.text,
			tag: node.data.tag
		};
		if (checked) {  // Add the tag
			checkedTags.push(obj);
		} else {  // Remove the tag			
			for (var i = 0; i < checkedTags.length; i++) {
				if (checkedTags[i].tag === obj.tag) {
					checkedTags.splice(i, 1);
					break;
				}
			}
		}
		var textexpert = checkedTags.map(function(a) {return a.tag;}).join(";");
		this.lookupReference("tagsexperttext").setValue(textexpert);
		this.lookupReference("checkedtagslist").getStore().load();
	},
	
	/**
	 * Method returning the list of all the selected tag.
	 * Whatever the mode: classic or expert.
	 */
	getSelectedTags: function() {
		var tagList = [];
		if (this.lookupReference("tagsexpert").getValue()) {  // Expert Mode
			var tagsText = this.lookupReference("tagsexperttext").getValue().split(";");
			tagsText.forEach(function(tag) {
				var tagObj = {"tag": tag, "text": "Custom Tag"};
				tagList.push(tagObj);
			});
		} else {  // Classic Mode
			tagList = this.vm.data.checkedTags;
		}
		return tagList;
	},
	
	/**
	 * Method used to check that selected tags are corrects
	 */
	checkOsmTags: function() {
		var errorMessage = "";
		var tagList = this.getSelectedTags();
		if (tagList.length === 0) {  // Check at least one is selected
			errorMessage += " - No OSM tag selected<br/>";
		}
		for (var t = 0; t < tagList.length; t++) {  // Check the RegEx of each tag
			var error = false;
			if ((tagList[t].tag.indexOf(";") > -1) ||
				(tagList[t].tag.match(/^(\[["?\w+\u00C0-\u00FF*:?]+(=|!=)?["\w\u00C0-\u00FF:'\-#]*\])+$/g) === null)) {
				error = true;
			} else {  // search other errors
				var key_val = tagList[t].tag.match(/(["?\w+\u00C0-\u00FF*:?]+(=|!=)?["\w\u00C0-\u00FF:'\-#]*)+/g);
				for (var kvId in key_val) {  // Check that each tag is in the selected group
					var kv = key_val[kvId];
					var k = kv.split("=")[0];
					k = k.replace(/!/, "");
					var v = kv.split("=")[1];
					if ((k.match(/[:\u00C0-\u00FF]/g) !== null) &&
						(k.charAt(0) != "\"" || k.charAt(k.length - 1) != "\"")) {  // Check correct key ":" or "é"
						error = true;
					}
					if (v) {
						if ((v.match(/[:#'\u00C0-\u00FF]/g) !== null) &&
							(v.charAt(0) != "\"" || v.charAt(v.length - 1) != "\"")) {  // Check correct value ":" or "é"
							error = true;
						}
					} else {
						if (key_val[kvId].match(/(=|!=)/)) {  // no [key=] or [key!=]
							error = true;
						}
					}
				}
			}
			if (error) {
				errorMessage += ' - Tag "' + tagList[t].text + '" is incorrect<br/>';
			}
		}
		return errorMessage;
	},
	
	/**
	 * Method launched when user clicks on the "Selection" button.
	 */
	onSelectionClick: function(btn) {
		this.openner.collapse();
		this.prepareSelector();
	},
	
	/**
	 * Prepare the selector for the geographical zone according user's configuration.
	 */
	prepareSelector: function() {
		var selectType = this.lookupReference("selectionMode").items.get(0).getGroupValue();

		// Prepare draw interaction and geometryFunction according selection mode
		var selectMode, draw, geometryFunction, maxPoints, source;
		switch (selectType) {
			case "rectangle":
				source = this.selectionVector.getSource();
				maxPoints = 2;
				selectMode = "LineString";
				geometryFunction = function(coordinates, geometry) {
					if (!geometry) {
						geometry = new ol.geom.Polygon(null);
					}
					var start = coordinates[0];
					var end = coordinates[1];
					geometry.setCoordinates([
						[start, [start[0], end[1]], end, [end[0], start[1]], start]
					]);
					return geometry;
				};
			break;
			case "polygon":
				source = this.selectionVector.getSource();
				selectMode = "Polygon";
				geometryFunction = function(coordinates, geometry) {
					if (!geometry) {
						geometry = new ol.geom.Polygon(null);
					}
					geometry.setCoordinates(coordinates);
					return geometry;
				};
			break;
			case "feature": selectMode = "Point";
			break;
			default:
			break;
		}

		if (selectMode) {
			draw = new ol.interaction.Draw({
				source: source,
				type: selectMode,
				geometryFunction: geometryFunction,
				maxPoints: maxPoints
			});
			draw.on('drawend', this.onSelectionDone, this);

			this.olMap.removeInteraction(this.mapInteraction);
			this.mapInteraction = draw;
			this.olMap.addInteraction(this.mapInteraction);
		}
	},
	
	/**
	 * Method called once the user has finished its selection of a geographical zone.
	 * - Converts the coordinates
	 * - Stores the coordinates
	 */
	onSelectionDone: function(evt) {
		this.stopZoneSelection();
		this.selectionVector.getSource().clear();
		var selectType = this.lookupReference("selectionMode").items.get(0).getGroupValue();

		// Nothing else to do for Polygon and Rectangle selection

		if (selectType === "feature") {  // Polygon feature selection
			// List of Vector and WMS Layers (in correct order)
			this.selectionLayers = Ck.getMap().getLayers(function(lyr) {
				return (lyr.getVisible() && (lyr instanceof ol.layer.Vector || lyr instanceof ol.layer.Image) &&
											lyr.get("id") != "measureLayer" &&
											lyr.get("id") != this.OSM_SEL_LYR_ID &&
											lyr.get("id") != this.OSM_DATA_LYR_ID);
			}).getArray().reverse();
			
			if (this.selectionLayers.length > 0) {
				this.waitMsg = Ext.Msg.show({
					msg: 'Computing feature selection, please wait...',
					autoShow: true,
					width: 400,
					wait: {
						interval: 200
					}
				});
				
				// Create a polygon around the drawn point
				var ft = evt.feature.getGeometry();
				ft.transform(Ck.getMap().getProjection().code_, "EPSG:3857");  // Goes in a projection which use meters.
				ft = new ol.geom.Circle(ft.getCoordinates(), 10);  // Create a circle with given point as center.
				this.selectionPoly = ol.geom.Polygon.fromExtent(ft.getExtent());  // Create square inside the circle. starts with 45° angle (0.78 rad)
				this.selectionPoly.transform("EPSG:3857", Ck.getMap().getProjection().code_);
				
				this.currentSelectionLayerIndex = 0;
				Ext.defer(this.computeFeatureSelection, 1, this);
			} else {
				this.showPolygonFeatureSelectionError();
			}
		} 
	},

	/**
	 * This method is called for each layer to check if a polygon feature can be selected.
	 * If no feature is selected at the end of this method, call again with next layer or stop if there is no more layer
	 * Use: 
	 *  * this.selectionLayers: list of all layers to check
	 *  * this.currentSelectionLayerIndex: index of the current layer to check in the previous list
	 *  * this.selectionPoly: polygon around the point set by user for the selection
	 *  * this.waitMsg: Pop-up to indicate to user to wait
	 */
	computeFeatureSelection: function() {
		var featureGeom;
		var geoJSON = new ol.format.GeoJSON();
		var layer = this.selectionLayers[this.currentSelectionLayerIndex];
				
		if (layer instanceof ol.layer.Vector) {  // Vector Layer
			var polyTurf = {type: "Feature",
							properties: {},
							geometry: {
								coordinates: this.selectionPoly.getCoordinates(),
								type: this.selectionPoly.getType()
							}};
			var lyrFts = layer.getSource().getFeatures();
			for (var j = 0; j < lyrFts.length; j++) {
				var lyrFt = geoJSON.writeFeatureObject(lyrFts[j]);
				if (["Polygon", "MultiPolygon"].indexOf(lyrFt.geometry.type) > -1 &&
					turf.intersect(lyrFt, polyTurf)) {
					featureGeom = lyrFts[j];
					break;
				}
			}
			this.computeFeatureGeom(featureGeom);
		} else if (layer instanceof ol.layer.Image) {  // WMS layer
			var wfs = new ol.format.WFS();
			var getFtXml = wfs.writeGetFeature({
				featureTypes: [layer.getSource().getParams().LAYERS],
				srsName: Ck.getMap().getProjection().code_,
				bbox: this.selectionPoly.getExtent(),
				geometryName: "the_geom"
			});
			var oSerializer = new XMLSerializer();
			getFtXml = oSerializer.serializeToString(getFtXml);
			// TODO check if all the following replacements are necessary
			getFtXml = getFtXml.replace(/<Filter/g, "<ogc:Filter").replace(/<\/Filter/g, "</ogc:Filter");
			getFtXml = getFtXml.replace(/<BBOX/g, "<ogc:BBOX").replace(/<\/BBOX/g, "</ogc:BBOX");
			getFtXml = getFtXml.replace(/<PropertyName/g, "<ogc:PropertyName").replace(/<\/PropertyName/g, "</ogc:PropertyName");
			getFtXml = getFtXml.replace(/<Envelope/g, "<gml:Envelope").replace(/<\/Envelope/g, "</gml:Envelope");
			getFtXml = getFtXml.replace(/<lowerCorner/g, "<gml:lowerCorner").replace(/<\/lowerCorner/g, "</gml:lowerCorner");
			getFtXml = getFtXml.replace(/<upperCorner/g, "<gml:upperCorner").replace(/<\/upperCorner/g, "</gml:upperCorner");
			getFtXml = getFtXml.replace("xmlns=\"http://www.opengis.net/ogc", "xmlns:ogc=\"http://www.opengis.net/ogc");
			getFtXml = getFtXml.replace("xmlns=\"http://www.opengis.net/gml", "xmlns:gml=\"http://www.opengis.net/gml");
			Ck.Ajax.post({
				scope: this,
				url: layer.getSource().url_,
				xmlData: getFtXml,
				withCredentials: true,  // TODO remove cross-domain
				useDefaultXhrHeader: false,  // TODO remove cross-domain
				timeout: 120000,
				success: function(response) {
					var features = wfs.readFeatures(response.responseXML);
					if (features.length > 0) {
						if (["Polygon", "MultiPolygon"].indexOf(features[0].getGeometry().getType()) > -1) {
							featureGeom = features[0];
							this.selectionVector.getSource().addFeature(featureGeom);
						}
					}
					this.computeFeatureGeom(featureGeom);
				},
				failure: function(response, options) {
					console.log("fail to get the layer feature");
				}
			});
		}
	},
	
	/** Compute results on Layer feature selection 
	 * Call next layer if no feature found
	 */
	computeFeatureGeom: function(featureGeom) {
		// Get polygon coordinates (transform multipolygon in polygon)
		if (featureGeom) {
			// Draw the selected feature in highlight
			this.selectionVector.getSource().addFeature(featureGeom);
			this.waitMsg.close();
		} else {  // No feature found in this layer, go to next
			this.currentSelectionLayerIndex++;
			if (this.currentSelectionLayerIndex < this.selectionLayers.length) {
				Ext.defer(this.computeFeatureSelection, 1, this);
			} else {
				this.waitMsg.close();
				this.showPolygonFeatureSelectionError();
			}
		}
	},
	
	/** Method to show an error for polygon Feature selection.
	 */
	showPolygonFeatureSelectionError: function() {
		Ext.MessageBox.show({
			title: 'OSM Import',
			msg: 'Incorrect selection. You shall select one Polygon or MultiPolygon',
			width: 500,
			buttons: Ext.MessageBox.OK,
			icon: Ext.Msg.ERROR
		});
	},
	
	/**
	 * Method to remove the interaction on map for the geographical zone selection.
	 * Used on several actions (cancel, import done)
	 */
	stopZoneSelection: function() {
		this.olMap.removeInteraction(this.mapInteraction);
		this.mapInteraction = undefined;
	},
	
	/**
	 * Method checks if the selection is correct to be used for the import
	 */
	checkSelection: function() {
		var errorMessage = "";
		if (this.selectionSource.getFeatures().length === 0) {
			errorMessage += " - No geographical zone selected<br/>";
		}
		return errorMessage;
	},

	/**
	 * Method called when user clicks on Import Button.
	 * Execute the import of data from OSM
	 */
	onImportClick: function(btn) {
		try {
			var paramsOK = this.checkParams();
			if (paramsOK) {
				this.waitMsg = Ext.Msg.show({
					msg: 'Importing data from OpenStreetMap, please wait...',
					autoShow: true,
					width: 400,
					wait: {
						interval: 200
					}
				});
				var request = this.prepareRequest();
				this.executeRequest(request);
				this.stopZoneSelection();
			}
		} catch (exception) {  // Application is never locked with the "Wait MessageBox" if an error occurs
			if (this.waitMsg) {
				this.waitMsg.close();
			}
			Ext.MessageBox.show({
				title: 'OSM Import',
				msg: 'An error occured while importing the data.',
				width: 500,
				buttons: Ext.MessageBox.OK,
				icon: Ext.Msg.ERROR
			});
		}
	},
	
	/**
	 * Method used to check that every param configured by user is correct to perform the import.
	 */
	checkParams: function() {
		var paramsOK = true;
		var errorMessage = "";
		
		// Execute Checks
		errorMessage += this.checkOsmTags();
		errorMessage += this.checkSelection();
		
		// Display Error Message in case of error
		if (errorMessage.length > 0) {
			paramsOK = false;
			Ext.MessageBox.show({
				title: 'OSM Import',
				msg: "Import can't be executed. Some parameters are incorrect:<br/>" + errorMessage,
				width: 500,
				buttons: Ext.MessageBox.OK,
				icon: Ext.Msg.ERROR
			});
		}
		return paramsOK;
	},
	
	/**
	 * Prepares the request for OSM.
	 * Return the request ready to be sent to OSM.
	 */
	prepareRequest: function() {
		var checkedTags = this.getSelectedTags();
		// Prepare geo zone 
		var poly = "";
		var selectionZone = this.selectionSource.getFeatures()[0];
		if (selectionZone.getGeometry() instanceof ol.geom.Polygon) {
			var transformGeometry = new ol.geom.Polygon(selectionZone.getGeometry().getCoordinates());
			var coords = transformGeometry.transform(this.olMap.getView().getProjection(), this.OSM_PROJECTION).getCoordinates()[0];
			coords.forEach(function(coord) {
				poly += coord[1] + " " + coord[0] + " "; // OSM coords is lat/lon while OpenLayers is lon/lat
			});
		} else { // MultiPolygon
			var transformGeometry = new ol.geom.MultiPolygon(selectionZone.getGeometry().getCoordinates());
			var coords = transformGeometry.transform(this.olMap.getView().getProjection(), this.OSM_PROJECTION).getCoordinates();
			coords.forEach(function(polygon) {
				polygon[0].forEach(function(coord) {
					poly += coord[1] + " " + coord[0] + " "; // OSM coords is lat/lon while OpenLayers is lon/lat
				});
			});
		}
		// Prepare date filter
		var minDateString = "";
		var minDate = this.lookupReference("datemin").getValue();
		if (this.lookupReference("sincedate").checked === true && minDate !== null) {
			minDateString = '(newer:"'+ Ext.Date.format(minDate, 'Y-m-d') + 'T00:00:00Z")';
		}

		// Prepare the request
		var request = "[out:json];";
		request += "(";
		checkedTags.forEach(function(tag) {
			request += 'node' + tag.tag + '(poly:"' + poly + '")' + minDateString + ';';
			request += 'way' + tag.tag + '(poly:"' + poly + '")' + minDateString + ';';
			request += 'rel' + tag.tag + '(poly:"' + poly + '")' + minDateString + ';';
		});
		request += ");";
		request += "(._;>;);";
		request += "out geom;";
		return request;
	},
	
	/**
	 * Executes the request on OSM.
	 */
	executeRequest: function(request) {
		var store = this.openner.osmapi;
		store.getProxy().setExtraParam("data", request);
		store.load({
			scope: this,
			callback: this.onRequestFinished
		});
	},
	
	/**
	 * Method called when the request on OSM is finished.
	 * Display data or error according the request results.
	 */
	onRequestFinished: function(records, operation, success) {
		this.openner.close();
		if (success) {
			try {
				this.waitMsg.close();
				this.nbFeaturesImported = 0;
				var checkedTags = this.getSelectedTags();
				this.olFeatures = [];
				this.nbRecordComputed = 0;
				if (records.length > 0) {
					this.waitMsg = Ext.Msg.show({
						closable: false,
						message: "Computing received data, please wait...",
						progress: true,
						progressText: "0%",
						width: 400
					});
					this.records = Ext.Array.filter(records,
						function(record) {return record.containsSearchedTags(checkedTags);}
					);
					this.allRecords = records;
					// Compute each record in a defered call to update the progress bar
					Ext.defer(this.computeRecord, 1, this);
				} else {  // No Result found
					Ext.MessageBox.show({
						title: 'OSM Import',
						msg: 'Import data from OpenStreetMap succeed.<br/>No data found for the selection',
						width: 500,
						buttons: Ext.MessageBox.OK,
						icon: Ext.Msg.WARNING
					});
				}
			} catch (exception) {
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'An error occured while computing the imported data.',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.ERROR
				});
				if (this.waitMsg) {
					this.waitMsg.close();
				}
			}

		} else {  // Request failed
			this.waitMsg.close();
			var statusCode = operation.getError().status;
			var errorMessage = "";
			if (statusCode === 0) {
				errorMessage = "No connection to Internet available or no response before timeout";
			} else if (statusCode === 400) {
				errorMessage = "Error in the OSM request";
			}
			Ext.MessageBox.show({
				title: 'OSM Import',
				msg: 'An error occured during import. ' + errorMessage,
				width: 500,
				buttons: Ext.MessageBox.OK,
				icon: Ext.Msg.ERROR
			});
		}
	},
	
	/**
	 * This method compute a record from imported data.
	 * This record shall be a tag which contains the searched tags.
	 * Once the record is computed, progress bar is updated
	 * and the method call the next record or ends the import is there is no more records.
	 */
	computeRecord: function() {
		try {
			var record = this.records[this.nbRecordComputed];
			this.nbFeaturesImported++;
			if (this.nbFeaturesImported <= this.NB_FEATURES_MAX) {
				var newProjection = Ck.getMap().getOlMap().getView().getProjection();
				var geom = record.calculateGeom(undefined, this.allRecords);
				if (geom !== undefined) {
					geom.transform(this.OSM_PROJECTION, newProjection);
					// Don't display GeometryCollection to not disturb selection
					if (geom instanceof ol.geom.GeometryCollection) {
						geom.getGeometries().forEach(function(member) {
							var feature = new ol.Feature(member);
							this.olFeatures.push(feature);
						}, this);
					} else {
						var feature = new ol.Feature(geom);
						this.olFeatures.push(feature);
					}
				}
			}
			this.nbRecordComputed++;
			var progress = this.nbRecordComputed / this.records.length;
			this.waitMsg.updateProgress(progress, Math.round(progress * 100) + "%");
			if (this.nbRecordComputed < this.records.length) {
				Ext.defer(this.computeRecord, 1, this);
			} else {
				Ext.defer(this.endImport, 1, this);
			}
		} catch (exception) {
			Ext.MessageBox.show({
				title: 'OSM Import',
				msg: 'An error occured during import.',
				width: 500,
				buttons: Ext.MessageBox.OK,
				icon: Ext.Msg.ERROR
			});
		}
	},
	
	/**
	 * This method ends the import, by displaying all the records 
	 * and applying the correct style.
	 */
	endImport: function() {
		try {
			this.displayVector.getSource().clear();
			this.displayVector.getSource().addFeatures(this.olFeatures);
			
			// Apply rendering style to the imported data
			var style = this.DEFAULT_STYLE;
			var renderingName = this.lookupReference("rendering").getValue();
			if (renderingName) {
				var renderingStore = this.vm.getStore("renderings");
				var rendering = renderingStore.findRecord("name", renderingName, false, false, false, true);
				if (rendering.isValid()) {
					style = new ol.style.Style({
						fill: new ol.style.Fill({
							color: rendering.data.fillcolor
						}),
						stroke: new ol.style.Stroke({
							color: rendering.data.strokecolor,
							width: 2
						}),
						image: new ol.style.Circle({
							radius: 7,
							fill: new ol.style.Fill({
								color: rendering.data.fillcolor
							}),
							stroke: new ol.style.Stroke({
								color: rendering.data.strokecolor,
								width: 2
							})
						})
					});
				}
			}
			this.displayVector.setStyle(style);
			if (this.nbFeaturesImported > this.NB_FEATURES_MAX) {  // Too Much features for the layer
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'Import data from OpenStreetMap succeed and returned ' + this.nbFeaturesImported + ' elements.<br/>' +
						 'Only the ' + this.NB_FEATURES_MAX + ' first elements will be displayed',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.WARNING
				});
				this.openner.finishImport();
			} else {
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'Import data from OpenStreetMap succeed and returned ' + this.nbFeaturesImported + ' elements.',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.INFO
				});
				this.openner.finishImport();
			}
		} catch (exception) {
			Ext.MessageBox.show({
				title: 'OSM Import',
				msg: 'An error occured during import.',
				width: 500,
				buttons: Ext.MessageBox.OK,
				icon: Ext.Msg.ERROR
			});
		}
	}
});
