/**
 * Controller what manage multiple-feature layer modification.
 * To edit the multi-feature layer easily we create a layer to host simple feature.
 * In short we manipulate an ol.source.Vector (of simple geom) instead of an ol.Feature of Multi[type]
 */
Ext.define('Ck.edit.feature.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckedit.feature',
	
	maxLength: 12,
	
	/**
	 * Say if change occurred
	 */
	featureChanged: false,
	
	/**
	 * The original feature from this.layer
	 * @property {ol.Feature}
	 */
	feature: null,
	
	/**
	 * @event validate
	 * Fires when user want to save feature change
	 * @param {ol.Feature}
	 * @param {Boolean} Say if the feature is changed
	 */
	
	/**
	 * @event cancel
	 * Fires when user want to discard feature change
	 * @param {ol.Feature}
	 */
	
	/**
	 * @event sessionstart
	 * Fires at begin of feature session
	 * @param {ol.Feature}
	 */
	 
	/**
	 * @event featurecrop
	 * Fires after feature cropping
	 * @param {ol.Feature}
	 */
	 
	/**
	 * @event featureunion
	 * Fires after feature gathering
	 * @param {ol.Feature}
	 */
	
	/**
	 * @event featurecreate
	 * Fires after feature creation
	 * @param {ol.Feature}
	 */
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.olMap = Ck.getMap().getOlMap();
		this.layer = view.layer;
		this.editController = view.editController;
		
		this.grid = view.items.get(0);
		this.store = this.grid.getStore();
		this.multi = this.editController.multi;
		
		this.control({
			"ckedit-feature button#save": {
				click: this.save,
				scope: this
			},
			"ckedit-feature button#cancel": {
				click: this.cancel,
				scope: this
			},
			// "ckedit-feature button#create": {
				// click: this.startDrawing,
				// scope: this
			// },
			"ckedit-feature button#geometry": {
				click: this.editVertex,
				scope: this
			},
			"ckedit-feature button#delete": {
				click: this.deleteSelectedFeature,
				scope: this
			}
		});
		
		var featureLayerId = view.config.layer.getProperties().id + "_subgeom-marker";
		this.overlayLayer = Ck.getMap().getLayerById(featureLayerId);
		
		// Layer to frame focused feature
		if(!this.overlayLayer) {
			this.overlayLayer = Ck.create("ol.layer.Vector", {
				id: featureLayerId,
				source: new ol.source.Vector(),
				style: Ck.map.Style.overlayStyle,
				zIndex: Ck.map.Style.zIndex.featureOverlay
			});
			
			this.overlaySource = this.overlayLayer.getSource();
			this.overlayLayer.setMap(this.olMap);
		}
		
		if(!this.cloneLayer) {
			this.cloneLayer = Ck.create("ol.layer.Vector", {
				id: this.layer.getProperties().id + "_clone-editor",
				source: new ol.source.Vector(),
				// style: Ck.map.Style.overlayStyle,
				style: ol.interaction.Select.getDefaultStyleFunction(),
				zIndex: Ck.map.Style.zIndex.cloneLayer
			});
			this.source = this.cloneLayer.getSource();
			this.getMap().addSpecialLayer(this.cloneLayer);
		}

		this.on("featurecrop", function() {
			this.features = this.source.getFeatures();
			this.feedGridFromFeatures();
		}, this);
		
		this.on("featureunion", function() {
			this.features = this.source.getFeatures();
			this.feedGridFromFeatures();
		}, this);		
		
		this.on("featurecreate", function(feature) {
			this.source.addFeature(feature);
			this.features = this.source.getFeatures();
			this.feedGridFromFeatures();
		}, this);
		
		// TODO : selection interaction to ease edition
		this.selectInteraction = Ck.create("ol.interaction.Interaction", {handleEvent: Ext.emptyFn});
	},
	
	/**
	 * Start the feature session edit for the passed feature
	 * @param {ol.Feature}
	 */
	loadFeature: function(feature) {
		this.fireEvent("sessionstart", feature);
		
		this.feature = feature;
		
		// We loop on all sub-geom to create ol.Feature from them
		var geoms = feature.getGeometry().getPolygons();
		this.features = [];
		for(var i = 0; i < geoms.length; i++) {
			this.features.push(Ck.create("ol.Feature", { geometry: geoms[i] }));
		}
		this.source.addFeatures(this.features);
		
		this.feedGridFromFeatures();
		
		// Remove original feature
		this.layer.getSource().removeFeature(this.feature);
		
		
		this.gridEvent = this.grid.on({
			destroyable: true,
			select: {
				fn: this.updateMarker,
				scope: this
			},
			itemkeydown: {
				fn: this.keyInteraction,
				scope: this
			}
		});
		
		this.storeEvent = this.store.on({
			destroyable: true,
			remove: {
				fn: this.featureDeleted,
				scope: this
			}
		});
		
		// Initialize crop and union interaction
		this.crop = Ck.getAction("ckEditCrop");
		this.crop.multi = this.multi;
		this.crop.createInteraction({
			layers: [this.cloneLayer]
		});
		
		this.union = Ck.getAction("ckEditUnion");
		this.union.multi = this.multi;
		this.union.createInteraction({
			layers: [this.cloneLayer],
			filter: function(ft, lyr) {
				return lyr == this.cloneLayer;
			}.bind(this)
		});
		
		this.create = Ck.getAction("ckEditCreate");
		this.create.multi = this.multi;
		this.create.layer = this.cloneLayer;
	},
	
	feedGridFromFeatures: function() {
		// Add each feature to the grid
		var records = [];
		for(var i = 0; i < this.features.length; i++) {
			records.push({
				number: i + 1,
				area: this.getFeatureSize(this.features[i]),
				feature: this.features[i]
			});
		}
		this.store.clearData()
		this.store.loadData(records);
		this.removeAllMarker();
	},
	
	/**
	 * To make the panel unactive 
	 */
	unloadFeature: function() {
		this.removeAllMarker();
		
		if(!Ext.isEmpty(this.feature)) {
			this.gridEvent.destroy();
			this.storeEvent.destroy();
		}
		
		// Remove fake sub-features and add the feature to the original layer
		this.source.clear();
		if(!Ext.isEmpty(this.feature)) {
			this.layer.getSource().addFeature(this.feature);
			delete this.feature;
		}
	},
	
	/**
	 * When a key is pressed while an item selected
	 * @param {Ext.view.View}
	 * @param {Ext.data.Model}
	 * @param {Ext.HTMLElement}
	 * @param {Ext.Number}
	 * @param {Ext.event.Event}
	 */
	keyInteraction: function(gridView, record, item, index, e) {
		switch(e.getKeyName()) {
			case "DELETE":
				this.deleteSelectedFeature();
				break;
		}
	},

	// startDrawing: function() {
		// appendPolygon
	// },

	/**************************************************************************************/
	/******************************* Vertex edition methods *******************************/
	/**************************************************************************************/
	/**
	 * Start a vertex edition session with the current selection
	 */
	editVertex: function() {
		var selections = this.grid.getSelection();
		if(selections.length > 0) {
			var geom = selections[0].getData().feature;
			this.currentFeature = selections[0].getData().number - 1; 
			
			// Remove feature overlay
			this.removeAllMarker();
			
			this.editController.startVertexEdition(geom);
		}
	},
	
	/**
	 * When user start the edition of the vertices
	 * @param {ol.Feature}
	 */
	beginVertexChange: function() {
		this.selectInteraction.setActive(false);
	},
	
	/**
	 * For vertex panel validating
	 * @param {ol.Feature}
	 */
	saveVertexChange: function(feature, changed) {
		this.editController.switchPanel(this.getView());
		
		if(changed) {
			var it = this.store.getAt(this.currentFeature); 
			it.set("area", this.getFeatureSize(feature));
		}
		
		this.updateMarker();
	},
	
	/**
	 * When the user cancel his changes
	 * @param {ol.Feature}
	 */
	cancelVertexChange: function(feature) {		
		this.editController.switchPanel(this.getView());
		this.selectInteraction.setActive(true);		
		this.updateMarker();
	},
	
	/**************************************************************************************/
	/*********************************** Delete methods ***********************************/
	/**************************************************************************************/
	/**
	 * Fire on DELETE key press. Delete a row of the store
	 * @param {Number}
	 */
	deleteSelectedFeature: function() {
		var selections = this.grid.getSelection();
		if(selections.length > 0) {
			if(this.grid.getStore().getCount() > 1) {
				var idx = selections[0].getData().number;
				this.store.removeAt(idx - 1);
			} else {
				Ext.Msg.show({
					title: "Edition",
					message: "You must leave one feature at least",
					buttons: Ext.Msg.OK,
					icon: Ext.Msg.WARNING
				});
			}
		}
	},
	
	/**
	 * Fired on grid entry delete. Delete a feature of the feature
	 * @param {Ext.data.Store}
	 * @param {Ext.data.Model[]}
	 * @param {Number}
	 */
	featureDeleted: function(store, records, index) {
		// Remove the sub-feature from cloneLayer
		this.source.removeFeature(records[0].data.feature);
		
		// Select a new line
		var newIdx = (index == this.store.getCount())? index - 1 : index;
		this.grid.setSelection(this.store.getAt(newIdx));
		this.grid.getView().focusRow(newIdx);
		this.featureChanged = true;
		this.reindexFeature();
	},
	
	
	
	
	/**
	 * DEPRECATED
	 * Update the current feature with the new coordinates
	 *
	syncGridWithGeom: function() {
		var coordinates = [];
		
		for(var i = 0; i < this.store.getCount(); i++) {
			coordinates.push(this.store.getData().getAt(i).data.geometry.getCoordinates());
		}
		
		var feature = Ck.create("ol.geom.MultiPolygon", coordinates);
		this.feature.setGeometry(feature);
	},*/
	
	/**
	 * Add a permanent marker on the map to locate the feature.
	 * Called on grid row select
	 * @param {Ext.selection.RowModel}
	 * @param {Ext.data.Model}
	 */
	updateMarker: function(rm, record) {
		this.removeAllMarker();
		
		if(Ext.isEmpty(record)) {
			record = this.grid.getSelection()[0];
		}
		
		var mk = this.createMarker(record.data.feature);
		this.overlaySource.addFeature(mk);
	},
	
	/**
	 * Create a square marker to locate feature.
	 * Called by showMarker and updateMarker methods
	 *
	 * @param {ol.Feature}	Coordinate
	 *
	 * @return {ol.Feature}
	 */
	createMarker: function(feature) {
		
		var polygon = ol.geom.Polygon.fromExtent(feature.getGeometry().getExtent());
		
		var marker = new ol.Feature({
			geometry: polygon
		});
		
		var mapExtent = Ck.getMap().getOlView().calculateExtent(Ck.getMap().getOlMap().getSize());
		if(!polygon.intersectsExtent(mapExtent)) {
			Ck.getMap().getOlView().setCenter(polygon.getInteriorPoint().getCoordinates());
		}
		
		return marker;
	},
	
	/**
	 * Remove all marker of featureLayer
	 */
	removeAllMarker: function() {
		if(this.overlayLayer) {
			this.overlaySource.clear();
		}
	},
	
	/**
	 * Save the current feature
	 */
	save: function() {
		// Creating a multi-feature from multiple simple-feature
		var geom = this.feature.getGeometry()
		var features = this.source.getFeatures();
		geom.setCoordinates([]);
		for(var i = 0; i < features.length; i++) {
			geom.appendPolygon(features[i].getGeometry());
		}
		
		this.unloadFeature();		
		this.fireEvent("validate", this.feature, this.featureChanged);
	},
	
	/**
	 * Discard change
	 */
	cancel: function() {
		this.unloadFeature();
		this.fireEvent("cancel", this.feature);
	},
	
	close: function() {
		this.unloadFeature();
		Ck.getMap().getOlMap().removeLayer(this.overlayLayer);
		Ck.getMap().getOlMap().removeLayer(this.cloneLayer);
	},
	
	/**
	 * Reset number field of each item of the grid
	 */
	reindexFeature: function() {
		for(var i = 0; i < this.store.data.length; i++) {
			this.store.data.getAt(i).set("number", i + 1);
		}
	},
	
	/**
	 * Format area in kilometers
	 * @param {ol.Feature} Feature
	 * @return {String} Area or distance in kilometers or meters
	 */
	getFeatureSize: function(feature) {
		var geometry = feature.getGeometry();
		if(geometry.getArea) {
			var area = geometry.getArea();
			area = Math.round(area);
			
			if(area > 10000000) {
				area = area / 10000;
				area = Math.round(area);
				return (area / 100).toString() + " km²";
			} else {
				area = area / 100;
				area = Math.round(area);
				return (area / 100).toString() + " ha";
			}
		} else {
			
		}
	},
	
	/**
	 * Remove exceeded decimal
	 * @param {Number}
	 * @return {Number}
	 */
	trimCoord: function(coord) {
		sCoord = coord.toString();
		if(sCoord.length > this.maxLength) {
			coord = parseFloat(sCoord.substring(0, this.maxLength));
		}
		return coord;
	}
});
