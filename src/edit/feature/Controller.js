/**
 * Controller what manage multiple-feature layer modification
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
	 * @event beginsession
	 * Fires at begin of feature session
	 * @param {ol.Feature}
	 */
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.olMap = Ck.getMap().getOlMap();
		this.layer = view.layer;
		
		this.grid = view.items.get(0);
		this.store = this.grid.getStore();
				
		this.control({
			"ckedit-feature button#save": {
				click: this.save,
				scope: this
			},
			"ckedit-feature button#cancel": {
				click: this.cancel,
				scope: this
			},
			"ckedit-feature button#create": {
				click: this.startDrawing,
				scope: this
			},
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
		this.featureLayer = Ck.getMap().getLayerById(featureLayerId);
		
		this.selectInteraction = Ck.create("ol.interaction.Interaction", {handleEvent: Ext.emptyFn});
		
		// Layer to frame focused feature
		if(!this.featureLayer) {
			this.featureLayer = Ck.create("ol.layer.Vector", {
				id: featureLayerId,
				source: new ol.source.Vector(),
				style: Ck.map.Style.overlayStyle,
				zIndex: Ck.map.Style.zIndex.featureOverlay
			});
			
			this.featureLayer.setMap(this.olMap);
		}
		
		if(!this.cloneLayer) {
			this.cloneLayer = Ck.create("ol.layer.Vector", {
				id: this.layer.getProperties().id + "_clone-editor",
				source: new ol.source.Vector(),
				style: Ck.map.Style.selectionStyle,
				zIndex: Ck.map.Style.zIndex.cloneLayer
			});
			
			this.cloneLayer.setMap(this.olMap);
		}
	},
	
	/**
	 * Start the feature session edit for the passed feature
	 * @param {ol.Feature}
	 */
	loadFeature: function(feature) {
		this.fireEvent("beginsession", feature);
		
		this.feature = feature;
		this.features = feature.getGeometry().getPolygons();
		this.originalGeometry = this.feature.getGeometry().clone();
		
		var records = [];
		
		// Add each feature to the grid
		for(var i = 0; i < this.features.length; i++) {
			records.push({
				number: i + 1,
				area: this.getFeatureSize(this.features[i]),
				geometry: this.features[i]
			});
		}
		
		this.store.loadData(records);
		
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
	},
	
	/**
	 * To make the panel unactive 
	 */
	unloadFeature: function() {
		this.removeAllMarker();
		this.gridEvent.destroy();
		this.storeEvent.destroy();
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

	startDrawing: function() {
		// appendPolygon
	},

	/**************************************************************************************/
	/******************************* Vertex edition methods *******************************/
	/**************************************************************************************/
	/**
	 * Start a vertex edition session with the current selection
	 */
	editVertex: function() {
		var selections = this.grid.getSelection();
		if(selections.length > 0) {
			var geom = selections[0].getData().geometry;
			this.currentFeature = selections[0].getData().number - 1;
			
			// We remove the sub-feature
			var coords = this.feature.getGeometry().getCoordinates();
			coords.splice(this.currentFeature, 1);
			this.feature.getGeometry().setCoordinates(coords);

			// And create a real feature to be able to edit it
			var ft = Ck.create("ol.Feature", { geometry: geom });
			this.cloneLayer.getSource().addFeature(ft); 
			
			// Remove feature overlay
			this.removeAllMarker();
			
			this.editController.startVertexEdition(ft);
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
	 * @param {ol.geom.SimpleGeometry}
	 */
	saveVertexChange: function(geometry, changed) {
		this.editController.switchPanel(this.getView());
		
		// Re-create the subfeature
		var coords = this.feature.getGeometry().getCoordinates();
		coords.splice(this.currentFeature, 0, geometry.getCoordinates());
		this.feature.getGeometry().setCoordinates(coords);
		
		// And delete the clone
		this.cloneLayer.getSource().clear();
		
		if(changed) {
			this.fireEvent("featuregeometry", geometry);
			var it = this.store.getAt(this.currentFeature); 
			it.set("area", this.getFeatureSize(geometry));
		}
		
		this.updateMarker();
	},
	
	/**
	 * When the user cancel his changes
	 */
	cancelVertexChange: function(geometry) {
		// Re-create the subfeature
		var coords = this.feature.getGeometry().getCoordinates();
		coords.splice(this.currentFeature, 0, geometry.getCoordinates());
		this.feature.getGeometry().setCoordinates(coords);
		
		// And delete the clone
		this.cloneLayer.getSource().clear();
		
		this.editController.switchPanel(this.getView());
		this.selectInteraction.setActive(true);
		
		var it = this.store.getAt(this.currentFeature); 
		it.set("geometry", geometry);
		
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
		// Select a new line
		var newIdx = (index == this.store.getCount())? index - 1 : index;
		this.grid.setSelection(this.store.getAt(newIdx));
		this.grid.getView().focusRow(newIdx);
		this.featureChanged = true;
		this.syncGridWithGeom();
		this.reindexFeature();
	},
	
	
	
	
	/**
	 * Update the current feature with the new coordinates
	 */
	syncGridWithGeom: function() {
		var coordinates = [];
		
		for(var i = 0; i < this.store.getCount(); i++) {
			coordinates.push(this.store.getData().getAt(i).data.geometry.getCoordinates());
		}
		
		var feature = Ck.create("ol.geom.MultiPolygon", coordinates);
		this.feature.setGeometry(feature);
	},
	
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
		
		var mk = this.createMarker(record.data.geometry);
		this.featureLayer.getSource().addFeature(mk);
	},
	
	/**
	 * Create a square marker to locate feature.
	 * Called by showMarker and updateMarker methods
	 *
	 * @param {Number[]}	Coordinate
	 *
	 * @return {ol.Feature}
	 */
	createMarker: function(feature, isHover) {
		var hover = '';
		if(isHover) hover = '-hover';
		
		var polygon = ol.geom.Polygon.fromExtent(feature.getExtent());
		
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
		if(this.featureLayer) {
			this.featureLayer.getSource().clear();
		}
	},
	
	/**
	 * Save the current feature
	 */
	save: function() {
		this.unloadFeature();
		this.fireEvent("validate", this.feature, this.featureChanged);
	},
	
	/**
	 * Discard change
	 */
	cancel: function() {
		this.unloadFeature();
		this.feature.setGeometry(this.originalGeometry);
		this.fireEvent("cancel", this.feature);
	},
	
	close: function() {
		Ck.getMap().getOlMap().removeLayer(this.featureLayer);
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
	 * @param {ol.geom.SimpleGeometry} Feature
	 * @return {String} Area or distance in kilometers or meters
	 */
	getFeatureSize: function(geometry) {
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
