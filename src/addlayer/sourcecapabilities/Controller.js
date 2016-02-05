/**
 * Controller of the edit panel. An edit panel consists of :
 *
 * - Edit action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.sourcecapabilities.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer.sourcecapabilities',

	config: {
		container: null,

		/**
		 * True to allow addition of several layers in same time
		 */
		allowFolderAdding: false,

		/**
		 * Add capabilities root folder
		 */
		capabilitiesRoot: false
	},

	/**
	 * @event layeradded
	 * Fires when a feature was created
	 * @param {ol.Feature}
	 */

	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent([view]);

		var container = view.up("panel");
		this.setContainer(container);

		view.on("itemclick", this.onNodeClick, this);

		// Initialisation du TreeLoader
		view.setStore(Ck.create("Ck.CapabilitiesTreeStore", {service: container.source.toUpperCase()}));

	},

	/**
	 * On treeNode click
	 * @param {Ext.tree.View}
	 * @param {Ext.data.Model}
	 */
	onNodeClick: function(tree, node) {
		if(!node.data.leaf) {
			if(this.getAllowFolderAdding()) {
				for(var i = 0; i < node.childNodes.length; i++) {
					this.onNodeClick(tree, node.childNodes[i]);
				}
			}
		} else {
			this.addLayer(node.data);
		}
	},

	/**
	 * Add a layer (or a directory) to the map
	 * @param {Object}
	 */
	addLayer: function(config) {
		var cnxType = config.ConnectionType || this.source.type;
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
						href: this.getFullUrl(this.source.url) + "SERVICE=WFS&REQUEST=GetFeature&TYPENAME=" + opt.name + "&VERSION=1.1.0&LAYERS=" + opt.name + "&SRS=" + opt.srs
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
						href	: this.getFullUrl(this.source.url) + "SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.0&LAYERS=" + opt.name + "&SRS=" + opt.srs
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

		var owsLayer = new Ck.owcLayer({data: {
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
		}});

		this.getMap().addLayer(owsLayer);
	},

	/**
	 * Launch the getCapabilities request
	 * @param {Ext.data.Model}
	 */
	loadCapabilities: function(ds) {
		this.source = ds;
		this.reload();
	},

	reload: function() {
		this.getView().getStore().load({
			url: this.getFullUrl(this.source.url) + "service=wms&request=getCapabilities"
		});
	}
});
