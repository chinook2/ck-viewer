/**
 */
Ext.define('Ck.map.action.draw.Action', {
	extend: 'Ck.Action',
	itemId: 'drawPoint',
	toggleGroup: 'ckmapAction',

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
	 * [destroy description]
	 */
	destroy: function() {
		if(!this.draw) return;
		
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
		// OFF (keep existingf this.draw)
		if (!pressed) {
			if (this.interaction) {
				this.draw.getOlMap().removeInteraction(this.interaction);
				this.interaction.setActive(false);
				this.interaction = null;
				return;
			}
		}

		// ON
		// TODO: review source of truth for current type
		// need init here to init correct style 
		this.win.currentType = this.type;

		// Get fresh instance of this.draw
		//this.olMap = this.getMap().getOlMap();
		this.getDraw();

		this.createInteraction(opt);
		this.interaction.setActive(true);
		

		if (pressed && btn.single === true) {
			if (this.draw.getSource()) this.draw.getSource().clear();
			this.interaction.on('drawstart', function(evt) {
				this.draw.getSource().clear();
			}).bind(this);
		}

		var type = this.type ? this.type : (/modify$/i.test(this.itemId) ? "Modify" : "");
		// console.log(type);
		if (type) {
			this.draw.activeDraw(type, pressed);
		}
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
			type: strtype
		}));
		this.draw.getOlMap().addInteraction(this.interaction);
		
		// Copy layer style (= Current style) to Feature
		this.interaction.on('drawstart', function(evt) {
			var style = this.interaction.getOverlay().getStyle();
		    evt.feature.setStyle([style]);
		}.bind(this));

		if (this.objprt) {
			this.objprt.updateStyle(); // call updateInteraction()
		}
	},

	/**
	 * [updateInteraction description]
	 * @param  {[type]} style [description]
	 */
	updateInteraction: function(style) {
		if(!this.interaction) return;	
		this.interaction.getOverlay().setStyle(style);
	},

	/**
	 * [getDraw description]
	 * @param  {[type]} map [description]
	 */
	getDraw: function(map) {
		if(!map) map = this.getMap();
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
