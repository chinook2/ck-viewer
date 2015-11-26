/**
 * Model for the data read from the OSM API.
 * Contains:
 * - params returned by the API
 * - additionnal params used to simplify the display of data.
 * - method to convert data for display and integration
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.OsmImportModel', {
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
		{name: "role"}, // Used in relations,
		{name: "isSearchedTag", type: "boolean", defaultValue: false},
		{name: "properties"}
	],
	idProperty: 'id',

	/**
	 * Method used to create the geometry of a data according its OSM type.
	 * Geometry is transformed in the new projection.
	 **/
	calculateGeom: function(newProjection, data, convert) {
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
		} else if (data.type === "way") {  // Line or Polygon
			var coords = [];
			for (var p = 0; p < data.geometry.length; p++) {
				var point = [data.geometry[p].lon, data.geometry[p].lat];
				coords.push(point);
			}
			if (this.isPolygon()) {
				geom = new ol.geom.Polygon([coords]);
			} else {
				geom = new ol.geom.LineString(coords);
			}
		} else if (data.type === "relation") {  // OSM Relations
			if (data.tags.type == "multipolygon") { // handle OSM multipolygon with inners in a Polygon
				var nb_outer = 0;
				var nb_inner = 0;
				for (var memberId in data.members) {
					var member = data.members[memberId];
					if (member.role == "inner") nb_inner++;
					if (member.role == "outer") nb_outer++;
				}
				if (nb_outer == 1 && nb_inner > 0) {
					var coords = [];
					for (var memberId in data.members) {
						var member = data.members[memberId];
						if (member.role == "outer") {
							var polygeom = this.calculateGeom(null, member, false);
							coords.push(polygeom.getCoordinates(false));
						} else if (member.role == "inner") {
							var polygeom = this.calculateGeom(null, member, false);
							coords.push(polygeom.getCoordinates(true));
						}
					}
					geom = new ol.geom.Polygon(coords);
				}
			}
			if (geom == undefined) {  // Not OSM multipolygon with inner(s)
				var geoms = [];
				for (var memberId in data.members) {
					var member = data.members[memberId];
					geoms.push(this.calculateGeom(null, member, false));
				}
				geom = new ol.geom.GeometryCollection(geoms);
			}
		}

		// Transform the OSM projection into Map projection
		if (geom != undefined && convertGeom) {
			geom.transform("EPSG:4326", newProjection);
		}
		return geom;
	},

	/**
	 * This method determines if the feature is a polygon or not.
	 * A polygon is detected from several elements of the data:
	 * type is a way
	 * way form a closed loop
	 * no tag area=no
	 * value of other tags
	 * see https://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features for more informations
	 * 
	 */
	isPolygon: function() {
		var polygon = false;
		if (this.data.type === "way") {
			var geom = this.data.geometry;
			if (geom[0].lat === geom[geom.length - 1].lat &&
				geom[0].lon === geom[geom.length - 1].lon) { // Closed way
				var tags = this.data.tags;
				/* Check specific values for tags
				 * Key: the name of the tag
				 * poly_val: values which indicates that the element IS a polygon
				 * nopoly_val: values which indicates that the element IS NOT a polygon
				 */
				var tagsToCheck = [
					{key: "area", poly_val: [], nopoly_val: ["no"]},
					{key: "building", poly_val: [], nopoly_val: ["no"]},
					{key: "highway", poly_val: ["services", "rest_area", "escape"], nopoly_val: ["no"]},
					{key: "natural", poly_val: [], nopoly_val: ["no", "coastline", "cliff", "ridge", "arete", "tree_row"]},
					{key: "landuse", poly_val: [], nopoly_val: ["no"]},
					{key: "waterway", poly_val: ["riverbank", "dock", "boatyard", "dam"], nopoly_val: ["no"]},
					{key: "amenity", poly_val: [], nopoly_val: ["no"]},
					{key: "leisure", poly_val: [], nopoly_val: ["no"]},
					{key: "barrier", poly_val: ["city_wall", "ditch", "hedge", "retaining_wall", "wall", "spikes"], nopoly_val:["no"]},
					{key: "railway", poly_val: ["station", "turntable", "roundhouse", "platform"], nopoly_val: ["no"]},
					{key: "boundary", poly_val: [], nopoly_val: ["no"]},
					{key: "man_made", poly_val: [], nopoly_val: ["no", "cutline", "embankment", "pipeline"]},
					{key: "power", poly_val: ["plant", "substation", "generator", "tranformer"], nopoly_val: ["no"]},
					{key: "place", poly_val: [], nopoly_val: ["no"]},
					{key: "shop", poly_val: [], nopoly_val: ["no"]},
					{key: "aeroway", poly_val: [], nopoly_val: ["no", "taxiway"]},
					{key: "tourism", poly_val: [], nopoly_val: ["no"]},
					{key: "historic", poly_val: [], nopoly_val: ["no"]},
					{key: "public_transport", poly_val: [], nopoly_val: ["no"]},
					{key: "office", poly_val: [], nopoly_val: ["no"]},
					{key: "building:part", poly_val: [], nopoly_val: ["no"]},
					{key: "ruins", poly_val: [], nopoly_val: ["no"]},
					{key: "area:highway", poly_val: [], nopoly_val: ["no"]},
					{key: "craft", poly_val: [], nopoly_val: ["no"]},
					{key: "golf", poly_val: [], nopoly_val: ["no"]}
				];
				for (var t in tagsToCheck) {
					if (tags[tagsToCheck[t].key] &&  // Tag is present
						((tagsToCheck[t].nopoly_val.length == 0 || tagsToCheck[t].nopoly_val.indexOf(tags[tagsToCheck[t].key]) == -1) &&  // Value for way is absent
						 (tagsToCheck[t].poly_val.length == 0 || tagsToCheck[t].poly_val.indexOf(tags[tagsToCheck[t].key]) > -1))) {  // values for polygon is present
							polygon = true;
							break;
					}
				}
			}
		}
		return polygon;
	},
	
	/**
	 * Method to check if the record is a feature or simply a member of the feature.
	 * For example: each node of a polygon is visible in the records.
	 * Check is made by looking for the tags to search in the tags of the record.
	 */
	containsSearchedTags: function(searchedTags) {
		var correct = this.data.isSearchedTag;
		var tags = this.data.tags;
		if (searchedTags != undefined) {
			if (tags != undefined) {
				for (var i = 0; i < searchedTags.length; i++) {  // Check for each type of group selected
					var key_val = searchedTags[i].tag.match(/["?\w+\u00C0-\u00FF*:?]+=?["\w*\u00C0-\u00FF*:?]*/g);
					var rec_correct = 0;
					for (var kvId in key_val) {  // Check that each tag is in the selected group
						var kv = key_val[kvId];
						var k = kv.split("=")[0].replace(/"/g, '');
						var v = kv.split("=")[1];
						if (v != undefined) {
							v = v.replace(/"/g, '');
						}
						if (k in tags) {
							if ((v !== "" && tags[k] === v) || !v) {
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
			this.data.isSearchedTag = correct;  // Modify the flag. Permits to share a status between import and integration
		}
		return correct;
	},
	
	/**
	 * Method indicates if the record is the same geometry type as the geometry type of a layer.
	 */
	isGeometryType: function(type) {
		var result = false;
		switch(type) {
			case "undefined": result = true;
			break;
			case "Point": 
				if (this.data.type === "node") {
					result = true;
				}
			break;
			case "LineString":
				if (this.data.type === "way" &&
					!(this.data.geometry[0].lat === this.data.geometry[this.data.geometry.length - 1].lat &&
					  this.data.geometry[0].lon === this.data.geometry[this.data.geometry.length - 1].lon)) {
					result = true;
				}
			break;
			case "Polygon":
				if (this.data.type === "way" &&
					(this.data.geometry[0].lat === this.data.geometry[this.data.geometry.length - 1].lat &&
					 this.data.geometry[0].lon === this.data.geometry[this.data.geometry.length - 1].lon)) {
					result = true;
				}
			break;
			case "MultiPoint":
			break;
			case "MultiLineString":
			break;
			case "MultiPolygon": 
			break;
		}
		return result;
	}
});
