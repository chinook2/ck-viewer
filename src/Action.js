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
	
	/**
     * @inheritdoc Ck.Controller
	 */	
	ckReady: Ext.emptyFn,
	
	/**
     * @inheritdoc Ck.Controller
     */
	ckLoaded: Ext.emptyFn,
	
    constructor: function(config) {
		// Use global event to call function when map is ready.
		// ckmap isn't avaible when first pass here...
		Ext.on('ckmapReady', function(map) {
			this._map = map;
			this.ckReady(map);
		}, this);
		
		Ext.on('ckmapLoaded', function(map) {
			this._map = map;
			this.ckLoaded(map);
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
	}
});
