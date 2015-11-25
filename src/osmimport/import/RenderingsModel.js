/**
 * Model for the renderings of OSM Imported Data.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.RenderingsModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: "name", type: "string"},
		{name: "fillcolor", type: "string"},
		{name: "strokecolor", type: "string"}
	],
	validators: {
		fillcolor: [
			{type: "presence"},
			{type: "format", matcher: /^rgba\([0-9]+,\s?[0-9]+,\s?[0-9]+,\s?[0-9\.]+\)$/}
		],
		strokecolor: [
			{type: "presence"},
			{type: "format", matcher: /^#[0-9A-Fa-f]{6}$/}
		]
	}
});
