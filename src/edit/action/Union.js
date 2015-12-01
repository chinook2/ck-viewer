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
	 * Indicate if the edited layer is a multi-feature layer (like MultiLineString)
	 */
	multi: null,

	/**
	 * Activate the geometry crop interaction
	 **/
	toggleAction: function(btn, status) {
		this.callParent([btn]);
		
		if(!this.unionInteraction) {
			this.createInteraction();
		}
		
		this.multi = (Ext.isEmpty(this.multi))? (this.getGeometryType().indexOf("Multi") !== -1) : this.multi;
		
		this.unionInteraction.setActive(status);
		
		if(!status) {
			this.unionInteraction.getFeatures().clear();
		}
	},
	
	/**
	 * Create the select interaction.
	 * @param {Object}
	 */
	createInteraction: function(config) {
		if(Ext.isEmpty(config)) {
			config = {}
		}
		
		// Set the affected layer
		this.layer = (Ext.isEmpty(config.layers))? undefined : config.layers[0];
		
		Ext.apply(config, {
			style: this.unionSelectedStyle,
			multi: true,
			addCondition: ol.events.condition.singleClick,
			layers: [this.getLayer()]
		});
		
		this.unionInteraction = new ol.interaction.Select(config);
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
		this.interactions["unionInteraction"] = this.unionInteraction;
		this.unionInteraction.setActive(false)
	},

	/**
	 * Merge 2 polygons
	 * @param {ol.Feature[]} The 2 polygons to merge
	 */
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
		
		if(union && union.geometry.type != 'Polygon' && !this.multi) {
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
		
		for(var i = features.length - 1; i >= 0; i--) {
			source.removeFeature(features[i]);
		}
		
		source.addFeature(feature);
		this.controller.fireEvent("featureunion", feature);
		
		// Efface la sélection...
		this.unionInteraction.getFeatures().clear();
		return true;
	},
	
	unionSelectedStyle: function() {
		return [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'yellow',
					width: 3
				}),
				fill: new ol.style.Fill({
					color: 'rgba(0, 0, 255, 0.1)'
				})
			})
		]
	}
});