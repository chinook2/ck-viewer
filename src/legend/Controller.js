/**
 *
 */
Ext.define('Ck.legend.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.cklegend',

	listen: {
		controller: {
			'ckmap': {
				// Called when add layer to map
				addlayer: 'onMapAddLayer',
				removelayer: 'onMapRemoveLayer',
				contextloading: 'prepareLegend'
			}
		}
	},

	prepareLegend: function(owc) {
		this.getView().getRootNode().removeAll();
		this.getMap().legend = this;
		
		// Link main layer group to root node
		var mainGrp = this.getOlMap().getLayerGroup();
		var rootNode = this.getView().getRootNode();
		
		mainGrp.set("node", rootNode);
		rootNode.set("layer", mainGrp);
	},

	ckLoaded: function() {
		var v = this.getView();

		// Attach events
		v.getStore().on('update', this.onUpdate);
		
		this.fireEvent('ready', this);
	},

	/**
	 * @param {ol.layer.Base}
	 * @param {Number}
	 */
	onMapAddLayer: function(layer, idx) {
		if(!Ext.isEmpty(layer.get("group"))) {
			var node = {
				leaf: !(layer instanceof ol.layer.Group),
				text: layer.get('title'),
				checked: (layer.get('visible') && !(layer instanceof ol.layer.Group)),
				iconCls: 'x-tree-noicon',
				layer: layer,
				allowDrop: (layer instanceof ol.layer.Group)
			};
			
			node = layer.get("group").get("node").insertChild(idx, node);
			layer.set("node", node);
			
			// Append and remove node events (to manage order for example)
			node.on("move", this.onLayerMove, this);
		}
	},

	/**
	 * On node move (layer or group), move the layer into the map layer collection
	 * @param {Ext.data.NodeInterface}
	 * @param {Ext.data.NodeInterface}
	 * @param {Ext.data.NodeInterface}
	 * @param {Number}
	 */
	onLayerMove: function(node, oldGrp, newGrp, idx) {
		var lyr = node.get("layer"),
		oldCol = oldGrp.get("layer").getLayers(),
		newCol = newGrp.get("layer").getLayers();
		
		// Set new group to layer and invert index to respect layer display order
		lyr.set("group", newGrp.get("layer"));
		idx = (newGrp.childNodes.length - idx) - 1;
		
		// Exception for root folder
		if(oldGrp.get("layer") == this.getOlMap().getLayerGroup()) {
			idx++;
		}
		
		// Inhibit remove and add layer map event (in Ck.map.Controller with Ck.functionInStackTrace)
		oldCol.remove(lyr);
		newCol.insertAt(idx, lyr);
		
		// Return false to avoid move event recusion. Action already does by OpenLayers group managment
		return false;
	},
	
	/**
	 * Called when a layer is removed from the map
	 * @param {ol.layer}
	 */
	onMapRemoveLayer: function(layer) {
		var node = this.getNodeByLayer(layer);
		if(node) {
			node.remove();
		}
	},

	/**
	 * Find the node of the tree view corresponding to the specified layer
	 * @param {ol.layer}
	 * @return {Ext.data.NodeStore}
	 */
	getNodeByLayer: function(layer) {
		var searchNode = function(node, layer) {
			var resultNode;
			var data = node.getData();
			if(data.layer) {
				if(data.layer == layer)
					return node;
			} else if(node.childNodes && node.childNodes.length > 0) {
				for(var i = 0; i < node.childNodes.length; i++) {
					resultNode = searchNode(node.childNodes[i], layer);
					if(resultNode) {
						return resultNode;
					}
				}
			}
		};
		var root = this.getView().getRootNode();
		var node = searchNode(root, layer);
		return node;
	},

	getLayers: function() {
        var layers = [];
		var root = this.getView().getRootNode();

        root.cascadeBy(function(rec){
            if (rec.get('layer')) {
                layers.push(rec.get('layer'));
            }
        });
        return layers;
	},

	/**
	 * Allow change layer visibility for groups / sub layers. Bind tree store property to ol Layers
	 * If we use onCheckChange event update only when click on layer chekbox and not for groups.
	 */
	onUpdate: function(store, rec, operation, modifiedFieldNames, details, eOpts) {
		var layer = rec.get('layer');
		if(!layer) return;

		if(modifiedFieldNames=='checked' && !(layer instanceof ol.layer.Group)) {
			layer.set('visible', rec.get('checked'));
		}
	}
});
