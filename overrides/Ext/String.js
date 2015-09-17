/**
 *
 */
Ext.define('Ext.overrides.String', {
	override: 'Ext.String',
		
	stripExtension: function(str) {
		return str.substr(0, str.lastIndexOf("."));
	}
});