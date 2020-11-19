/**
 * Base class for select actions.
 *
 * The ol.interaction.Select is not used because ol does not support exotic selection (circle, polygon...).
 * However an ol.interaction.Select is created to manage selected features properly.
 * So selections are made manually.
 * 
 * See : Ck.map.action.select.Point, Ck.map.action.select.Square ...
 */
Ext.define('Ck.map.action.Select', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapSelect',
	
	itemId: 'select',
	text: '',
	iconCls: 'ckfont ck-selects',
	tooltip: '',
	
 	toggleGroup: 'ckmapAction',
 	
	config: {
		/**
		 * Currently drawn feature.
		 * @type {ol.Feature}
		 */
		sketch: null,
 
		/**
		 * Message to show when the user start selection.
		 */
		startMsg : 'Click to select feature.<br>Shift+Click to add feature to selection.',
		
		/**
		 * Message to show when the user is selecting.
		 */
		continueMsg: 'Drag to select features',
		
		/**
		 * The type of the selection :
		 *
		 *    - point
		 *    - circle
		 *    - box
		 *    - ...
		 */
		type: 'point',
		
		/**
		 * Button associate with this action
		 */
		btn: null,
 		
		/**
		 * ID of the result panel
		 */
		resultPanelId: "select-result",
		
		/**
		 * ID of result panel container
		 */
		resultPanelContainerId: "select-result-container",
		
		/**
		 * Option to pass to the container
		 */
		containerOpt: {}
	},
	
 	/**
	 * Result panel
 	 */
	result: null,
 	
 	/**
	 * Result panel result
 	 */
	container: null,
 	
 	/**
 	 * Select on vector layer :
	 *
	 *    - select by geometry (circle, box, polygon)
	 *
	 * Select on WMS layer (via WFS call) :
	 *
	 *    - draw selection as vector
	 *    - draw selection by WMS call of a dynamic layer using WFS filter (for large selection !)
	 * @params {Ck.map}
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		
		this.select = new Ck.Selection({
			type		: this.getType(),
			map			: map,
			callback	: this.processResult,
			scope		: this,
			limit		: null,
			overHighlight	: true
			// drawStyle	: null
		});
		
		map.on("contextloading", function() {
			if(this.getBtn()) {
				this.getBtn().toggle(false);
			}
		}, this);
	},
	
	/**
	 * 
	 */
	toggleAction: function(btn, pressed) {
		this.setBtn(btn);
		if(!this.select) return;
		this.select.setActive(pressed);
	},
	
	/**
	 * Process the result
	 */
	processResult: function(res) {
		
 		// this.colorresult(res);
		
 		if(res.length == 0) {
 			return false;
 		}
 		
		// Get the result panel from its ID. Maybe created by another component
		if(Ext.isEmpty(this.result)) {
			var result = Ext.getCmp(this.getResultPanelId());
			if(Ext.isEmpty(result)) {
				this.result = Ext.create({
					xtype	: "ckresult",
					id		: this.getResultPanelId(),
					result	: res,
					openner	: this
				});
			} else {
				this.result = result;
			}
		}
		
		if(Ext.isEmpty(this.container)) {
			var container = Ext.getCmp(this.getResultPanelContainerId());
			
			if(Ext.isEmpty(container)) {
				this.container = Ext.create('Ext.window.Window', Ext.apply({
					title		: "Result selection",
					id			: this.getResultPanelContainerId(),
					width		: 800,
					height		: 620,
					layout		: 'fit',
					collapsible	: true,
					closable	: false,
					maximizable	: true,
					items		: [this.result]
				}), this.getContainerOpt());
			} else {
				this.container = container;
			}
			
 		}
 		
		this.result.getController().loadData(res);
		this.container.show();
 	},
 	
 	/**
	 * Creates a new help tooltip
	 */
	createHelpTooltip: function() {
		Ext.create('Ext.tip.ToolTip', {
			target: this.olMap.getViewport(),
			trackMouse: true,
			dismissDelay: 0,
			renderTo: Ext.getBody(),
			onDocMouseDown: function() {
				// prevent hide tooltip on click
				Ext.defer(function(){
					this.fireEvent('beforeshow', this);
				}, 200, this);
			}, 
			listeners: {
				beforeshow: function(tip) {
					if(!this.draw.get('active')) return false;
					
					var helpMsg = this.getStartMsg();
					if (this.getSketch() && this.getType() != 'Point') helpMsg = this.getContinueMsg();
					tip.update(helpMsg);
				},
				scope: this
			}
		});
	},
	
	resetSelection: function() {
		this.select.resetSelection();
	},
	
	/**
	 *
	 */
	close: function() {
		this.container.hide();
		Ck.resultFeature = [];
		Ck.resultLayer = [];
	},
	
	render: function(c){
		Ext.create('Ext.tip.ToolTip', {
			target: c.getEl(),
			html: this.tooltip,
			anchor:"left",
			animCollapse:false
		},this);
	}
	
});
