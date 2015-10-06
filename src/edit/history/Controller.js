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
				fn: this.onFeautreGeometry,
				scope: this
			},
			featureattribute: {
				fn: this.onFeatureAttribute,
				scope: this
			},
			featureremove: {
				fn: this.onFeatureRemove,
				scope: this
			}
		});
		
		var source = editController.layer.getSource();
		source.on("removefeature" , this.onFeatureRemove, this);
	},
	
	/**
	 * Fired when feature is created
	 */
	onFeatureAdd: function(feature) {
		this.store.add(this.createRecord(feature, "Add"));
	},
	
	/**
	 * Fired when feature is created
	 */
	onFeautreGeometry: function(feature) {
		this.store.add(this.createRecord(feature, "Geometry"));
	},
	
	/**
	 * Fired when feature is created
	 */
	onFeatureAttribute: function(feature) {
		this.store.add(this.createRecord(feature, "Attribute"));
	},
	
	/**
	 * Fired when feature is created
	 */
	onFeatureRemove: function(ev) {
		this.store.add(this.createRecord(ev.feature, "Remove"));
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
