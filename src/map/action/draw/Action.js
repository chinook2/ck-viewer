/**
 */
Ext.define('Ck.map.action.draw.Action', {
	extend: 'Ck.Action',
	itemId: 'drawPoint',
	toggleGroup: 'ckmapDraw',

	drawId: "default",
	interaction: null,
	win: null,

	requires: [
		'Ck.Draw'
	],

	constructor: function() {
		this.callParent(arguments);
	},

	/**
	 *
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();

		this.getDraw(map);

		map.on("contextloading", function() {
			if (this.getBtn()) {
				this.getBtn().toggle(false);
			}
		}, this);
	},

	/**
	 * [destroy description]
	 */
	destroy: function() {
		// TODO: review draw instance managment !
		var ckmap = this.getMap();
		if (ckmap) {
			delete ckmap.draw[this.draw.getId()];
		}

		this.draw = null;
		this.interaction = null;
	},

	/**
	 * [toggleAction description]
	 * @param  {Ext.button.Button} btn     [description]
	 * @param  {boolean} pressed [description]
	 */
	toggleAction: function(btn, pressed, opt) {
		if (this.interaction) {
			this.draw.getOlMap().removeInteraction(this.interaction);
		}

		this.createInteraction(opt);
		
		if (pressed) {
			this.interaction.setActive(true);
		} else {
			this.interaction.setActive(false);
		}

		if (pressed && btn.single === true) {
			if (this.draw.getSource()) this.draw.getSource().clear();
			this.interaction.on('drawstart', function(evt) {
				this.draw.getSource().clear();
			}).bind(this);
		}
		/*
		var type = this.type ? this.type : (/modify$/i.test(this.itemId) ? "Modify" : "");
		console.log(type);
		if (type) {
			this.draw.activeDraw(type, pressed);
		}
		*/
	},

	/**
	 * Create the draw interaction
	 * @param {Object} Options to pass to the interaction instantiation
	 */
	createInteraction: function(opt) {
		opt = (Ext.isObject(opt))? opt : {};

		if(this.type == "Text"){
			strtype = "Point";
		}else{
			strtype = this.type;
		}

		this.interaction = new ol.interaction.Draw(Ext.applyIf(opt, {
			source: this.draw.getSource(),
			type: strtype,
			style: Ck.Style.drawStyle
		}));
		this.draw.getOlMap().addInteraction(this.interaction);
	},

	/**
	 * [updateInteraction description]
	 * @param  {[type]} style [description]
	 */
	updateInteraction: function(style) {
		this.interaction.on('drawstart', function(evt) {
		    evt.feature.setStyle([style]);
		});
	},

	/**
	 * [getDraw description]
	 * @param  {[type]} map [description]
	 */
	getDraw: function(map) {
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: this.drawId
		});
		this.draw.win = this.win;
	},

	/**
	 * [getFeatures description]
	 */
	getFeatures: function() {
		return this.draw.getSource().getFeatures();
	}
});
