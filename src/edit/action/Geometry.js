/**
 * This action is used to modify the geometry of a feature.
 * Two interactions are created :
 *
 * - geometryInteraction : to select the feature to modify
 * - vertexModifyInteraction : to modify vertex
 */
Ext.define('Ck.edit.action.Geometry', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditGeometry',

	iconCls: 'fa fa-edit',
	tooltip: 'Edit geometry',

	toggleAction: function(btn, status) {
		this.used = true;
		
		var source = this.getLayerSource();
		
		if(!this.geometryInteraction) {
			this.geometryInteraction = new ol.interaction.Select({
				layers: [this.getLayer()],
				zIndex: Ck.map.Style.zIndex.editInteraction
			});
			this.map.getOlMap().addInteraction(this.geometryInteraction);

			// At the selection we analyse the feature
			this.geometryInteraction.on('select', function (e) {
				
				this.feature = null;
				this.selectedVertex = null;
				
				// If nothing selected -> return
				if(e.selected.length==0) return;
				
				this.feature = e.selected[0];				
				
				this.editController.startGeometryEdition(this.feature);   
			}.bind(this));
		}
		
		this.geometryInteraction.setActive(status);
	},
	
	disableInteraction: function() {
		this.geometryInteraction.setActive(false);
	},
	
	enableInteraction: function() {
		this.geometryInteraction.setActive(true);
	},
	
	/**
	 * Unhighlight feature
	 */
	reset: function() {
		this.geometryInteraction.getFeatures().clear();
	},
	
	closeAction: function() {
		this.map.getOlMap().removeInteraction(this.geometryInteraction);
		delete this.geometryInteraction;
	}
});