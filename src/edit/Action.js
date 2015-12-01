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

		this.map = Ck.getMap();
		this.olMap = this.map.getOlMap();
	},
	
	/**
	 * Save the associated element
	 * @param {Ext.Component}
	 */
	toggleAction: function(el) {
		this.associatedEl = el;
		this.controller = el.lookupController();
		if(this.used == false) {
			// this.associatedEl.on("hide", this.disableAllInteractions, this);
			this.controller.getView().on("hide", this.disableAllInteractions, this);
		}
		this.used = true;
	},

	/**
	 * Get the active layer and create it if necessary
	 **/
	getLayer: function() {
		if(this.layer) {
			return this.layer;
		}

		this.layer = this.associatedEl.lookupController().layer;
		if(this.layer) {
			return this.layer;
		}
		
		var layerId = this.openner.getView().layerId;
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
	 * Retourne le type de gémétrie ou "Polygon" par défaut
	 * @return {String}
	 **/
	getGeometryType: function() {
		var layer = this.getLayer();
		var type = this.layer.getExtension("geometryType");
		if(Ext.isEmpty(type)) {
			var ft = this.layer.getSource().getFeatures()[0];
			if(!Ext.isEmpty(ft)) {
				type = ft.getGeometry().getType();
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
				this.map.getOlMap().removeInteraction(this.interactions[interaction]);
				delete this[interaction];
			}
		}
	},
	
	/**
	 * On destroy remove all interactions from the map
	 */
	destroy: function() {
		this.disableAllInteractions();
	}
});