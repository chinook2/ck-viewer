/**
 * Model for the data read from the OSM API.
 * Contains:
 * - params returned by the API
 * - additionnal params used to simplify the display of data.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.OsmImportModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: "type", type: "string"},
		{name: "id", type: "int"},
		{name: "lat", type: "number"},
		{name: "lon", type: "number"},
		{name: "tags"},
		{name: "nodes", reference: "OsmImportModel"},
		{name: "geometry"},
		{name: "coords", calculate: function(data) {
			var geom = undefined;
			// Create coords with points in lon/lat format (openlayer use lon/lat while OSM use lat/lon).
			if (data.type === "node") {
				var point = [data.lon, data.lat];
				geom = new ol.geom.Point(point);
			} else if (data.type === "way") {
				var coords = [];
				for (var p = 0; p < data.geometry.length; p++) {
					var point = [data.geometry[p].lon, data.geometry[p].lat];
					coords.push(point);
				}
				if (data.geometry[0] === data.geometry[data.geometry.length - 1]) {
					geom = new ol.geom.Polygon([coords]);
				} else {
					geom = new ol.geom.MultiLineString([coords]);
				}
			} else if (data.type === "relation") {
				// TODO
				// use members
				// voire récursivité?
			}
			// Transform the OSM projection into Map projection
			if (geom != undefined) {
				geom.transform("EPSG:4326", Ck.getMap().getOlMap().getView().getProjection());
			}
			return geom;
		}
		},
		{name: "properties"}
	],
	idProperty: 'id',
	
	/**
	 * Method to verify if the record is a feature or simply a member of the feature.
	 * For example: each node of a polygon is visible in the records.
	 */
	containsSearchedTags: function(searchedTags) {
		var correct = false;
		var tags = this.data.tags;
		searchedTags.forEach(function(searchedTag) {
			if (tags != undefined) {
				for (var key in tags) {
					var tag = key;
					if (tag.indexOf(":") > -1) {
						tag = '"' + tag + '"';
					}
					var value = tags[key];
					if (value.indexOf(":") > -1) {
						value = '"' + value + '"';
					}
					var tagToSearch = '['+tag+'='+value+']';
					if (searchedTag.tag.indexOf(tagToSearch) > -1) {
						correct = true;
					}
				}
			}
		});
		return correct;
	}
});
