/**
 * Controller of the edit panel. An edit panel consists of :
 *
 * - Edit action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer',

	config: {
		openner: null,
		
		/**
		 * Source parameters
		 * @property {Object}
		 */
		source: null,
		
		/**
		 * Add capabilities root folder to legend when adding layer
		 */
		capabilitiesRoot: false,
		
		defaultLayerConfig: {},
		
		/**
		 * True to insert the layer at first in legend
		 */
		insertFirst: false,
		
		/**
		 * wmc, wms or wfs
		 */
		service: "wmc",
		
		/**
		 * False to add layer without its group in the legend
		 */
		keepStructure: true
			
	},
	
	/**
	 * @protected
	 */
	init: function(view) {
		
		this.callParent(arguments);
		
		this.setInsertFirst(view.config.insertFirst);
		this.setService(view.config.service);
		this.setKeepStructure(view.config.keepStructure);

		this.selector = view.down("#sourceselector");
		this.capabilities = view.down("#sourcecapabilities");
		this.capabilitiesCtrl = this.capabilities.getController();

		this.selector.on("select", this.loadCapabilities, this);
	},

	/**
	 * Launch the loading of capabilities
	 */
	loadCapabilities: function(cbx, rcd) {
		this.setSource(rcd);
		this.capabilitiesCtrl.loadCapabilities(rcd);
	},
	
	/**
	 * Add a layer (or a directory) to the map
	 * @param {Object}
	 */
	addLayer: function(config) {
		if(config.owsLayer instanceof Ck.format.OWSContextLayer) {
			owsLayer = config.owsLayer;
		} else {
			var cnxType = config.ConnectionType || this.getSource().service;
			cnxType = cnxType.toUpperCase();
			cnxType = (cnxType == "CHINOOK")? "WMS": cnxType;

			if(!this.getCapabilitiesRoot()) {
				config.Group.splice(0, 1);
			}
			/*
			attribution: config.Attribution || config.attribution || config.attribution,
			_abstract: config.Abstract || config['abstract'],
			singletile: true,
			extent: config.BoundingBox || config.boundingbox,
			maxres: config.maxResolution || config.maxresolution,
			minres: config.minResolution || config.minresolution,
			mapproj: this.getOlView().getProjection().getCode()
			queryable: (cnxType == "WFS" || cnxType == "POSTGIS")
			extent = lyrConf.extent[0];
			maxextent = OpenLayers.Bounds.fromString(BoundingBox.bbox);
			// Limite et éventuellement reprojection de l'extente
			maxextent = OpenLayers.Util.limitBBox(maxextent, map.getExtent(), BoundingBox.srs, mapproj);
			*/

			var opt = {
				name			: config.Name || config.name || config.text,
				srs				: config.SRS || config.Srs || config.srs,
				visibility		: true,
				isBaseLayer		: false,
				connectiontype	: cnxType,
				path			: config.Group.join("/")
			};

			// Arbitrary srs choice
			if(Ext.isArray(opt.srs)) {
				opt.srs = opt.srs[0];
			}

			// Création de la couche
			var off;
			switch(cnxType) {
				case "WFS":
					off = [{
						code: "http://www.opengis.net/spec/owc-wfs/1.0/req/wfs",
						operations: [{
							code: "GetFeature",
							method: "GET",
							type: "application/xml",
							href: this.getFullUrl(this.getSource().url) + "SERVICE=WFS&REQUEST=GetFeature&TYPENAME=" + opt.name + "&VERSION=1.1.0&LAYERS=" + opt.name + "&SRS=" + opt.srs
						}]
					}];
					break;
				case "WMS":
					off = [{
						code : "http://www.opengis.net/spec/owc-wms/1.0/req/wms",
						operations : [{
							code	: "GetMap",
							method	: "GET",
							type	: "application/image",
							href	: this.getFullUrl(this.getSource().url) + "SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.0&LAYERS=" + opt.name + "&SRS=" + opt.srs
						}]
					}];
					break;
				default:
				case "TILECACHE":
				case "POSTGIS":
				case "SHAPE":
					Ck.log("Datasource " + cnxType + " doesn't supported");
					break;
			}
			
			var lyrOpt = {
				type		: "Feature",
				id			: opt.name,
				properties	: {
					title		: config.Title || config.title || config.text,
					visible		: true,
					updated		: "2015-07-22T00:00:00Z",
					content		: "Plan agglo réalisé par les services SIGS",
					authors		: [],
					publisher	: "CAPP",
					categories	: [],
					links		: [],
					active		: true,
					offerings	: off,
					extension	: {
						path		: opt.path,
						extraLayer	: true
					}
				}
			};
			
			// Apply default options
			Ext.Object.merge(lyrOpt, this.getDefaultLayerConfig);

			var owsLayer = new Ck.owsLayer({data: lyrOpt});
		}
		
		owsLayer.setVisible(true);
		if(!this.getKeepStructure()) {
			owsLayer.getData().properties.extension.path = "";
		}
		this.getMap().addLayer(owsLayer, null, (this.getInsertFirst())? 0 : Infinity);
	}
});
