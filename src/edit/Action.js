/**
 *
 */
Ext.define('Ck.edit.Action', {
	extend: 'Ck.Action',

	layer: null,
	layerStyle: null,
	defaultGeometryType: "Polygon",
	defaultTolerance: 10,
	
	used: false,
	interactions: [],
	
	/**
	 * The edit controller
	 * @var {Ck.Controller}
	 */
	controller: null,

	constructor: function(config) {
		this.config = config;
		this.layer = config.layer;
		this.callParent(arguments);

		this.map = Ck.getMap();
		this.olMap = this.map.getOlMap();
	},
	
	/**
	 * Save the associated element
	 * @param {Ext.Component}
	 */
	toggleAction: function(a) {
		this.disableAllInteractions();
		this.initAction(a);
	},
	
	doAction: function(a) {
		// this.disableAllInteractions();
		// this.initAction(a);
	},
	
	initAction: function(el) {
		this.associatedEl = el;
		this.controller = el.lookupController();
		
		// For ckgroup
		if(!Ext.isFunction(this.controller.getGeometryTypeBehavior)) {
			this.controller = el.ownerCt.ownerCt.lookupController();
		}

		if(!this.used) {
			this.firstUse();
		}
	},
	
	firstUse: function() {
		this.controller.getView().on("hide", this.disableAllInteractions, this);
		this.used = true;
	},

	/**
	 * Get the active layer and create it if necessary
	 **/
	getLayer: function() {
		this.layer = this.controller.getLayer();
		if(this.layer) {
			return this.layer;
		}
		
		var layerId = this.controller.getView().editConfig.layerId;
		this.layer = this.map.getLayerById(layerId);

		if(!this.layer) {
			this.layer = new ol.layer.Vector({
				id: "editLayer",
				name: "Edit layer",
				source: new ol.source.Vector({
					projection: this.map.getOlView().getProjection().getCode()
				})
			});
		}

		return this.layer;
	},

	/**
	 * Récupère le source qui contient les features de l'objet (layer ou source)
	 * @param {ol.layer} Optionnaly a layer. this.layer is used by default
	 * @return {ol.source}
	 **/
	getLayerSource: function(layer) {
		if(Ext.isEmpty(layer)) {
			return this.getLayer().getSource();
		} else {
			return layer.getSource();
		}
	},

	/**
	 * Replace the active layer
	 * @param {ol.layer} The new layer to use
	 **/
	setLayer: function(layer) {
		this.layer = layer;
		this.openner.getView().layerId = layer.getProperties().id;
	},

	/**
	 * Get the tolerance
	 * @return {Number}
	 **/
	getTolerance: function() {
		return this.config.tolerance || this.defaultTolerance;
	},
	
	disableAllInteractions: function() {
		for(var interaction in this.interactions) {
			if(!Ext.isEmpty(this.interactions[interaction])) {
				this.interactions[interaction].setActive(false);
			}
		}
	},
	
	/**
	 * On destroy remove all interactions from the map
	 */
	destroy: function() {
		for(var key in this.interactions) {
			this.interactions[key].setActive(false)
			if(Ext.isFunction(this.interactions[key].destroy)) {
				this.interactions[key].destroy();
			}
			delete this[key];
		}
		delete this.layer;
		this.callParent(arguments);
	}
});