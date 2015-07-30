/**
 *
 */
Ext.define('Ext.overrides.Component', {
	override: 'Ext.Component',
		
	constructor: function(config) {
		config = config || {};
		if(config.action) {
			var act = config.action;
			if( Ck.actions[act] ) {
				config = Ck.actions[act];
			} else {
				config = Ext.create('widget.'+act, config);
				Ck.actions[act] = config;
			}
		}
		
		this.callParent([config]);
	}
});