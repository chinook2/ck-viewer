/**
 *
 */
Ext.define('Ck.edit.vertex.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckedit.vertex',
	
	maxLength: 12,
	
	/**
	 * Say if change occurred
	 */
	featureChanged: false,
	
	/**
	 * @event validate
	 * Fires when user want to save vertex change
	 * @param {ol.Feature}
	 * @param {Boolean} Say if the feature is changed
	 */
	 
	/**
	 * @event cancel
	 * Fires when user want to discard vertex change
	 * @param {ol.Feature}
	 */
	 
	/**
	 * @event beginsession
	 * Fires at begin of vertex session
	 * @param {ol.Feature}
	 */
	
	
	
	/**
	 * @protected
	 */
	init: function(view) {
		var olMap = Ck.getMap().getOlMap();
		
		this.grid = view.items.get(0);
		this.store = this.grid.getStore();
		
		this.control({
			"ckedit-vertex button#save": {
				click: this.save,
				scope: this
			},
			"ckedit-vertex button#cancel": {
				click: this.cancel,
				scope: this
			},
			"ckedit-vertex button#add-vertex": {
				click: this.addVertex,
				scope: this
			}
		});
		
		var vertexLayerId = view.config.layer.getProperties().id + "_vertex-marker";
		this.vertexLayer = Ck.getMap().getLayer(vertexLayerId);
		
		
		if(!this.vertexLayer) {
			this.vertexLayer = Ck.create("ol.layer.Vector", {
				id: vertexLayerId,
				source: new ol.source.Vector(),
				style: Ck.map.Style.overlayStyle,
				renderOrder: function() { return 0 }
			});

			olMap.addLayer(this.vertexLayer);
			// olMap.getLayers().setAt(olMap.getLayers().getLength() - 1, this.vertexLayer);
		}
	},
	
	loadFeature: function(feature) {
		this.fireEvent("beginsession", feature);
		this.featureChanged = false;
		this.originalGeometry = feature.getGeometry().clone();
		this.idxX = 0;
		this.idxY = 0;
		
		this.feature = feature;
		this.ftCoords = feature.getGeometry().getCoordinates();
		
		this.coords = this.ftCoords[this.idxX][this.idxY];
		// Remove the duplicate first/last vertex from the store
		this.coords.splice(this.coords.length - 1, 1);
		
		var records = [];
		
		// Add each vertex to the grid
		for(var i = 0; i < this.coords.length; i++) {
			records.push({
				number: i + 1,
				longitude: this.trimCoord(this.coords[i][0]),
				latitude: this.trimCoord(this.coords[i][1]),
				geometry: this.coords[i],
			});
		}
		
		this.store.loadData(records);
		
		this.gridEvent = this.grid.on({
			destroyable: true,
			select: {
				fn: this.addMarker,
				scope: this
			},
			itemkeydown: {
				fn: this.keyInteraction,
				scope: this
			}
		});
		
		this.storeEvent = this.store.on({
			destroyable: true,
			add: {
				fn: this.vertexAdded,
				scope: this
			},
			remove: {
				fn: this.vertexDeleted,
				scope: this
			},
			datachanged: {
				fn: this.reindexVertex,
				scope: this
			},
			update: {
				fn: this.updateVertex,
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
		var selections = gridView.getSelection()
		switch(e.getKeyName()) {
			case "DELETE":
				if(selections.length > 0) {
					this.deleteVertex(index);
				}
				break;
			case "DOWN":
				if(index == gridView.store.getCount() - 1) {
					gridView.setSelection(gridView.store.getAt(0));
					gridView.focusRow(0);
				}
				break;
			case "UP":
				if(index == 0) {
					gridView.setSelection(gridView.store.getAt(gridView.store.getCount() - 1));
					gridView.focusRow(gridView.store.getCount() - 1);
				}
				break;
		}
	},
	
	/**
	 * Add a permanent marker on the map to locate the object.
	 * Called on grid row select
	 * @param {Ext.selection.RowModel}
	 * @param {Ext.data.Model}
	 */
	addMarker: function(rm, record) {
		this.removeAllMarker();
		
		var mk = this.createMarker(record.data.geometry);
		this.vertexLayer.getSource().addFeature(mk);
	},
	
	/**
	 * Create a square marker to locate vertex.
	 * Called by showMarker and addMarker methods
	 *
	 * @param {Number[]}	Coordinate
	 *
	 * @return {ol.Feature}
	 */
	createMarker: function(coords, isHover) {
		var hover = '';
		if(isHover) hover = '-hover';
		
		var point = new ol.geom.Point(coords);
		var marker = new ol.Feature({
			geometry: point,
			style: Ck.map.Style.overlayStyle[0]
		});
		
		var mapExtent = Ck.getMap().getOlView().calculateExtent(Ck.getMap().getOlMap().getSize());
		if(!point.intersectsExtent(mapExtent)) {
			Ck.getMap().getOlView().setCenter(point.getCoordinates());
		}
		
		return marker;
	},
	
	/**
	 * Remove all marker of vertexLayer
	 */
	removeAllMarker: function() {
		if(this.vertexLayer) {
			this.vertexLayer.getSource().clear();
		}
	},
	
	/**
	 * Add row and vertex to the specified position.
	 * For position 5 the new vertex will be between current 4 and 5 vertex
	 */
	addVertex: function() {
		var posCmp = this.getView().getDockedItems()[0].getComponent("vertex-position");
		
		// Position must be between 1 and store.length
		if(posCmp.isValid()) {
			var pos = posCmp.getValue() - 1;
			var lastPos = this.store.data.length;
			
			// pos is the position in the store
			if(pos > lastPos) {
				pos = lastPos;
			}
			
			// The new vertex will be positionned beetween its previous and next
			var previousCoord	= this.store.data.getAt((pos == 0)? lastPos : pos - 1).data.geometry;
			var nextCoord		= this.store.data.getAt(pos).data.geometry;
			
			var lon = (previousCoord[0] + nextCoord[0]) / 2;
			var lat = (previousCoord[1] + nextCoord[1]) / 2;
			
			this.grid.getStore().insert(pos, {
				number: pos + 1,
				longitude: this.trimCoord(lon),
				latitude: this.trimCoord(lat),
				geometry: [lon, lat],
			});
		}
	},
	
	/**
	 * Fired when row added in the grid.
	 * Add a vertex to the polygon.
	 * @param {Ext.data.Store}
	 * @param {Ext.data.Model[]}
	 * @param {Number}
	 */
	vertexAdded: function(store, records, index) {
		this.coords.splice(index, 0, [records[0].data.longitude, records[0].data.latitude]);
		this.addMarker(null, records[0]);
		this.updateFeature();
	},
	
	/**
	 * Fire on DELETE key press. Delete a row of the store
	 * @param {Number}
	 */
	deleteVertex: function(index) {
		this.store.removeAt(index);
	},
	
	/**
	 * Fired on grid entry delete. Delete a vertex of the feature
	 * @param {Ext.data.Store}
	 * @param {Ext.data.Model[]}
	 * @param {Number}
	 */
	vertexDeleted: function(store, records, index) {
		// Select a new line
		var newIdx = (index == this.store.getCount())? index - 1 : index;
		this.grid.setSelection(this.store.getAt(newIdx));
		this.grid.getView().focusRow(newIdx);		
		
		this.coords.splice(index, 1);
		this.updateFeature();
	},
	
	/**
	 * Fired when a row of the grid was modified. 
	 * @param {Ext.data.Store}
	 * @param {Ext.data.Model}
	 * @param {String}
	 * @param {String[]}
	 */
	updateVertex: function(store, record, operation, fields) {
		if(fields[0] != "number") {
			record.data.geometry = [record.data.longitude, record.data.latitude]
			this.coords[record.data.number - 1] = record.data.geometry;
			this.addMarker(null, record);
			this.updateFeature();
		}
	},
	
	/**
	 * Update the current feature with the new coordinates
	 */
	updateFeature: function() {
		this.featureChanged = true;
		this.feature.getGeometry().setCoordinates(this.ftCoords);
	},
	
	/**
	 * Reset number field of each item of the grid
	 */
	reindexVertex: function() {
		for(var i = 0; i < this.store.data.length - 1; i++) {
			this.store.data.getAt(i).set("number", i + 1);
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
		Ck.getMap().getOlMap().removeLayer(this.vertexLayer);
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
