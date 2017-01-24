/**
 * Edit tool used to delete a feature
 */
Ext.define('Ck.edit.action.Delete', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditDelete',

	/**
	 * Default properties when this action is used through a button
	 */
	itemId: 'edit-delete',
	iconCls: 'fa fa-remove fa-lg fa-flip-horizontal ck-plugin',
	tooltip: 'Delete feature',
	
	/**
	 * Ask confirmation to the user before remove
	 */
	deleteConfirmation: true,

	toggleAction: function(btn, status) {
		this.callParent(arguments);
		
		if(!this.delInteraction) {
			this.delInteraction = Ck.create("Ck.Selection", {
				layers			: [this.getLayer()],
				type			: "Point",
				callback		: this.onSelect,
				scope			: this,
				map				: this.map,
				drawStyle		: null,
				selectId		: "ckmapEditDelete",
				overHighlight	: true,
				highlightStyle	: Ck.map.Style.redStroke,
				stackSelection	: true
			});
			this.interactions["delInteraction"] = this.delInteraction;
		}
		
		// Hard fix for inexplicable issue (this.delInteraction.selection.length != 0)
		this.delInteraction.resetSelection();

		this.delInteraction.setActive(status);		
	},
	
	/**
	 * When a feature is selected.
	 * @params {Object[]}
	 */
	onSelect: function(layers) {
		var feature;
		
		if(layers[0]) {
			var ft = layers[0].features;
			if(ft.length == 1) {
				feature = ft[0];
			}
		}
		
		if(!Ext.isEmpty(feature)) {
			
			if(this.deleteConfirmation) {
				Ext.Msg.show({
					title: "Edition",
					message: "Are you sure to delete this feature ?",
					buttons: Ext.Msg.YESNO,
					icon: Ext.Msg.QUESTION,
					scope: this,
					fn: function(btn) {
						if (btn === 'yes') {
							this.controller.deleteFeature(feature);
						}
						this.delInteraction.resetSelection();
					}
				});
			} else {
				this.controller.deleteFeature(feature);
				this.delInteraction.resetSelection();
			}
		}
	},
	
	/**
	 * Remove feature from source and launch featureremove edit controller event.
	 * @param {ol.Feature}
	 */
	removeFeature: function(feature) {
		this.delInteraction
		var source = this.getLayerSource();
		source.removeFeature(feature);
		this.controller.fireEvent("featureremove", feature);
	}
});