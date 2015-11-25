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
	validators: [
		{type: "presence", field: "fillcolor"},
		{type: "format", field: "fillcolor", matcher: /^rgba\([0-9]+,\s?[0-9]+,\s?[0-9]+,\s?[0-9\.]+\)$/},
		{type: "presence", field: "strokecolor"},
		{type: "format", field: "strokecolor", matcher: /^#[0-9A-Fa-f]{6}$/}
	]
});
