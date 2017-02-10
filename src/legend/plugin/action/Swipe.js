/**
 * 
 */
Ext.define("Ck.legend.plugin.action.Swipe", {
	extend: "Ck.legend.plugin.Action",
	alias: "plugin.legendlayerswipe",
	
	iconCls: "fa fa-toggle-on fa-lg ck-plugin ck-action-swipe",
	tooltip: "Activate swipe on this layer",
	
	/**
	 *	 Property mode
	 *	 Possible values: split, slider
	 **/
	mode: "split",
		
	/**
	 *	 Function setAction
	 *	 Define action style and enabling
	 **/
	setAction: function() {
		var action = {
			tooltip: this.tooltip,
			handler: this.handlerAction,
			getClass: function(v, meta, rec) {
				var lyr = rec.get('layer');
				if(Ext.isEmpty(lyr) || lyr instanceof ol.layer.Group || !Ext.isFunction(lyr.getExtension)) { // Do not display for groups layers
					return this.disableClass;
				}
				
				return this.iconCls;
				
			},
			scope: this
		}	
		
		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
	},
	
	/**
	 *	Function doAction
	 *	Configure and display swipe
	 */
	doAction: function(layer) {		
		this.callParent(arguments);
		
		// Remove existing swipe
		
		var existingSwipePanel = Ext.getCmp("swipePanel");
		if(existingSwipePanel) {
			existingSwipePanel.layer.setZIndex(existingSwipePanel.layerIndex);
			existingSwipePanel.layer.unByKey(existingSwipePanel.precomposeKey);
			existingSwipePanel.layer.unByKey(existingSwipePanel.postcomposeKey);
			
			if(existingSwipePanel.ui) {
				existingSwipePanel.ui.classList.remove("active");
			}
			
			var closing = existingSwipePanel.layer == layer;
			existingSwipePanel.hide();
			existingSwipePanel.destroy();
			
			if(closing) {
				return;
			}
		}	
		
		var node = this.tree.getView().getNode(this.row);
		var ui = node.getElementsByClassName("ck-action-swipe")[0];
		if(ui) {
			this.ui = ui;
			ui.classList.add("active");
		}
		
		// Configure layer events
		this.layer = layer;
		this.layer.setVisible(true);
		this.layerIndex = this.layer.getZIndex();
		this.layer.setZIndex(1000);
		
		this.precomposeKey = this.layer.on("precompose", this.precompose, this);
		this.postcomposeKey = this.layer.on("postcompose", this.postcompose, this);
		
		// Choose mode
		switch(this.mode) {
			case "split":
				this.createSplit();
				break;
			case "slider":
			default:
				this.createSlider();
				break;
		}		
	},
	
	/**
	 *	Function createSplit
	 *	Creates a split swipe
	 */
	createSplit: function() {
		var map = Ck.getMap();
		var olMap = map.getOlMap();
		var view = map.getView();
		var olView = map.getOlView();
		
		var viewSize = view.getSize();
		var viewPosition = view.getXY();
		
		// Swipe creation
		var swipePanelWidth = 46;
		this.swipeItem = this.swipePanel = Ext.create("Ext.Panel", {
			id: "swipePanel",
			cls: "swipePanel-split",
			width: swipePanelWidth,
			height: viewSize.height,
			renderTo: view.getEl(),
			draggable: true,
			layer: this.layer,
			layerIndex: this.layerIndex,
			precomposeKey: this.precomposeKey,
			postcomposeKey: this.postcomposeKey,
			ui: this.ui,
			layout: {
				type: "hbox",
				align: "middle"
			},
			style: {
				position: "absolute",
				top: 0,
				left: ((viewSize.width * 0.5) - (swipePanelWidth / 2)) + "px", // in map panel centered
				zIndex: 10000
			},
			items: [{ // To repoduce split style...
				xtype: "component",
				cls: "swipePanel-split-arrow-left fa fa-chevron-left",
				border: false,
				width: 20,
				height: 30
			},{
				xtype: "panel",
				cls: "swipePanel-split-panel-center",
				width: 6,
				height: "100%"
			},{
				xtype: "component",
				cls: "swipePanel-split-arrow-right fa fa-chevron-right",
				border: false,
				width: 20,
				height: 30
			}],			
			getValue: function() { // Function to return the % value of the position of the middle of the split
				var map = Ck.getMap();
				var view = map.getView();
				var viewSize = view.getSize();
				var viewPosition = view.getXY();
				var x = this.getX();
				
				// If dragging take the ghost's position
				if(this.isDragged === true) {
					var ghost = Ext.getCmp("swipePanel-ghost");
				
					if(ghost) {			
						x = ghost.getX();
					}
					
					this.isDragged = false;
				}
				
				
				x = x + (swipePanelWidth / 2) - viewPosition[0]; // position of the split + half with of the split (to get the center) + position of the map in the window
				
				var value = (x / viewSize.width) * 100;
				return value;
			}
		});
		
		var swipePanel = this.swipePanel;
		
		this.swipePanel.dd.setYConstraint(0, 0); // limit on X axis
		this.swipePanel.dd.setXConstraint(viewSize.width / 2 - (swipePanelWidth / 2), viewSize.width / 2 + (swipePanelWidth / 2)); // limit X axis on map width
		
		// Redraw while dragging the split
		this.swipePanel.dd.onDrag = function(e) {
			swipePanel.isDragged = true;
			olMap.render();
		};
		
		olMap.render();
	},
	
	/**
	 *	Function createSlider
	 *	Creates a slider swipe
	 */
	createSlider: function() {		
		var map = Ck.getMap();
		var olMap = map.getOlMap();
		var view = map.getView();
		var viewSize = view.getSize();
		var viewPosition = view.getXY();
		var panelSize = viewSize.width * 0.6; // 60% of map view size
		
		// Create the slider
		this.swipeItem = Ext.create("Ck.Swipe", {
			width: panelSize - 100,			
			listeners: {
				change: function(slider, newValue, thumb, eOpts) {
					olMap.render();
				},
				scope: this
			}
		});
		
		// Create a close button
		this.closeSwipeBtn = Ext.create("Ext.Button", {
			cls: "swipeCloseBtn fa fa-remove",
			handler: this.closeSwipe,
			width: 50,
			height: 40,
			scope: this
		});
		
		// Create a panel containing the slider and the button
		this.swipePanel = Ext.create("Ext.Panel", {
			// fullscreen: true,
			id: "swipePanel",
			cls: "swipePanel-slider",
			width: panelSize,
			height: 50,
			renderTo: Ext.getBody(),
			layer: this.layer,
			layerIndex: this.layerIndex,
			precomposeKey: this.precomposeKey,
			ui: this.ui,
			actionColumn: this.actionColumn,
			layout: {
				type: "hbox",
				align: "middle"
			},
			style: {
				position: "absolute",
				top: "20px",
				left: (viewPosition[0] + viewSize.width * 0.2) + "px", // in map mapnel centered
				zIndex: 10000
			},
			items: [this.swipeItem, this.closeSwipeBtn]
		});
		
		this.swipePanel.show();
	},
	
	/**
	 *	Function closeSwipe
	 *	Close the swipe
	 */
	closeSwipe: function() {
		this.layer.setZIndex(this.layerIndex);
		this.layer.unByKey(this.precomposeKey);
		this.layer.unByKey(this.postcomposeKey);
			
		this.swipePanel.hide();
		this.swipePanel.destroy();
	},
	
	/**
	 *	Function precompose
	 *	Event to redraw the layer's canvas
	 */
	precompose: function(event) {
        var ctx = event.context;
        var width = ctx.canvas.width * (this.swipeItem.getValue() / 100);
		
        ctx.save();
        ctx.beginPath();
        ctx.rect(width, 0, ctx.canvas.width - width, ctx.canvas.height);
        ctx.clip();
    }, 
	
	/**
	 *	Function postcompose
	 *	Event to redraw the layer's canvas
	 */
	postcompose: function(event) {
        var ctx = event.context;
        ctx.restore();
	}
	
});