/**
 * 
 */
Ext.define('Ck.Action', {
	extend: 'Ext.Action',
	
	disabled: false,
	hidden: false,
	
	itemId: '',
	text: '',
	iconCls: '',
	
	tooltip: '',
	
	_map: null,
	
    constructor: function(config) {
		// this.map = Ck.getMap();
		// this.map.on('loaded', this.ckLayersInit);
		Ext.on('ckmapReady', function(map) {
			this._map = map;
			this.ckInit(map);
		}, this);
		
		Ext.on('ckmapLoaded', function(map) {
			this._map = map;
			this.ckLayersInit(map);
		}, this);
		
		config = Ext.applyIf(config || {}, {
			disabled: this.disabled,
			hidden: this.hidden,
			itemId: this.itemId,
			text: this.text,
			iconCls: this.iconCls,
			handler: this.doAction,
			
			toggleHandler: this.toggleAction,
			
			tooltip: this.tooltip,
			toggleGroup: this.toggleGroup,
			
			scope: this
		});
        this.callParent([config]);
    },
	
	getMap: function() {
		return this._map;
	},
	
	ckInit: Ext.emptyFn,
	ckLayersInit: Ext.emptyFn
});
