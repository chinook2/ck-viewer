/**
 * ViewModel to do Data binding for OSM Integration Panel
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.integration.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckosmimportintegration',

	requires: [
	],
	data: {
		layersList: [],
		layersAttributes: [{attr: "Nom"},
						   {attr: "Numéro de voirie"},
						   {attr: "Libelle de Voie", tag: "addr:street"},
						   {attr: "Libelle Commune"},
						   {attr: "Type"},
						   {attr: "sous-type"}],
		tagsOsm: [{tag:"name"},
				  {tag:"addr:housenumber"},
				  {tag:"amenity"},
				  {tag:"output:generator:electricity"},
				  {tag:"route"},
				  {tag:"highway"},
				  {tag:"school:FR"},
				  {tag:"type"},
				  {tag:"operator:type"},
				  {tag:"ref:UAI"},
				  {tag:"ref:FR:LaPoste"}]
	}
});