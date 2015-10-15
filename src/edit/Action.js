/**
 *
 */
Ext.define('Ck.edit.Action', {
	extend: 'Ck.Action',

	alias: 'controller.edit-editpanel',

	layer: null,
	layerStyle: null,
	defaultGeometryType: "polygon",
	defaultTolerance: 10,
	
	used: false,

	constructor: function(config) {
		this.config = config;
		this.layer = config.layer;
		this.callParent([config]);

		this.map = Ck.getMap();
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
		this.layer = this.map.getLayer(layerId);

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
		return this.layer.ckParams.geometryType || this.defaultGeometryType;
	},

	/**
	 * Get the tolerance
	 * @return {Number}
	 **/
	getTolerance: function() {
		return this.config.tolerance || this.defaultTolerance;
	},

	/**
	 * Called after every change
	 * @param {ol.feature}
	 */
	endAction: function(feature) {
		
		switch(this.saveMethod) {
			case "local":
				// Init Bdd ...
				this.storage.save({
					layer: 'predios',
					sid: null,
					data: {
						cedula: ced
					}
				});
				break;
			default:
				
				break;
		}
	},
	
	close: function() {
		if(this.used) {
			this.closeAction();
		}
	}
});