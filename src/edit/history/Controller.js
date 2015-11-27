/**
 *
 */
Ext.define('Ck.edit.history.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckedit.history',
	
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
		this.store.add(this.createRecord(feature, "Add"));
	},
	
	/**
	 * Fired when feature geometry was modified
	 * @param {ol.Feature}
	 */
	onFeatureGeometry: function(feature) {
		this.store.add(this.createRecord(feature, "Geometry"));
	},
	
	/**
	 * Fired when feature attribute was modified
	 * @param {ol.Feature}
	 */
	onFeatureAttribute: function(feature) {
		this.store.add(this.createRecord(feature, "Attribute"));
	},
	
	/**
	 * Fired when feature was removed
	 * @param {ol.Feature}
	 */
	onFeatureRemove: function(feature) {
		this.store.add(this.createRecord(feature, "Remove"));
	},
	
	/**
	 * Fired when feature was croped
	 * @param {ol.Feature}
	 */
	onFeatureCrop: function(feature) {
		this.store.add(this.createRecord(feature, "Crop"));
	},
	
	/**
	 * Fired when features gathered
	 * @param {ol.Feature[]}
	 */
	onFeatureUnion: function(feature) {
		this.store.add(this.createRecord(feature, "Union"));
	},
	
	/**
	 * Create a record from feature
	 */
	createRecord: function(feature, action) {
		return {
			number: this.store.getCount() + 1,
			featureid: feature.getId() || "Unkown",
			action: action
		};
	},
	
	close: function() {
		
	}
});
