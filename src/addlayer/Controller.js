/**
 * Controller of the addlayer panel. An addlayer panel consists of :
 *
 * - AddLayer action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer',


	wms: true,
	wfs: true,
	vector: {
		visible: true,
		type: ['shp', 'mif', 'gpx']
	},

	init : function(view) {
		var nbTabs = 0;

		// Enable or disable items according to config
		this.view.items.items.forEach(function(element) {
			var itemId = element.itemId ? element.itemId : element.xtype;
			switch(itemId) {
			case 'addlayer-wfs':
				element.tab.setVisible(view.config.wfs);
				if(view.config.wfs) nbTabs++;
				break;
			case 'addlayer-wms':
				element.tab.setVisible(view.config.wms);
				if(view.config.wms) nbTabs++;
				break;
			case 'ckimportvector':
				var myElement = element;
				myElement.openner = view.openner;
				myElement.tab.setVisible(view.config.vector.visible);
				if(view.config.vector.visible) nbTabs++;

				// Load format from configuration
				//@see ck-viewer\src\importvector\Model.js for id
				var formatStore = myElement.getViewModel().getStore("format");

				var newData = [];
				// Remove unsused elements for format store
				formatStore.data.items.forEach(function(el) {
					// if el from store is not present in types, we removed it
					if(view.config.vector.type.indexOf(el.id) != -1) {
						newData.push(el);
					}
				});

				formatStore.on('load', function(records) {
					this.loadRawData(newData);
				});

				//Load projection for configuration
				var projectionStore = myElement.getViewModel().getStore("projection");

				projectionStore.on('load', function(records) {
					this.loadRawData(view.config.vector.projection);
				});
				myElement.getController().importParam = view.config.vector.importParam;

				// Force refresh of stores with new value ..
				formatStore.load();
				projectionStore.load();


				// ReInit combobox with new store value
				myElement.getController().loadDefaultParam(); // If only one value is set as Types, combobox of selection is not displayed

				break;
			default:
				break;
			}
		});

		if (nbTabs < 2) {
			var tabs = view.getTabBar();
			tabs.hide();
		}

	},

	/**
	 * Add a layer from node
	 *
	 * @param {Ext.view.View}
	 * @param {Ext.data.Model} The node
	 * @return {OpenLayers.Layer/Boolean} The created layer or false
	 */
	addLayer: function(tree, node) {
		var layer = false;
		if(node.isLeaf()) {
			var ckMap = this.getMap();
			var olView = ckMap.getOlView();
			var wfsAvailable = false;
			var capabilities = tree.getBubbleParent().getController();

			var datasource = capabilities.getDatasource();
			var data = node.data.data;

			var url = datasource.url;
			var name = data.Name || data.name || node.text;
			var title = data.Title || data.title;
			var srs = data.SRS || data.Srs || node.srs;
			var attribution = data.Attribution || data.attribution || node.attribution;
			var _abstract = data.Abstract || data['abstract'];

			var ConnectionType = data.ConnectionType || datasource.type;
			ConnectionType = ConnectionType.toUpperCase();
			var queryable = (ConnectionType == "WFS" || ConnectionType == "POSTGIS");

			var bbox = data.BoundingBox || data.boundingbox;
			var bbox = (Ext.isArray(bbox))? bbox[0] : bbox;
			var maxres = data.maxResolution || data.maxresolution;
			var minres = data.minResolution || data.minresolution;

			var mapproj = ckMap.getOlView().getProjection();

			maxextent = bbox.bbox.split(",");

			// BBox may be limited
			maxextent = Ck.limitBBox(maxextent, ckMap.getExtent(), bbox.srs, mapproj);

			// Gestion des groupes pour bien placer la couche
			if(data.Group) {
				var group = data.Group.join("/");
			} else {
				var group = this.groupName;
				if(this.groupByDatasource) group += "/" + datasource.title;
			}

			if(this.groupExists) {
				var gp;
				var aGp = {};
				for(var m=0; m < this.map.layers.length; m++) {
					gp = this.map.layers[m].group;
					if(gp) {
						gp = gp.toString().split("/");
						aGp[gp[0]] = true;
					}
				}
				// Si group existe dans le map
				var nGp = node.getPath("text").replace(/\/{1,}/g, "/").replace(/^\/{1,}/, "");
				var aG = nGp.split("/");
				if(aGp[aG[0]]) {
					aG.pop();
					group = aG.join("/");
				}
			}

			createOperation = function(type) {
				var operation;
				switch(type) {
					case "WMS":
						operation = {
							code	: "GetMap",
							method	: "GET",
							type	: "image/png",
							href	: url + "?LAYERS=" + name + "&SRS=" + srs[0] + "VERSION=" + capabilities.getVersion()
						};
						break;
					case "WFS":
						operation = {
							code	: "GetFeature",
							method	: "GET",
							type	: "application/xml",
							href	: url + "?SERVICE=WFS&REQUEST=GetFeature&LAYERS=" + name + "&TYPENAME=" + name + "&SRS=" + srs[0] + "VERSION=" + capabilities.getVersion()
						}
				}
				return operation;
			};

			// We use originOwc to create layer. Need to save old layers array
			var originLayers = ckMap.originOwc.getLayers();

			// Layer is queryable through WMS (mandatory)
			var lyr = {data: {
					id: name,
					properties: {
						name: name,
						title: title,
						offerings: [{
							code: Ck.codeOperation["wms"],
							version: capabilities.getVersion(),
							operations: [createOperation("WMS")]
						}],
						extension: {
							removable: true
						}
					}
				}
			};

			// If layer can be queried through WFS service
			if(wfsAvailable || true) {
				lyr.data.properties.offerings.push({
					code: Ck.codeOperation["wfs"],
					version: capabilities.getVersion(),
					operations: [createOperation("WFS")]
				});
			}

			lyr = new Ck.owsLayer(lyr);
			ckMap.originOwc.setLayers([lyr]);

			// Use ckMap controller to create layer
			ckMap.addLayer(ckMap.originOwc.getLayers()[0]);

			// Set the layers back
			ckMap.originOwc.setLayers(originLayers);
		}

		return layer;
	}
});
