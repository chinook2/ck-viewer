/**
 *
 */
Ext.define('Ext.overrides.Component', {
	override: 'Ext.Component',
		
	constructor: function(config) {
		config = config || {};
		if(config.action) {
			var action = key = config.action;
			if(config.itemId) key += config.itemId;
			if( Ck.actions[key] ) {
				config = Ck.actions[key];
			} else {
				config = Ext.create('widget.'+action, config);
				Ck.actions[key] = config;
			}
		}
		
		this.callParent([config]);
	}
});