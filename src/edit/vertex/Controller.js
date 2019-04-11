/**
 * Controller what manage vertex modification.
 * Users can modify the geometry by 2 way. With the vertex panel or with
 * 4 ol.interaction to play directly with the map :
 *
 * - ol.interaction.Translate
 * - ol.interaction.Draw
 * -
 */
Ext.define('Ck.edit.vertex.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckedit.vertex',

	maxLength: 12,

	/**
	 * Say if change occurred
	 */
	geometryChanged: false,

	/**
	 * @event sessionstart
	 * Fires at begin of vertex session
	 * @param {ol.Feature}
	 */

	/**
	 * @event geometrychange
	 * Fires when the geometry is altered
	 * @param {ol.Feature}
	 */

	/**
	 * @event validate
	 * Fires when user want to save vertex change
	 * @param {ol.Feature}
	 * @param {Boolean} Say if the geometry is changed
	 */

	/**
	 * @event cancel
	 * Fires when user want to discard vertex change
	 * @param {ol.Feature}
	 */

	/**
	 * @protected
	 */
	init: function(view) {
		this.olMap = Ck.getMap().getOlMap();

		this.grid = view.items.get(0);
		this.store = this.grid.getStore();

		this.control({
			"ckedit-vertex button#save-vertex": {
				click: this.save,
				scope: this
			},
			"ckedit-vertex button#cancel-vertex": {
				click: this.cancel,
				scope: this
			},
			"ckedit-vertex button#add-vertex": {
				click: function() {
					var posCmp = this.getView().getDockedItems()[0].getComponent("vertex-position");
					// Position must be between 1 and store.length
					if(posCmp.isValid()) {
						var index = posCmp.getValue() - 1;
						this.addVertex(index);
					}
				},
				scope: this
			},
			"ckedit-vertex radio#action-move": {
				change: this.liveAction,
				scope: this
			},
			"ckedit-vertex radio#action-alter": {
				change: this.liveAction,
				scope: this
			}
		});

		// Init events
		this.gridEvent = this.grid.on({
			destroyable: true,
			select: this.updateMarker,
			itemkeydown: this.keyInteraction,
			scope: this
		});

		this.storeEvent = this.store.on({
			destroyable: true,
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

		// Add working vector layer
		var id = Ext.id();
		if(view.config.layer) id = view.config.layer.getProperties().id;
		var vertexLayerId = id + "_vertex-marker";
		this.vertexLayer = Ck.getMap().getLayerById(vertexLayerId);

		if(!this.vertexLayer) {
			this.vertexLayer = Ck.create("ol.layer.Vector", {
				id: vertexLayerId,
				source: new ol.source.Vector(),
				style: Ck.Style.vertexStyle,
				zIndex: Ck.Style.zIndex.vertexOverlay
			});
			// Add layer on top (temporary layer) - not in map layers collection
			this.vertexLayer.setMap(this.olMap);
		}

		// Auto load feature on init
		if(view.config.feature) {
			this.loadFeature(view.config.feature);
		}
	},

	destroy: function() {
		this.gridEvent.destroy();
		this.storeEvent.destroy();

		this.callParent();
	},

	/**
	 * Start the vertex session edit for the passed feature
	 * @param {ol.Feature}
	 */
	loadFeature: function(feature) {
		this.fireEvent("sessionstart", feature);
		this.geometryChanged = false;

		this.feature = feature;
		this.geometry = feature.getGeometry();

		this.originalGeometry = this.geometry.clone();
		this.ftCoords = this.geometry.getCoordinates();

		this.loadVertex();
	},

	/**
	 * Load vertex coordinates into the grid. Use this.coords for it.
	 */
	loadVertex: function() {
		this.store.erase();

		// Remove the duplicate first/last vertex from the store
		this.coords = this.ftCoords; //[0];
		if(this.coords.length==0) return;

		this.coords.splice(this.coords.length - 1, 1);

		var records = [];

		// Add each vertex to the grid
		for(var i = 0; i < this.coords.length; i++) {
			records.push({
				number: i + 1,
				longitude: this.trimCoord(this.coords[i][0]),
				latitude: this.trimCoord(this.coords[i][1]),
				geometry: this.coords[i]
			});
		}

		this.store.loadData(records);

		// Add dummy row
		var plg = this.grid.findPlugin('gridediting');
		if(plg) plg.addNewRow();
	},

	/**
	 * To make the panel unactive
	 */
	unloadGeometry: function() {
		this.removeAllMarker();
		// Clear Grid
		this.store.removeAll();
		// Add dummy row
		var plg = this.grid.findPlugin('gridediting');
		if(plg) plg.addNewRow();

		this.getView().getDockedItems()[0].getComponent("vertex-live-edit").getMenu().getComponent("action-none").setValue(true);
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
	updateMarker: function(rm, record) {
		// Ignore if select/click on the dummy row
		if(record.get('dummy')) return;

		this.removeAllMarker();

		// Update the position field to simplify creation
		var posCmp = this.getView().getDockedItems()[0].getComponent("vertex-position");
		if(record.data.number) posCmp.setValue(record.data.number);

		var mk = this.createMarker(record.data.geometry);
		if(mk) this.vertexLayer.getSource().addFeature(mk);
	},

	/**
	 * Create a square marker to locate vertex.
	 * Called by showMarker and updateMarker methods
	 *
	 * @param {Number[]}	Coordinate
	 *
	 * @return {ol.Feature}
	 */
	createMarker: function(coords, isHover) {
		var hover = '';
		if(isHover) hover = '-hover';
		if(!coords) return false;

		var point = new ol.geom.Point(coords);
		var marker = new ol.Feature({
			geometry: point
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
	 * @param {Integer}
	 */
	addVertex: function(index) {
		if(this.store.data.length < 3) return;

		var lastPos = this.store.data.length - 1;

		// index is the position in the store
		if(index > lastPos) {
			index = lastPos;
		}

		// The new vertex will be positionned beetween its previous and next
		var previousCoord	= this.store.data.getAt((index == 0)? lastPos : index - 1).data.geometry;
		var nextCoord		= this.store.data.getAt(index).data.geometry;

		var lon = (previousCoord[0] + nextCoord[0]) / 2;
		var lat = (previousCoord[1] + nextCoord[1]) / 2;

		var record = {
			number: index + 1,
			longitude: this.trimCoord(lon),
			latitude: this.trimCoord(lat),
			geometry: [lon, lat]
		};
		this.grid.getStore().insert(index, record);
		this.focusRow(index);
		this.vertexAdded(this.store.getAt(index), index);
	},

	/**
	 * Fired when row added in the grid.
	 * Add a vertex to the polygon.
	 * @param {Ext.data.Store}
	 * @param {Ext.data.Model}
	 * @param {Number}
	 */
	vertexAdded: function(record, index) {
		this.coords.splice(index, 0, [record.data.longitude, record.data.latitude]);
		this.updateMarker(null, record);
		this.updateGeometry();
	},

	/**
	 * Fire on DELETE key press. Delete a row of the store
	 * @param {Number}
	 */
	deleteVertex: function(index) {
		if(this.store.getCount() > 3) {
			this.store.removeAt(index);
		} else {
			Ext.Msg.show({
				title: "Vertex",
				message: "You must leave at least 3 vertices for a ploygon",
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.WARNING
			});
		}
	},

	/**
	 * Fired on grid entry delete. Delete a vertex of the feature
	 * @param {Ext.data.Store}
	 * @param {Ext.data.Model[]}
	 * @param {Number}
	 */
	vertexDeleted: function(store, records, index) {
		// TODO : review conflict with deleteRow from gridediting plugin.
		// Select a new line
		// var newIdx = (index == this.store.getCount())? index - 1 : index;
		// this.grid.setSelection(this.store.getAt(newIdx));
		// this.grid.getView().focusRow(newIdx);
		if(!this.coords) return;

		this.coords.splice(index, 1);
		this.updateGeometry();
	},

	/**
	 * Fired when a row of the grid was modified.
	 * Do something only on user interaction
	 * @param {Ext.data.Store}
	 * @param {Ext.data.Model}
	 * @param {String}
	 * @param {String[]}
	 */
	updateVertex: function(store, record, operation, fields) {
		if(fields.indexOf('latitude') != -1 || fields.indexOf('longitude') != -1) {
			record.data.geometry = [record.data.longitude, record.data.latitude];
			this.coords[record.data.number - 1] = record.data.geometry;
			this.updateMarker(null, record);
			this.updateGeometry();
		}
	},

	/**
	 * Update the current geometry with the new coordinates
	 */
	updateGeometry: function() {
		this.geometryChanged = true;

		// TODO: check geometry type (point/line/poly)

		// Add extra points when adding manually 1st then 2nd point of the polygon
		var toRemove = -1;
		if(this.coords.length>0){
			this.coords.push(this.coords[0]);

			if(this.coords.length==2) {
				toRemove--;
				this.coords.push(this.coords[0]);
			}
		}

		this.geometry.setCoordinates(this.ftCoords);

		this.coords.splice(toRemove);
		this.fireEvent("geometrychange", this.feature);
	},

	/**************************************************************************************/
	/***************************** Live interaction managment *****************************/
	/**************************************************************************************/
	/**
	 * Manage live interaction (directly on the map)
	 * @param {Ext.form.field.RadioView}
	 * @param {Boolean}
	 */
	liveAction: function(rb, checked) {
		// Interaction need a feature, not a geometry
		// var tempFeature = Ck.create("ol.Feature", { geometry : this.geometry });

		switch(rb.getItemId()) {
			case "action-none":

				break;
			case "action-move":
				if(this.moveInteraction) {
					this.olMap.removeInteraction(this.moveInteraction);
				}
				this.moveInteraction = new ol.interaction.Translate({
					features: new ol.Collection([this.feature])
				});
				this.moveInteraction.on("translateend", this.translateEnd, this);
				this.olMap.addInteraction(this.moveInteraction);

				delete this.moveInteraction.previousCursor_;
				this.moveInteraction.setActive(checked);
				break;
			case "action-alter":
				if(this.modifyInteraction) {
					this.olMap.removeInteraction(this.modifyInteraction);
				}
				this.modifyInteraction = new ol.interaction.Modify({
					deleteCondition: ol.events.condition.never,
					features: new ol.Collection([this.feature])
				});
				this.modifyInteraction.on("modifystart", this.focusVertexRow, this);
				this.modifyInteraction.on("modifyend", this.updateVertexRow, this);
				this.olMap.addInteraction(this.modifyInteraction);

				this.modifyInteraction.setActive(checked);
				break;
		}
	},

	translateEnd: function(evt) {
		this.geometryChanged = true;
		var ft = evt.features.getArray()[0];
		this.ftCoords = ft.getGeometry().getCoordinates();
		this.loadVertex();
		this.removeAllMarker();
	},

	/**
	 * Called when alter interaction is used. If vertex snapped the matching row.
	 * If no vertex snapped a row was created
	 * @param {ol.interaction.ModifyEvent}
	 */
	focusVertexRow: function(event) {
		var vertex = event.currentTarget.vertexFeature_.getGeometry();
		var coord = vertex.getCoordinates();

		if(event.currentTarget.snappedToVertex_) {
			idx = this.getIndexFromCoord(coord) - 1;
		} else {
			var prevPoint = event.currentTarget.dragSegments_[0][0].segment[0];
			var idx = this.getIndexFromCoord(prevPoint);

			var data = {
				number: idx + 1,
				longitude: this.trimCoord(coord[0]),
				latitude: this.trimCoord(coord[1]),
				geometry: coord
			};
			this.grid.getStore().insert(idx, data);

			this.coords.splice(idx, 0, [data.longitude, data.latitude]);

			this.reindexVertex();


			// var nextPoint = event.currentTarget.dragSegments_[1][0].segment[1];
		}

		this.focusRow(idx);
		this.currentVertexIdx = idx;
	},

	/**
	 * Called when user drop the vertex to update the matching row.
	 * @param {ol.interaction.ModifyEvent}
	 */
	updateVertexRow: function(event) {
		this.geometryChanged = true;
		var coord = event.currentTarget.vertexFeature_.getGeometry().getCoordinates();
		var dataRow = this.store.getData().getAt(this.currentVertexIdx);

		if(coord[0] != dataRow.data[0] || coord[1] != dataRow.data[1]) {
			dataRow.set({
				"geometry": coord,
				"longitude": coord[0],
				"latitude": coord[1]
			});
			this.updateMarker(null, dataRow);
			this.coords[this.currentVertexIdx] = coord;
		}
		this.fireEvent("geometrychange", this.feature);
	},

	/**************************************************************************************/
	/**************************************** Utils ***************************************/
	/**************************************************************************************/
	/**
	 * Reset number field of each item of the grid
	 */
	reindexVertex: function() {
		for(var i = 0; i < this.store.data.length; i++) {
			this.store.data.getAt(i).set("number", i + 1);
		}
	},

	/**
	 * Retrieve the index of the corresponding line at coordinates
	 * @param {ol.Coordinates}
	 * @return {Integer}
	 */
	getIndexFromCoord: function(coord) {
		var coord, found = false, arVertex = this.store.getData();
		for(var i = 0; (i < arVertex.getCount() && !found); i++) {
			geom = arVertex.getAt(i).data.geometry;
			if(geom[0] == coord[0] && geom[1] == coord[1]) {
				found = true;
			}
		}
		return i;
	},

	/**
	 * Focus and scroll to the specified row
	 * @param {Integer} The row to focus
	 */
	focusRow: function(idx) {
		this.grid.setSelection(this.store.getAt(idx));
		this.grid.getView().focusRow(idx);
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
	},

	/**
	 * Save the current geometry
	 */
	save: function() {
		this.unloadGeometry();
		this.fireEvent("validate", this.feature, this.geometryChanged);
	},

	/**
	 * Discard change
	 */
	cancel: function() {
		this.unloadGeometry();
		this.feature.setGeometry(this.originalGeometry);
		this.fireEvent("cancel", this.feature);
	},

	close: function() {
		Ck.getMap().removeLayer(this.vertexLayer);
	}

});
