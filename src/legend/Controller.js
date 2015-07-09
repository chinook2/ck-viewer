/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */
Ext.define('ck.legend.Controller', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.cklegend',
	
	listen: {
		controller: {
			'ckmap': {
				// 
				ckmapReady: 'onMapReady'
			}
		}
	},
	
	
	init: function() {
		if(!this.getMap()) return;
		
		this.initTree();
	},
	
	onMapReady: function(mapController) {
		this.getView().setMap( mapController );
		this.init();
	},
	
	getMap: function() {
		return this.getView().getMap();
	},
	
	initTree: function() {
		var v = this.getView();
		var root = v.getRootNode();
		
		var layers = this.getMap().getLayers();
		
		layers.forEach(function(layer){			
			var node = {
				leaf: true,
				text: layer.get('title'),
				checked: layer.get('visible'),
                iconCls: 'x-tree-noicon',
				layer: layer
			};
			var pNode = root;
			
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
		});
		
		
		v.getStore().on('update', this.onUpdate);
		
		// olMap.on('addlayer', function() {
			// root.insertBefore(lyr, root); // Pour inserer le layer dans un dossier après
		// });
		
		this.fireEvent('cklegendReady', this);
	},
	
	// bind tree panel to ol map
	onUpdate: function(store, rec, operation, modifiedFieldNames, details, eOpts) {
		var layer = rec.get('layer');
		if(!layer) return;
		
		if(modifiedFieldNames=='checked') {
			layer.set('visible', rec.get('checked'));
		}
	},
	
	
	actionLegendLayerZoom: function(tree, rowIndex, colIndex, row, event, rec) {
		var layer = rec.get('layer');
		if(!layer) return;
		
		var extent = layer.getExtent();
		if(!extent) {
			Ext.log("Layer ''"+ layer.get('title') +"' have no extent !");
			return;
		}
		
		this.getMap().setExtent(extent);
	}
});
