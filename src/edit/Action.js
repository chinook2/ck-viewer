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

	constructor: function(config) {
		this.config = config;
		this.layer = config.layer;
		this.callParent([config]);

		// this.map = Ck.getMap();
		// this.olMap = this.map.getOlMap();
	},

	/**
	 * Save the associated element
	 * @param {Ext.Component}
	 */
	toggleAction: function(el) {
		this.associatedEl = el;
		this.controller = el.lookupController();
		// fix if edit btn config in subclass after 'constructor' call
		if(!this.config.layer && el.layer) this.config.layer = el.layer;

		if(this.used === false) {
			this.controller.getView().on("hide", this.disableAllInteractions, this);
		}
		this.used = true;
	},

	/**
	 * Get the active layer and create it if necessary
	 **/
	getLayer: function() {
		// if(this.layer) {
			// return this.layer;
		// }

		if(Ext.isString(this.config.layer)){
			this.layer = this.getMap().getLayerById(this.config.layer);
			if(this.layer) {
				return this.layer;
			}
		}

		if(this.controller.getLayer) this.layer = this.controller.getLayer();
		if(this.layer) {
			return this.layer;
		}

		if(this.controller.getView().editConfig) var layerId = this.controller.getView().editConfig.layerId;
		if(layerId) this.layer = this.getMap().getLayerById(layerId);
		/*
		if(!this.layer) {
			this.layer = new ol.layer.Vector({
				id: "editLayer",
				name: "Edit layer",
				source: new ol.source.Vector({
					projection: this.getMap().getOlView().getProjection().getCode()
				})
			});
		}
		*/

		return this.layer;
	},

	/**
	 * Récupère le source qui contient les features de l'objet (layer ou source)
	 * @param {ol.layer} Optionnaly a layer. this.layer is used by default
	 * @return {ol.source}
	 **/
	getLayerSource: function(layer) {
		if(Ext.isEmpty(layer)) {
			if(this.controller.getSource) return this.controller.getSource();

			var lyr = this.getLayer()
			if(lyr) return lyr.getSource();
			return null;
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
	 * Retourne le type de gémétrie ou "Polygon" par défaut
	 * @return {String}
	 **/
	getGeometryType: function() {
		var layer = this.getLayer();
		if (layer) {
			var type = layer.getExtension("geometryType");
			if(Ext.isEmpty(type)) {
				var ft = this.layer.getSource().getFeatures()[0];
				if(!Ext.isEmpty(ft)) {
					type = ft.getGeometry().getType();
				}
			}
		}

		return type || this.defaultGeometryType;
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

		this.interactions = [];
		this.layer = null;

		this.callParent(arguments);
	}
});
