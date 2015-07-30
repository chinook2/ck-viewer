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
	
    constructor: function(config) {
		config = Ext.applyIf(config || {}, {
			disabled: this.disabled,
			hidden: this.hidden,
			itemId: this.itemId,
			text: this.text,
			iconCls: this.iconCls,
			handler: this.doAction,
			
			tooltip: this.tooltip,
			
			scope: this
		});
        this.callParent([config]);
    }
});
