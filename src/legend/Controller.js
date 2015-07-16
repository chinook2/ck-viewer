/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */
Ext.define('Ck.legend.Controller', {
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
		
		// olMap.on('addlayer', function() {
			// root.insertBefore(lyr, root); // Pour inserer le layer dans un dossier après
		// });
		
		this.fireEvent('cklegendReady', this);		
	},
	
	onMapReady: function(mapController) {
		this.getView().setMap( mapController );
		this.init();
	},
	
	getMap: function() {
		return this.getView().getMap();
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
