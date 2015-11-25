/**
 * Edit tool used to crop new feature
 */
Ext.define('Ck.edit.action.Union', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditUnion',

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'fa fa-crop',
	tooltip: 'Gather features',

	/**
	 * Activate the geometry crop interaction
	 **/
	toggleAction: function(btn, status) {
		this.associatedEl = btn;
		this.used = true;
		
		// var source = this.getLayerSource(layer);
		// map.registerRemoveEvent(source);
		
		if(!this.unionInteraction) {
			this.unionInteraction = new ol.interaction.Select({
				layers: [this.getLayer()],
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: 'yellow',
						width: 3
					}),
					fill: new ol.style.Fill({
						color: 'rgba(0, 0, 255, 0.1)'
					})
				}),
				multi: true,
				addCondition: ol.events.condition.singleClick
			});
			this.olMap.addInteraction(this.unionInteraction);
			
			// Traitement de la sélection
			this.unionInteraction.on('select', function(e) {		
				if(e.selected.length==0) return;
				
				// Récup un clone de la sélection
				var features = Ext.Array.clone(this.unionInteraction.getFeatures().getArray());
				
				if(features.length == 2) {
					this.editUnionSelected(features);
				}
			}, this);
		}
		
		this.unionInteraction.setActive(status);
		
		if(!status) {
			this.unionInteraction.getFeatures().clear();
		}
	},

	editUnionSelected: function(features) {
		var layer = this.getLayer();
		var source = this.getLayerSource(layer);

		// Parse les géométries en GeoJSON
		var geojson  = new ol.format.GeoJSON();
		var poly1 = geojson.writeFeatureObject(features[0]);				
		var poly2 = geojson.writeFeatureObject(features[1]);
		
		// Union des 2 géométries (catch exceptions jsts)
		var union = null;
		try {
			union = turf.union(poly1, poly2);
		} catch(error) {
			Ext.Msg.show({
				icon: Ext.Msg.ERROR,
				message: "Error " + error.name + " occured : " + error.message,
				buttons: Ext.Msg.OK
			});
			this.unionInteraction.getFeatures().clear();
			return false;
		}
		
		if(union && union.geometry.type != 'Polygon') {
			Ext.Msg.show({
				icon: Ext.Msg.ERROR,
				message: "The selected plygons must have at least 2 commons points",
				buttons: Ext.Msg.OK
			});
			this.unionInteraction.getFeatures().clear();
			return false;
		} 
		
		
		// Mise à jour de la couche ajout du nouveau poly et suppr des 2 anciens
		var feature = geojson.readFeature(union);
		
		for(var i=features.length - 1; i>=0; i--) {
			source.removeFeature(features[i]);
		}
		
		source.addFeature(feature);
		this.editController.fireEvent("featureunion", feature);
		
		// Efface la sélection...
		this.unionInteraction.getFeatures().clear();
		return true;
	},
	
	closeAction: function() {
		if(this.used) {
			this.drawInteraction.setActive(false);
			this.olMap.removeInteraction(this.drawInteraction);
			delete this.drawInteraction;
		}
	}
});