/**
 * Edit tool used to delete a feature
 */
Ext.define('Ck.edit.action.Delete', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditDelete',

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'fa fa-remove fa-lg fa-flip-horizontal ck-plugin',
	tooltip: 'Delete feature',
	
	/**
	 * Ask confirmation to the user before remove
	 */
	deleteConfirmation: true,

	toggleAction: function(btn, status) {
		this.callParent([btn]);
		
		if(!this.delInteraction) {
			this.delInteraction = new ol.interaction.Select({
				layers: [this.getLayer()],
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: 'yellow',
						width: 3
					}),
					fill: new ol.style.Fill({
						color: 'rgba(0, 0, 255, 0.1)'
					})
				})
			});
			
			this.delInteraction.on('select', function(e) {
				if(e.selected.length != 0) {
					var feature = e.selected[0];
					
					if(this.deleteConfirmation) {
						Ext.Msg.show({
							title: "Edition",
							message: "Are you sure to delete this feature ?",
							buttons: Ext.Msg.YESNO,
							icon: Ext.Msg.QUESTION,
							scope: this,
							fn: function(btn) {
								if (btn === 'yes') {
									this.removeFeature(feature);
								}
							}
						});
					} else {
						this.removeFeature(feature);
					}
					this.delInteraction.getFeatures().clear();
				}
			}, this);
		   
			this.map.getOlMap().addInteraction(this.delInteraction);
			this.interactions["delInteraction"] = this.delInteraction;
		}

		this.delInteraction.setActive(status);
	},
	
	/**
	 * Remove feature from source and launch featureremove edit controller event.
	 * @param {ol.Feature}
	 */
	removeFeature: function(feature) {
		var source = this.getLayerSource();
		source.removeFeature(feature);
		this.controller.fireEvent("featureremove", feature);
	}
});