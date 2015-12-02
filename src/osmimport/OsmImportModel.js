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
		{name: "nodes", reference: "OsmImportModel"},
		{name: "geometry"}, // Array for ways and relations
		{name: "members"}, // Array for relations
		{name: "tags", type: "auto", defaultValue: {}},
		{name: "ref", type: "int"}, // Used in relations,
		{name: "role", type: "string"}, // Used in relations,
		{name: "isSearchedTag", type: "boolean", defaultValue: false}
	],

	/**
	 * This method search and return the element given by its id in the records.
	 * @param records All the records as returned by the store after load.
	 * @param id Id of the Sub-Element to get.
	 */
	getSubElement: function(records, id) {
		return Ext.Array.findBy(records,
			function(record) {
				return record.data.id == id;
			});
	},
	
	/**
	 * Method used to create the geometry of a data according its OSM type.
	 * Geometry is transformed in the new projection.
	 * @param newProjection Projection to be used for displaying or saving the data.
	 * @param data Data for which the geometry is calculated. Defaults is undefined.
	 * @param convert Indicates if the projection shall be converted or not. Default is true.
	 * @param allRecords List of all the records as returned by the store after load.
	 **/
	calculateGeom: function(newProjection, data, convert, allRecords) {
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
			var coords = Ext.Array.map(data.geometry,
				function(geometry) {
					return [geometry.lon, geometry.lat]
				});
			if (this.isPolygon(data)) {
				geom = new ol.geom.Polygon([coords]);
			} else {
				geom = new ol.geom.LineString(coords);
			}
		} else if (data.type === "relation") {  // OSM Relations
			if (data.tags.type == "multipolygon") { // handle OSM multipolygon with inners in a Polygon
				var nb_outer = Ext.Array.filter(data.members,
					function(member) {return member.role == "outer";}).length;
				var nb_inner = Ext.Array.filter(data.members,
					function(member) {
						return member.role == "inner";}).length;
				if (nb_outer == 1 && nb_inner > 0) {  // Polygon shall not be used when there is no inner
					var coords = [];
					for (var memberId in data.members) {
						var member = data.members[memberId];
						member.tags = {};
						var polygeom = this.calculateGeom(null, member, false, allRecords);
						coords.push(polygeom.getCoordinates(member.role == "inner"));
					}
					geom = new ol.geom.Polygon(coords);
				}
			}
			if (geom == undefined) {  // Not OSM multipolygon with inner(s)
				var geoms = [];
				for (var memberId in data.members) {
					var member = data.members[memberId];
					if (member.type != "relation") {
						// Copy the tags from relation and element in the member
						var subElement = this.getSubElement(allRecords, member.ref);  // member has no copy of tags, need to retrieve it from records list
						member.tags = data.tags || {};
						Ext.apply(subElement.data.tags, member.tags);
						geoms.push(this.calculateGeom(null, subElement.data, false, allRecords));
					}
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
	 * @param data Data to be checked.
	 * 
	 */
	isPolygon: function(data) {
		var polygon = false;
		if (data.type === "way") {
			var geom = data.geometry;
			if (geom[0].lat === geom[geom.length - 1].lat &&
				geom[0].lon === geom[geom.length - 1].lon) { // Closed way
				var tags = data.tags;
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
						 (tagsToCheck[t].poly_val.length == 0   || tagsToCheck[t].poly_val.indexOf(tags[tagsToCheck[t].key]) > -1))) {  // values for polygon is present
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
					var key_val = searchedTags[i].tag.match(/["?\w+\u00C0-\u00FF*:?]+!?=?["\w*\u00C0-\u00FF*:?]*/g);
					var rec_correct = 0;
					for (var kvId in key_val) {  // Check that each tag is in the selected group
						var kv = key_val[kvId];
						var different = kv.match(/!=/);
						var k = kv.split("=")[0].replace(/"/g, '').replace(/!/g, '');
						var v = kv.split("=")[1];
						if (v) {
							v = v.replace(/"/g, '');
						}
						if (different) {
							if (!(k in tags) || ((k in tags) && (tags[k] != v))) {
								rec_correct++
							}
						} else {
							if ((k in tags) && ((v !== "" && tags[k] === v) || !v)) {
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
				result = (this.data.type === "node");
			break;
			case "LineString":
				result = (this.data.type === "way" && !this.isPolygon(this.data));
			break;
			case "Polygon":
				result = (this.data.type === "way" && this.isPolygon(this.data));
			break;
			case "MultiPoint":
			break;
			case "MultiLineString":
			break;
			case "MultiPolygon": 
			break;
		}
		return result;
	},
	
	/**
	 * Method to convert a record in a Point geometry.
	 */
	convertToPoint: function(records) {
		var geom = undefined;
		geom = this.calculateGeom(undefined, undefined, false, records);
		if ((this.data.type == "way" && !geom.getType().match(/LineString$/)) ||
			(this.data.type == "relation")) {  // Convert polygons and relations
			var extent = geom.getExtent();
			geom = new ol.geom.Point([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
		}
		return geom;
	}
});
