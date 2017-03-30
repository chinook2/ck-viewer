/**
 *
 */
Ext.define('Ck.edit.history.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckedit.history',
	
	actionLabels: [
		"Add",
		"Geometry",
		"Attribute",
		"Remove",
		"Crop",
		"Union"
	],
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.store = view.store;
	},
	
	/**
	 * Create listeners for the edit controller
	 * @param {Ck.edit.Controller}
	 */
	createListeners: function(editController) {		
		editController.on({
			featurecreate: {
				fn: this.onFeatureAdd,
				scope: this
			},
			featuregeometry: {
				fn: this.onFeatureGeometry,
				scope: this
			},
			featureattribute: {
				fn: this.onFeatureAttribute,
				scope: this
			},
			featureremove: {
				fn: this.onFeatureRemove,
				scope: this
			},
			featurecrop: {
				fn: this.onFeatureCrop,
				scope: this
			},
			featureunion: {
				fn: this.onFeatureUnion,
				scope: this
			}
		});
	},
	
	/**
	 * Fired when feature is created
	 * @param {ol.Feature}
	 */
	onFeatureAdd: function(feature) {
		this.store.add(this.createRecord(feature, 0));
	},
	
	/**
	 * Fired when feature geometry was modified
	 * @param {ol.Feature}
	 */
	onFeatureGeometry: function(feature) {
		var rcd = this.getRecord(feature);
		
		if(this.checkTopology(feature)) {
			if(Ext.isEmpty(rcd)) {
				this.store.add(this.createRecord(feature, 1));
			} else {
				
			}
		} else {
			if(!Ext.isEmpty(rcd)) {
				this.store.remove(rcd);
			}
		}	
	},
	
	/**
	 * Fired when feature attribute was modified
	 * @param {ol.Feature}
	 */
	onFeatureAttribute: function(feature) {
		this.store.add(this.createRecord(feature, 2));
	},
	
	/**
	 * Fired when feature was removed
	 * @param {ol.Feature}
	 */
	onFeatureRemove: function(feature) {
		this.store.add(this.createRecord(feature, 3));
	},
	
	/**
	 * Fired when feature was croped
	 * @param {ol.Feature}
	 */
	onFeatureCrop: function(feature, features, initialFeature) {
		this.store.add(this.createRecord(feature, 0));
		this.store.add(this.createRecord(initialFeature, 3));
		
		for(var i = features.length - 1; i >= 0; i--) {
			var feat = features[i];
			if(feat != feature) {
				this.store.add(this.createRecord(feat, 0));
			}			
		}
	},
	
	/**
	 * Fired when features gathered
	 * @param {ol.Feature[]}
	 */
	onFeatureUnion: function(feature, features) {
		this.store.add(this.createRecord(feature, 0));
		
		for(var i = features.length - 1; i >= 0; i--) {
			var feat = features[i];
			this.store.add(this.createRecord(feat, 3));
		}
	},
	
	/**
	 * Get, if exist, the record corresponding to the passed feature
	 * @return {Ext.data.Model}
	 */
	getRecord: function(feature) {
		return this.store.getById(feature.getId());
	},
	
	/**
	 * Create a record from feature
	 */
	createRecord: function(feature, action) {
		return {
			number		: this.store.getCount() + 1,
			featureId	: feature.getId() || "Unkown",
			action		: this.actionLabels[action],
			id			: feature.getId() || Math.floor(Math.random() * 1000000000),
			actionId	: action,
			feature		: feature
		};
	},
	
	close: function() {
		
	},
	
	reset: function() {
		this.store.removeAll();
	},
	
	/**
	*	Check the feature topology
	**/
	checkTopology: function(feature) {
		// Check self-intersection errors
		var geoJSON  = new ol.format.GeoJSON();
		var geojsonFeature = geoJSON.writeFeatureObject(feature);		
		var kinks = turf.kinks(geojsonFeature);

		if(kinks.intersections.features.length > 0) {
			Ck.Msg.show({
				icon: Ext.Msg.ERROR,
				title: "Topology error",
				message: "The feature geometry is self-intersected.",
				buttons: Ext.Msg.OK
			});
			
			return false;
		}
		
		return true;
	}
});
