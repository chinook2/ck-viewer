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
		
		if(!this.draw) {
			this.getDraw(map);
		}
		
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
				this.createInteraction();
			}
			this.interaction.setActive(true);
		} else {
			if(this.interaction) {
				this.interaction.setActive(false);
			}
		}
		this.draw.activeDraw(this.type, pressed);
	},
	
	createInteraction: function() {
		this.interaction = new ol.interaction.Draw({
			source: this.draw.getSource(),
			type: this.type
		});
		this.draw.getOlMap().addInteraction(this.interaction);
	},
	
	getDraw: function(map) {
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: this.drawId
		});
	}
});
