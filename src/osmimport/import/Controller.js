/**
 * ViewController used to manage the Import Panel of OSM Import.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportimport',
	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		this.openner = this.getView().openner;

		/**
         * Init Constants
		 */
		this.OSM_PROJECTION = "EPSG:4326";
		this.NB_FEATURES_MAX = 200;
		
		// Style to be applied by default to the imported data.
		this.DEFAULT_STYLE = new ol.style.Style({
				fill: new ol.style.Fill({
			        color: 'rgba(255, 0, 0, 0.25)'
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
	
		/**
		 * Init the controls from View.
		 */
		this.control({
			"ckosmimportimport button#cancel": {
				click: this.cancel
			},
			"ckosmimportimport treepanel#osmtags-tree": {
				load: this.onTreeOsmTagsLoad,
				checkchange: this.onTreeOsmTagsChange
			},
			"ckosmimportimport button#btnSelection": {
				click: this.onSelectionClick
			},
			"ckosmimportimport button#import": {
				click: this.onImportClick
			}
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
			})
		});
		this.olMap.addLayer(this.selectionVector);
		this.mapInteraction = undefined;
		
		/**
		 * Init the Map Elements for Display results
		 */
		this.displaySource = new ol.source.Vector();
		this.displayVector = new ol.layer.Vector({
			source: this.displaySource,
			style: this.DEFAULT_STYLE
		});
		this.olMap.addLayer(this.displayVector);
		
		/**
		 * Init the Message Boxes attributes.
		 */
		this.waitMsg = undefined;
	},
		
	/**
	 * Hide the import panel
	 */
	cancel: function() {
		this.stopZoneSelection();
		this.openner.close();
	},
	
	/**
	 * Method launched once the tree store is loaded and displayed
	 * Adds a checkbox to each leaf in the tree used to display OSM Tags.
	 */
	onTreeOsmTagsLoad: function(tree) {
		tree.getRootNode().cascadeBy(function(node) {
			if (node.isLeaf()) {
				node.set("checked", false);
			}
		});
	},
	
	/**
	 * Method launched when a node in the OSM Tags Tree is checked or unchecked.
	 * - update the list of checked tags in the ViewModel.
	 */
	onTreeOsmTagsChange: function(node, checked) {
		var vm = this.getViewModel();
		var checkedTags = vm.data.checkedTags;
		var obj = {
			text: node.data.text,
			tag: node.data.tag
		};
		if (checked) {
			checkedTags.push(obj);
		} else {
			var index = -1;
			for (var i = 0; i < checkedTags.length; i++) {
				if (checkedTags[i].tag === obj.tag) {
					index = i;
				}
			}
			if (index > -1) {
				checkedTags.splice(index, 1);
			}
		}
		var textexpert = checkedTags.map(function(a) {return a.tag;}).join(";");
		this.lookupReference("tagsexperttext").setValue(textexpert);
	},
	
	/**
	 * Method used to check that selected tags are corrects
	 */
	checkOsmTags: function() {
		var errorMessage = "";
		var vm = this.getViewModel();
		if (vm.data.checkedTags.length === 0) {  // Check at least one is selected
			errorMessage += " - No OSM tag selected<br/>";
		}
		var tagList = vm.data.checkedTags;
		for (var t = 0; t < tagList.length; t++) {  // Check the RegEx of each tag
			if ((tagList[t].tag.indexOf(";") > -1) ||
				(tagList[t].tag.match(/^(\[["?\w+:?]+=?["\w*:?]*\])+$/g) == null)) {
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
	 * Method called once the user has finished its selection of a geographical zone.
	 * - Converts the coordinates
	 * - Stores the coordinates
	 */
	onSelectionDone: function(evt) {
		var transformGeometry = new ol.geom.Polygon(evt.feature.getGeometry().getCoordinates());
		var coords = transformGeometry.transform(this.olMap.getView().getProjection(), this.OSM_PROJECTION).getCoordinates()[0];
		this.selectionCoords = "";
		for (var i = 0; i < coords.length; i++) {
			this.selectionCoords += coords[i][1] + " " + coords[i][0] + " "; // OSM coords is lat/lon while OpenLayers is lon/lat
		}
		this.stopZoneSelection();
	},
	
	/**
	 * Prepare the selector for the geographical zone according user's configuration.
	 */
	prepareSelector: function() {
		var selectType = Ext.getCmp("selectionMode").items.get(0).getGroupValue();
		var draw, geometryFunction, maxPoints;
		var self = this;

		// Prepare draw interaction and geometryFunction according selection mode
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
		} else if (selectType === "polygone") {
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
		this.olMap.removeInteraction(this.mapInteraction);
		this.mapInteraction = draw;
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
					width: 300,
					wait: {
						interval: 200
					}
				});
				var request = this.prepareRequest();
				this.executeRequest(request);
			}
		} catch (exception) {  // Application is never locked with the "Wait MessageBox" if an error occurs
			console.log(exception);  // TODO remove this debug log
			this.waitMsg.close();
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
		if (this.selectionCoords === "") {
			errorMessage += " - No geographical zone selected<br/>"
		}
		
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
		var vm = this.getViewModel();
		var checkedTags = vm.data.checkedTags;
		
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
			var self = this;
			var olFeatures = [];
			var nbFeaturesImported = 0;
			var checkedTags = this.getViewModel().data.checkedTags;
			for (var r = 0; r < records.length; r++) {
				var record = records[r];
				if (record.containsSearchedTags(checkedTags)) {
					nbFeaturesImported++;
					if (nbFeaturesImported <= this.NB_FEATURES_MAX) {
						var geom = record.calculateGeom();
						feature = new ol.Feature(
							Ext.apply({
								geometry: geom
							}, record.data.tags)
						);
						olFeatures.push(feature);
					}
				}
			}
			this.displayVector.getSource().clear();
			this.displayVector.getSource().addFeatures(olFeatures);
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

		} else {
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
