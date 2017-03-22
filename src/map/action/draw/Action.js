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

		this.getDraw(map);

		map.on("contextloading", function() {
			if(this.getBtn()) {
				this.getBtn().toggle(false);
			}
		}, this);
	},

	destroy: function () {
		// TODO: review draw instance managment !
		var ckmap = this.getMap();
		if(ckmap) delete ckmap.draw[this.draw.getId()];

		this.draw = null;
		this.interaction = null;
	},

	/**
	 *
	 */
	toggleAction: function(btn, pressed) {
		if(!this.interaction) {
			this.createInteraction();
		}
		if(pressed) {
			this.interaction.setActive(true);
		} else {
			this.interaction.setActive(false);
		}

		if(pressed && btn.single === true){
			if(this.draw.getSource()) this.draw.getSource().clear();
			this.interaction.on('drawstart', function(){
				this.draw.getSource().clear();
			}, this);
		}

		this.draw.activeDraw(this.type, pressed);
	},

	/**
	 * Create the draw interaction
	 * @param {Object} Options to pass to the interaction instantiation
	 */
	createInteraction: function(opt) {
		opt = (Ext.isObject(opt))? opt : {};
		this.interaction = new ol.interaction.Draw(Ext.applyIf(opt, {
			source: this.draw.getSource(),
			type: this.type,
			style: Ck.Style.drawStyle
		}));
		this.draw.getOlMap().addInteraction(this.interaction);
	},

	getDraw: function(map) {
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: this.drawId
		});
	},

	getFeatures: function () {
		return this.draw.getSource().getFeatures();
	}
});
