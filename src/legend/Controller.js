/**
 *
 */
Ext.define('Ck.legend.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.cklegend',
	
	/**
	 * Class list possible for node main <tr> with associate
	 * function returned boolean to indicated if node have to be added.
	 */
	nodeClasses: {
		"ck-disabled-layer" : function(record, index, rowParams, store) {
			var lyr = record.get("layer");
			if(lyr instanceof ol.layer.Group || this.getMap().layerInRange(lyr)) {
				return false;
			} else {
				return true;
			}
		}
	},
	
	/**
	 * Add listeners on add and remove layer
	 */
	ckReady: function(ckMap) {
		ckMap.legend = this;

		// Link main layer group to root node
		var mainGrp = ckMap.getOlMap().getLayerGroup();
		var rootNode = this.getView().getRootNode();

		mainGrp.set("node", rootNode);
		rootNode.set("layer", mainGrp);
		
		// Add event listeners
		ckMap.on("addlayer", this.layerAdd, this);
		ckMap.on("removelayer", this.layerRemove, this);
	},

	/**
	 * When map is loaded, add layers to legend
	 */
	ckLoaded: function() {
		var v = this.getView();
		
		// Attach events
		v.getStore().on('update', this.onUpdate);

		// Expand on item click
		v.on('itemclick', function(view, rec, item, index, e, eOpts) {
			if(!Ext.String.startsWith(e.target.className.trim(), "x-action") && !Ext.String.startsWith(e.target.className.trim(), "x-tree-checkbox")) {
				view.toggle(rec);
			}
		});
		
		// Manage row style
		v.getView().getRowClass = this.getNodeClasses.bind(this);

		// Event on ol view resolution change
		this.getMap().getOlView().on('change:resolution',	this.setLegendLayersStyle, this);

		this.fireEvent('ready', this);
	},
	
	/**
	 * Call all functions to generate class list for node
	 * @return {String} Class list
	 */
	getNodeClasses: function(record, index, rowParams, store) {
		var cls, classes = "";
		for(var cls in this.nodeClasses) {
			if(this.nodeClasses[cls].apply(this, arguments)) {
				classes += " " + cls;
			}
		}
		
		return classes.substring(1);
	},

	/**
	 *
	 * @param {ol.layer.Base}
	 * @param {Number} Index of the layer in the layer group
	 */
	layerAdd: function(layer, idx) {
		if(!Ext.isEmpty(layer.get("title")) && !Ext.isEmpty(layer.get("group")) && (layer instanceof ol.layer.Group || layer.ckLayer.getUserLyr())) {
			var node = {
				leaf: !(layer instanceof ol.layer.Group),
				text: layer.get('title'),
				checked: (layer.get('visible') && !(layer instanceof ol.layer.Group)),
				iconCls: 'x-tree-noicon',
				layer: layer,
				allowDrop: (layer instanceof ol.layer.Group),
				qtip: layer.getExtension("legendQtip")
			};

			var grpNode = layer.get("group").get("node");

			node = grpNode.insertChild(grpNode.childNodes.length - idx, node);
			layer.set("node", node);

			// Append and remove node events (to manage order for example)
			node.on("move", this.layerMove, this);
		}
	},

	/**
	 * On node move (layer or group), move the layer into the map layer collection
	 * @param {Ext.data.NodeInterface}
	 * @param {Ext.data.NodeInterface}
	 * @param {Ext.data.NodeInterface}
	 * @param {Number}
	 */
	layerMove: function(node, oldGrp, newGrp, idx) {
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
		
		// Return false to avoid move event recusion. Action already done by OpenLayers group managment
		return false;
	},

	/**
	 * Called when a layer is removed from the map
	 * @param {ol.layer}
	 */
	layerRemove: function(layer) {
		var node = layer.get("node");
		if(node) {
			node.remove();
		}
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
		var node, layer, layers = this.getMap().getLayers().getArray();
		for(var i = 0; i < layers.length; i++) {
			layer = layers[i];
			node = layer.get("node");
			if(node && !(layer instanceof ol.layer.Group)) {
				this.setNodeStatus(node, this.getMap().layerInRange(layer));
			}
		}
	},
	
	/**
	 * Enable or disable node. Use getNodeClasses method
	 * @params {Ext.data.NodeInterface} Must be a leaf
	 * @params {Boolean}
	 */
	setNodeStatus: function(node, active) {
		var domNode = this.getNodeDomElement(node);
		if(domNode) {
			var tr = domNode.getElementsByClassName("x-grid-tree-node-leaf")[0];
			for(var cls in this.nodeClasses) {
				if(this.nodeClasses[cls].apply(this, arguments)) {
					tr.classList.add(cls);
				} else {
					tr.classList.remove(cls);
				}
			}
		}
	},

	/**
	 * Get the generated Dom node of the legend layer from the Layer's node object
	 * @return {DOMElement|undefined}
	 */
	getNodeDomElement: function(node){
		var nodeDom, recordId, id = node.internalId;
		var tablesDom = node.getOwnerTree().getEl().dom.getElementsByTagName("table");
		
		for(var i = 0; i < tablesDom.length; i++) {
			recordId = tablesDom[i].getAttribute("data-recordid");
			if(recordId == id) {
				return tablesDom[i];
			}
		}
	}
});
