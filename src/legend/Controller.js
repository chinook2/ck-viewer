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
				layersloading : 'onlayersloading',
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
		
		var trit = v.items.items;
		var ligitem = trit[0].dataSource.data.items;
		var expandedGroups = Ck.getOption('expandedGroups') || [];
		/*for(i=0 ; i < ligitem.length; i++){
			if(ligitem[i].data.parentId == 'root'){
				if(expandedGroups.indexOf(ligitem[i].data.text)  != -1 ){
					ligitem[i].expand();
				}
			}
		}*/
		// Attach events
		v.getStore().on('update', this.onUpdate);
		
		// Expand on item click
		v.on('itemclick', function(view, rec, item, index, e, eOpts){
			if(!Ext.String.startsWith(e.target.className.trim(), "x-action") && !Ext.String.startsWith(e.target.className.trim(), "x-tree-checkbox")) {
				view.toggle(rec);
			}
		});
		
		// Event on ol view resolution change
		var olv = this.getMap().getOlView();
			olv.on('change:resolution',	this.setLegendLayersStyle, this
		);
		
		v.getRootNode().on('expand' , this.setLegendLayersStyle, this);
		
		this.setLegendLayersStyle();
		
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
			
			this.setLegendLayerStyle(layer, node);
			
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
	
	onlayersloading: function(){
		/*
		var v = this.getView();
		trit = v.items.items;
		ligitem = trit[0].dataSource.data.items;
		for(i=0 ; i < ligitem.length; i++){
			if(ligitem[i].data.parentId == 'root'){
				
			}else{
				if(ligitem[i].data.text == 'affleurantenveloppepcrs'){
					if(ligitem[i].data.disabled == true){
						ligitem[i].data.disabled = false;
					}else{
						ligitem[i].data.disabled = true;
					}
					
					trit[0].refresh();
				}
			}
		}
		*/
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
			if(data.layer && data.layer == layer){
					return node;
			}else if(node.childNodes && node.childNodes.length > 0) {
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
	},
	
	/**
	 * Set legend layers labels style for all layer 
	 */
	setLegendLayersStyle: function(){
			var layers = Ck.getMap().getLayers();
			var layer;
			var node;
			var nodeDom;
			for(var i = 0; i < layers.array_.length; i++) {				
				layer = layers.array_[i];
				if(layer instanceof ol.layer.Group) continue;
				
				node = layer.get("node");
				if(node){
					node.set("disabled", true);
					if (Ck.getMap().layerInRange(layer)) {
						node.set("disabled", false);
					}
					
					/*
					//nodeDom = this.getNodeDomElement(node);
					//if(!(layer instanceof ol.layer.Group) && !Ck.getMap().layerInRange(layer) && (nodeDom)){					
					if(!Ck.getMap().layerInRange(layer)){					
						//nodeDom.style.color = '#FF000';
						//nodeDom.classList.add("ck-disabled-layer");
						//Ext.fly(nodeDom).addCls("ck-disabled-layer");
						node.set("disabled", true);
					//}else if(!(layer instanceof ol.layer.Group) && Ck.getMap().layerInRange(layer) && (nodeDom)) {
					} else if(Ck.getMap().layerInRange(layer)) {
						//nodeDom.style.color = '#404040';
						//nodeDom.classList.remove("ck-disabled-layer");
						//Ext.fly(nodeDom).removeCls("ck-disabled-layer");
						node.set("disabled", false);
					}
					*/
				}				
			}
	},
	
	/**
	 * Set legend layer label style for the selected layer
	 */
	setLegendLayerStyle: function(layer, node){
		var nodeDom = this.getNodeDomElement(node);;	
		if(!(layer instanceof ol.layer.Group) && !Ck.getMap().layerInRange(layer) && (nodeDom)){				 
			//nodeDom.style.color = '#FF000';
		}
	},
	
	/**
	 * Get the generated Dom node of the legend layer from the Layer's node object
	 */
	getNodeDomElement: function(node){
		var nodeDom;
		var id = node.internalId;
		var recordId;
		var treeDom = node.getOwnerTree().getEl().dom;
		var tablesDom = treeDom.getElementsByTagName("table");
		for (var i = 0; i < tablesDom.length; i++) { 
			recordId = tablesDom[i].getAttribute("data-recordid"); 
			if ( recordId == id) { 
				nodeDom = tablesDom[i];
			}
		}
		return nodeDom;
	}
});
