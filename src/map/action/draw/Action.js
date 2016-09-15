/**
 */
Ext.define('Ck.map.action.draw.Action', {
	extend: 'Ck.Action',
	itemId: 'drawPoint',
	toggleGroup: 'ckmapDraw',
	
	drawId: "default",
	interaction: null,
	
	requires: [
		'Ck.Draw'
	],
	
	/**
	 *
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: "default"
		});
		
		map.on("contextloading", function() {
			if(this.getBtn()) {
				this.getBtn().toggle(false);
			}
		}, this);
	},
	
	/**
	 * 
	 */
	toggleAction: function(btn, pressed) {
		if(pressed) {
			if(!this.interaction) {
				this.interaction = new ol.interaction.Draw({
					source: this.draw.getSource(),
					type: this.type
				});
				this.draw.getOlMap().addInteraction(this.interaction);
			}
			this.interaction.setActive(true);
		} else {
			if(this.interaction) {
				this.interaction.setActive(false);
			}
		}
		this.draw.activeDraw(this.type, pressed);
	}
});
