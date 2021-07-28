/**
 */
Ext.define('Ck.map.action.draw.Modify', {
	extend: 'Ck.map.action.draw.Action',
	alias: 'widget.ckmapDrawModify',
	itemId: 'drawModify',
	iconCls: 'ckfont ck-edit',

	tooltip: "Modifiez les dessins",
	
	drawId: "default",
	requires: [
		'Ck.Draw'
	],

	selectedFeatures: [],

	/**
	 * Create the draw interaction
	 * @param  {Object} opt : Options to pass to the interaction instantiation
	 */
	createInteraction: function(opt) {
		var map = this.draw.getOlMap();
		var draw = this.draw;

		if (this.interaction) {
			map.removeInteraction(this.interaction);
		}

		this.interaction = new ol.interaction.Select({
			layers: [draw.getLayer()],
			condition: ol.events.condition.singleClick,
			style: false
		});
		this.interaction.on('select', this.onInteractionSelect.bind(this));
		    
		this.selectedFeatures = this.interaction.getFeatures();
		
		map.addInteraction(this.interaction);
	},


	/**
	 * [removeFeature description]
	 * @param  {[type]} feature [description]
	 */
	removeSelectedFeature: function() {
		if(!this.selectedFeatures) return;

		var feature = this.selectedFeatures.getArray()[0];
		this.selectedFeatures.clear();
		this.removeFeature(feature);
		this.objprt.modifyFeature(false);
	},

	/**
	 * [removeFeature description]
	 * @param  {[type]} feature [description]
	 */
	removeFeature: function(feature) {
		var props, features,
			source = this.draw.getSource();

		features = source.getFeatures() || [];

		if (features.length == 0) {
			return;
		}

		if (feature) {
			source.removeFeature(feature);
		}
	},

	/**
	 * [onInteractionSelect description]
	 * @param  {[type]} evt [description]
	 */
	onInteractionSelect: function(evt) {
		var choicePanel = this.choicePanel;
	    var feature = evt.selected[0], type, items;

	    if (feature) {
			// fireEvent ne passe pas, on fait la callback à l'ancienne
			this.objprt.modifyFeature(feature);
	    } else {
			this.objprt.modifyFeature(false);
	    }
	}
});
