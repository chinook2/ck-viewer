Ext.define('FeatureInfoResult', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'featureid', type: 'int'},
		{name: 'field', type: 'string'},
		{name: 'value', type: 'string'}
	]
});