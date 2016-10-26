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
						}]
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
			var olLayer = ckMap.createLayer(ckMap.originOwc.getLayers()[0], ckMap.originOwc);
			
			if(olLayer) {
				olLayer.ckLayer = lyr;
				ckMap.getOlMap().addLayer(olLayer);
				ckMap.getLegend().addLayer(olLayer);
			}
			
			// Set the layers back
			ckMap.originOwc.setLayers(originLayers);
		}
		
		return layer;
	}
});
