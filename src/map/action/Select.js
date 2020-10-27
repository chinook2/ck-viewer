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
	iconCls: 'fa fa-asterisk',
	tooltip: '',
	
	toggleGroup: 'ckmapAction',
	
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
	 * Message to show when the user is measuring.
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
	
	multi: true,
		
	/**
	 * Where display the edit panel
	 */
	target: "window",
	
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
			type		: this.type,
			map			: map,
			callback	: this.processResult,
			scope		: this,
			limit		: null,
			overHighlight	: true
			// drawStyle	: null
		});
	},
	
	/**
	 * 
	 */
	toggleAction: function(btn, pressed) {
		if(!this.select) return;
		this.select.setActive(pressed);
	},
	
	/**
	 * Process the result
	 */
	processResult: function(res) {
		for(var i = 0; i < res.length; i++) {
			Ck.log("The layer \"" + res[i].layer.get("title") + "\" return " + res[i].features.length + " result");
		}
		
		if(res.length == 0) {
			return false;
		}
		
		var resOpt = {
			xtype	: "ckresult",
			result	: res,
			openner	: this
		};
		
		switch(this.target) {
			case "window":
				// Try get existing window result
				// Each Select mode/type have it's own instance of this.win - this.result
				if(Ext.isEmpty(this.win)) {
					// this.win = Ext.ComponentQuery.query('ckresult ^ window').pop();
					var ckresult = Ext.ComponentQuery.query('ckresult').pop();
					if (ckresult) {
						this.win = ckresult.up("window");
						this.result = ckresult.getController();
					}
				}
				if(Ext.isEmpty(this.win)) {
					var ckresult = Ext.create(resOpt);
					this.win = Ext.create(this.classWindow, Ext.apply({
						title: "Result selection",
						width: 950,
						height: 600,
						layout: 'fit',
						collapsible: true,
						closable: false,
						closeAction: 'hide',
						maximizable: true,
						items: [ckresult]
					}), this.targetOpt);
					this.result = ckresult.getController();
				}
				
				this.result.loadData(res);
				this.win.show();
				break;
			case "docked":
				if(Ext.isEmpty(this.result)) {
					this.result = Ext.create(
						Ext.apply({
							dock : "top"
						}, this.targetOpt, resOpt)
					);
					
					var view = map.getView();
					this.win = view.addDocked(this.result);
					this.getMap().getOlMap().updateSize();
					this.result = this.result.getController();
				}
				
				this.result.loadData(res);
				this.win.show();
				break;
		}
		
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
					
					var helpMsg = this.startMsg;
					if (this.sketch && this.type != 'Point') helpMsg = this.continueMsg;
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
		switch(this.target) {
			case "window":
				this.win.hide();
				break;
			case "docked":
				this.win.show();
				break;
		}
	}
});
