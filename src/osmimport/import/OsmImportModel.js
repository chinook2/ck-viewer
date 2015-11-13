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
		{name: "geometry"}, // Array for ways and relations
		{name: "members", type: "auto"}, // Array for relations
		{name: "role"}, // Used in relations
		{name: "properties"}
	],
	idProperty: 'id',
	
	
	calculateGeom: function(data, convert) {
		var data = data || this.data;
		var convertGeom = true;
		if (convert == false) {
			convertGeom = false;
		}
		var geom = undefined;
	// Create coords with lon/lat format (openlayer use lon/lat while OSM use lat/lon).
		if (data.type === "node") {  // Points
			var point = [data.lon, data.lat];
			geom = new ol.geom.Point(point);
		} else if (data.type === "way") { // MultiLine or Polygon
			var coords = [];
			for (var p = 0; p < data.geometry.length; p++) {
				var point = [data.geometry[p].lon, data.geometry[p].lat];
				coords.push(point);
			}

			if (data.geometry[0].lat === data.geometry[data.geometry.length - 1].lat &&
				data.geometry[0].lon === data.geometry[data.geometry.length - 1].lon) {
				geom = new ol.geom.Polygon([coords]);
			} else {
				geom = new ol.geom.MultiLineString([coords]);
			}
		} else if (data.type === "relation") {  // OSM Relations
			var geoms = [];
			for (var memberId in data.members) {
				var member = data.members[memberId];
				geoms.push(this.calculateGeom(member, false));
			}
			geom = new ol.geom.GeometryCollection(geoms);
		}

		// Transform the OSM projection into Map projection
		if (geom != undefined && convertGeom) {
			geom.transform("EPSG:4326", Ck.getMap().getOlMap().getView().getProjection());
		}
		return geom;
	},
	
	/**
	 * Method to check if the record is a feature or simply a member of the feature.
	 * For example: each node of a polygon is visible in the records.
	 * Check is made by looking for the tags to search in the tags of the record.
	 */
	containsSearchedTags: function(searchedTags) {
		var correct = false;
		var tags = this.data.tags;
		if (tags != undefined) {
			for (var i = 0; i < searchedTags.length; i++) {  // Check for each type of group selected
				var searchedTag = searchedTags[i];
				var key_val = searchedTag.tag.match(/["?\w+:?]+=?["\w*:?]*/g);
				var rec_correct = 0;
				for (var kvId in key_val) {  // Check that each tag is in the selected group
					var kv = key_val[kvId];
					var k = kv.split("=")[0].replace(/"/g, '');
					var v = kv.split("=")[1];
					if (v != undefined) {
						v = v.replace(/"/g, '');
					}
					if (k in tags) {
						if (v !== "" && tags[k] === v) {
							rec_correct++;
						}
					}
				}
				if (key_val != null && rec_correct === key_val.length) {  // If all the tags in the group selected are present in the record, it's ok.
					correct = true;
					break;
				}
			}
		}
		return correct;
	}
});
