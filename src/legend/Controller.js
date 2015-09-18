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
				ready: 'linkToMap'
			}
		}
	},
	
	linkToMap: function(ckMap) {
		ckMap.legend = this;
	},
	
	ckLoaded: function() {
		var v = this.getView();
		
		var layers = this.getMap().getLayers().getArray();
		// Reverse layer order
		for(li=layers.length-1; li>=0; li--){
			this.addLayer(layers[li]);
		}
		
		// Attach events
		v.getStore().on('update', this.onUpdate);
		
		v.getView().on({
			drop: this.onDrop,
			scope: this
		});
		
		// var olMap = this.getMap().getOlMap();
		// olMap.on('addlayer', function() {
			// root.insertBefore(lyr, root); // Pour inserer le layer dans un dossier après
		// });
		
		this.fireEvent('ready', this);		
	},
	
	onMapAddLayer: function(layer) {
		// this.addLayer(layer);
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
        return layers.reverse();	
	},
	
	addLayer: function(layer) {
		var root = this.getView().getRootNode();
		var pNode = root;
		
		var node = {
			leaf: true,
			text: layer.get('title'),
			checked: layer.get('visible'),
			iconCls: 'x-tree-noicon',
			layer: layer
		};
		
		var path = layer.get('path')
		if(path) {
			var keys = path.split('/');
			var keyId = pKeyId = '';
			
			for(i=0; i<keys.length; i++) {
				keyId += '_' + keys[i];
				var isNode = root.findChild('id', keyId);
				if(!isNode) {
					pNode = pNode.appendChild({
						text: keys[i],
						id: keyId,
						iconCls: 'x-tree-noicon',
						checked: false
					}, true);
				} else {
					pNode = isNode;
				}
			};
		}
		
		pNode.appendChild(node);		
	},
	
	// Allow change layer visibility for groups / sub layers. Bind tree store property to ol Layers
	// If we use onCheckChange event update only when click on layer chekbox and not for groups.
	onUpdate: function(store, rec, operation, modifiedFieldNames, details, eOpts) {
		var layer = rec.get('layer');
		if(!layer) return;
		
		if(modifiedFieldNames=='checked') {
			layer.set('visible', rec.get('checked'));
		}
	},
	
	onDrop: function(node, data, overModel, dropPosition, eOpts) {		
        var ckLayers = this.getLayers();
		
		var olLayers = this.getMap().getLayers();
		olLayers.clear();
		
		for(i=0; i<ckLayers.length; i++) {
			olLayers.push(ckLayers[i]);
		}
	}
});
