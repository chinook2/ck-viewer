/**
 * ViewController used to manage the Import Panel of OSM Import.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportimport',
	
	/**
     * Init Constants
	 */
	OSM_PROJECTION: "EPSG:4326",
	NB_FEATURES_MAX: 200,

	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		this.vm = this.getViewModel();
		this.openner = this.getView().openner;

		
		// Style to be applied by default to the imported data.
		this.DEFAULT_STYLE = new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(255, 0, 0, 0.4)'
			}),
			stroke: new ol.style.Stroke({
				color: '#FF0000',
				width: 2
			}),
			image: new ol.style.Circle({
				radius: 7,
				fill: new ol.style.Fill({
					color: 'rgba(255, 0, 0, 0.4)'
				}),
				stroke: new ol.style.Stroke({
					color: '#FF0000',
					width: 2
				})
			})
		});
		
		this.olMap = Ck.getMap().getOlMap();
		/**
		 * Init of the Map Elements for Selection
		 */
		this.selectionCoords = ""; // stores the coordinates of the selection ready to be used in OSM API.
		this.selectionSource = new ol.source.Vector({wrapX:false});
		this.selectionVector = new ol.layer.Vector({
			source: this.selectionSource,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
			        color: 'rgba(255, 255, 255, 0.4)'
			    }),
			    stroke: new ol.style.Stroke({
			        color: '#ffcc33',
			        width: 2
			    }),
			    image: new ol.style.Circle({
			        radius: 7,
			        fill: new ol.style.Fill({
				        color: '#ffcc33'
			        })
			    })
			}),
			id: "osmimport_selection"
		});
		this.olMap.addLayer(this.selectionVector);
		this.mapInteraction = undefined;
		
		/**
		 * Init the Map Elements for Display results
		 */
		this.displaySource = new ol.source.Vector();
		this.displayVector = new ol.layer.Vector({
			source: this.displaySource,
			style: this.DEFAULT_STYLE,
			id: "osmimport_data"
		});
		this.olMap.addLayer(this.displayVector);
		
		/**
		 * Init elements for admin zone selection.
		 */
		var adminAvailable = this.isAdminSelectionAvailable();
		this.vm.data.adminSelectAvailable = adminAvailable;
		
		/**
		 * Init the Message Boxes attributes.
		 */
		this.waitMsg = undefined;
	},
		
	/**
	 * Hide the import panel
	 */
	cancel: function() {
		this.selectionVector.getSource().clear();
		this.stopZoneSelection();
		this.openner.close();
	},
	
	/**
	 * Method launched once the tree store is loaded and displayed
	 * Adds a checkbox to each leaf in the tree used to display OSM Tags.
	 */
	onTreeOsmTagsLoad: function(treestore, records, successful, operation, node, options) {
		treestore.getRootNode().cascadeBy(function(treenode) {
			if (treenode.isLeaf()) {
				treenode.set("checked", false);
			}
		});
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
			var index = -1;
			for (var i = 0; i < checkedTags.length; i++) {
				if (checkedTags[i].tag === obj.tag) {
					index = i;
					break;
				}
			}
			if (index > -1) {
				checkedTags.splice(index, 1);
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
			for (var i in tagsText) {
				var tagObj = {"tag": tagsText[i], "text": "Custom Tag"};
				tagList.push(tagObj);
			}
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
				(tagList[t].tag.match(/^(\[["?\w+\u00C0-\u00FF*:?]+(=|!=)?["\w*\u00C0-\u00FF*:?]*\])+$/g) == null)) {
				error = true;
			} else {  // search other errors
				var key_val = tagList[t].tag.match(/(["?\w+\u00C0-\u00FF*:?]+(=|!=)?["?\w*\u00C0-\u00FF*:?]*)+/g);
				for (var kvId in key_val) {  // Check that each tag is in the selected group
					var kv = key_val[kvId];
					var k = kv.split("=")[0];
					k = k.replace(/!/, "");
					var v = kv.split("=")[1];
					if ((k.match(/[:\u00C0-\u00FF]/g) != null) &&
						(k.charAt(0) != "\"" || k.charAt(k.length - 1) != "\"")) {  // Check correct key ":" or "é"
						error = true;
					}
					if (v) {
						if ((v.match(/[:\u00C0-\u00FF]/g) != null) &&
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
	 * Returns the list of all the layers that can be used for admin selection.
	 */
	getAdminSelectionLayers: function() {
		return Ext.Array.filter(Ck.getMap().getLayers().getArray(), 
			function(layer) {
				return layer.get("admin");
			});
	},
	
	/**
	 * Method to check if the selection of an admin zone is available.
	 */
	isAdminSelectionAvailable: function() {
		return this.getAdminSelectionLayers().length > 0;
	},
	
	/**
	 * Method called once the user has finished its selection of a geographical zone.
	 * - Converts the coordinates
	 * - Stores the coordinates
	 */
	onSelectionDone: function(evt) {
		var selectionGeometry;
		var selectType = this.lookupReference("selectionMode").items.get(0).getGroupValue();
		if (selectType === "admin") {
			if (evt.selected.length > 0) {
				var featureGeom = evt.selected[0].getGeometry();
				if (featureGeom.getType() === "Polygon") {
					selectionGeometry = featureGeom.getCoordinates();
				} else if (featureGeom.getType() === "MultiPolygon") {
					var coords = [];
					var multipoly = featureGeom.getCoordinates();
					for (var poly in multipoly) {
						for (var coord in multipoly[poly][0]) {
							coords.push(multipoly[poly][0][coord]);
						}
					}
					selectionGeometry = [coords];
				}
			}
			if (selectionGeometry) {  // Selection success
				this.selectionVector.getSource().clear();
				this.selectionVector.getSource().addFeature(evt.selected[0]);
			} else {  // Select other geometry or click on place where there is no feature
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'Incorrect selection. You shall select one Polygon or MultiPolygon',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.ERROR
				});
			}
		} else {
			selectionGeometry = evt.feature.getGeometry().getCoordinates();
		}
		if (selectionGeometry) {
			var transformGeometry = new ol.geom.Polygon(selectionGeometry);
			var coords = transformGeometry.transform(this.olMap.getView().getProjection(), this.OSM_PROJECTION).getCoordinates()[0];
			this.selectionCoords = "";
			for (var i = 0; i < coords.length; i++) {
				this.selectionCoords += coords[i][1] + " " + coords[i][0] + " "; // OSM coords is lat/lon while OpenLayers is lon/lat
			}
		}
		this.stopZoneSelection();
	},
	
	/**
	 * Prepare the selector for the geographical zone according user's configuration.
	 */
	prepareSelector: function() {
		var selectType = this.lookupReference("selectionMode").items.get(0).getGroupValue();
		var self = this;
		var newInteraction;

		// Prepare draw interaction and geometryFunction according selection mode
		if (selectType === "admin") {
			newInteraction = new ol.interaction.Select({
				layers: this.getAdminSelectionLayers()
			});
			newInteraction.on("select", this.onSelectionDone, this);
		} else {
			var draw, geometryFunction, maxPoints;
			if (selectType === "rectangle") {
				maxPoints = 2;
				selectType = "LineString";
				geometryFunction = function(coordinates, geometry) {
					self.selectionSource.clear();
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
			} else if (selectType === "polygon") {
				selectType = "Polygon";
				geometryFunction = function(coordinates, geometry) {
					self.selectionSource.clear();
					if (!geometry) {
						geometry = new ol.geom.Polygon(null);
					}
					geometry.setCoordinates(coordinates);
					return geometry;
				};
			}

			draw = new ol.interaction.Draw({
				source: self.selectionSource,
				type: /** @type {ol.geom.GeometryType} */ (selectType),
				geometryFunction: geometryFunction,
				maxPoints: maxPoints
			});
			draw.on('drawend', this.onSelectionDone, this);
			newInteraction = draw;
		}
		this.olMap.removeInteraction(this.mapInteraction);
		this.mapInteraction = newInteraction;
        this.olMap.addInteraction(this.mapInteraction);
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
		if (this.selectionCoords === "") {
			errorMessage += " - No geographical zone selected<br/>"
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
				this.stopZoneSelection();
				this.waitMsg = Ext.Msg.show({
					msg: 'Importing data from OpenStreetMap, please wait...',
					autoShow: true,
					width: 300,
					wait: {
						interval: 200
					}
				});
				var request = this.prepareRequest();
				this.executeRequest(request);
			}
		} catch (exception) {  // Application is never locked with the "Wait MessageBox" if an error occurs
			console.log(exception.stack);  // TODO remove this debug log
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
		
		// Prepare date filter
		var minDateString = "";
		var minDate = this.lookupReference("datemin").getValue();
		if (this.lookupReference("sincedate").checked == true && minDate !== null) {
			minDateString = '(newer:"'+ Ext.Date.format(minDate, 'Y-m-d') + 'T00:00:00Z")';
		}
		
		// Prepare the request
		var request = "[out:json];";
		request += "(";
		for (var i = 0; i < checkedTags.length; i++) {
			request += 'node' + checkedTags[i].tag + '(poly:"' + this.selectionCoords + '")' + minDateString + ';';
			request += 'way' + checkedTags[i].tag + '(poly:"' + this.selectionCoords + '")' + minDateString + ';';
			request += 'rel' + checkedTags[i].tag + '(poly:"' + this.selectionCoords + '")' + minDateString + ';';
		}
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
				var olFeatures = [];
				var nbFeaturesImported = 0;
				var checkedTags = this.getSelectedTags();
		
				for (var r = 0; r < records.length; r++) {
					var record = records[r];
					if (record.containsSearchedTags(checkedTags)) {
						nbFeaturesImported++;
						if (nbFeaturesImported <= this.NB_FEATURES_MAX) {
							var newProjection = Ck.getMap().getOlMap().getView().getProjection();
							var geom = record.calculateGeom(undefined, records);
							if (geom != undefined) {
								geom.transform(this.OSM_PROJECTION, newProjection);
							}
							var feature = new ol.Feature(geom);
							olFeatures.push(feature);
						}
					}
				}
				this.displayVector.getSource().clear();
				this.displayVector.getSource().addFeatures(olFeatures);
				
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
				
			} catch (exception) {
				console.log(exception.stack);  // TODO remove this debug log
				Ext.MessageBox.show({
					title: 'OSM Import',
					msg: 'An error occured while computing the imported data.',
					width: 500,
					buttons: Ext.MessageBox.OK,
					icon: Ext.Msg.ERROR
				});
			} finally {
				// Manage messages for end of import
				this.waitMsg.close();
				if (nbFeaturesImported === 0) {  // No Result
					Ext.MessageBox.show({
						title: 'OSM Import',
						msg: 'Import data from OpenStreetMap succeed.<br/>No data found for the selection',
						width: 500,
						buttons: Ext.MessageBox.OK,
						icon: Ext.Msg.WARNING
					});
				} else if (nbFeaturesImported > this.NB_FEATURES_MAX) {  // Too Much features for the layer
					Ext.MessageBox.show({
						title: 'OSM Import',
						msg: 'Import data from OpenStreetMap succeed and returned ' + nbFeaturesImported + ' elements.<br/>'
							 + 'Only the ' + this.NB_FEATURES_MAX + ' first elements will be displayed',
						width: 500,
						buttons: Ext.MessageBox.OK,
						icon: Ext.Msg.WARNING
					});
					this.openner.finishImport();
				} else {
					Ext.MessageBox.show({
						title: 'OSM Import',
						msg: 'Import data from OpenStreetMap succeed and returned ' + nbFeaturesImported + ' elements.',
						width: 500,
						buttons: Ext.MessageBox.OK,
						icon: Ext.Msg.INFO
					});
					this.openner.finishImport();
				}
			}

		} else {  // Request failed
			this.waitMsg.close();
			var statusCode = operation.getError().status;
			var errorMessage = "";
			if (statusCode === 0) {
				errorMessage = "No connection to Internet available"
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
	}
});
