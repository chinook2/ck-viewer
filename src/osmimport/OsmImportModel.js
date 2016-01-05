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
	 * Projection used by OpenStreetMap.
	 */
	OSM_PROJECTION: "EPSG:4326",
	// This constant contains all the tags to be checked to define if a way is a polygon
	TAGS_TO_CHECK_POLYGON: [
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
	 * @param data Data for which the geometry is calculated. Defaults is undefined.
	 * @param allRecords List of all the records as returned by the store after load.
	 **/
	calculateGeom: function(data, allRecords) {
		var data = data || this.data;
		var convertGeom = true;
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
				var nb_inner = Ext.Array.filter(data.members,
					function(member) {
						return member.role == "inner";}).length;
				if (nb_inner > 0) {  // Polygon shall not be used when there is no inner
					var coords = [];
					for (var memberId in data.members) {
						var member = data.members[memberId];
						member.tags = {};
						var polygeom = this.calculateGeom(member, allRecords);
						coords.push(polygeom.getCoordinates(member.role == "inner"));  // Direction is inverted for inners
					}
					geom = new ol.geom.Polygon(coords);
				}
			}
			if (geom == undefined) {  // Not OSM multipolygon with inner(s)
				var geoms = [];
				for (var memberId in data.members) {
					var member = data.members[memberId];
					if (member.type != "relation") {
						// Copy the tags from relation and element in the member without modifying records
						var tags = {};
						for (var key in data.tags) {
							tags[key] = data.tags[key];
						}
						for (var key in member.tags) {
							tags[key] = member.tags[key];
						}
						var element = {type: member.type,
									   tags: tags,
									   geometry: member.geometry,
									   lat: member.lat,
									   lon: member.lon}
						geoms.push(this.calculateGeom(element, allRecords));
					}
				}
				geom = new ol.geom.GeometryCollection(geoms);
			}
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
				for (var t in this.TAGS_TO_CHECK_POLYGON) {
					if (tags[this.TAGS_TO_CHECK_POLYGON[t].key] &&  // Tag is present
						((this.TAGS_TO_CHECK_POLYGON[t].nopoly_val.length == 0 || 
						  this.TAGS_TO_CHECK_POLYGON[t].nopoly_val.indexOf(
							tags[this.TAGS_TO_CHECK_POLYGON[t].key]) == -1) &&  // Value for way is absent
						 (this.TAGS_TO_CHECK_POLYGON[t].poly_val.length == 0 ||
						  this.TAGS_TO_CHECK_POLYGON[t].poly_val.indexOf(
							tags[this.TAGS_TO_CHECK_POLYGON[t].key]) > -1))) {  // values for polygon is present
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
					var key_val = searchedTags[i].tag.match(/["?\w+\u00C0-\u00FF*:?]+!?=?["\w\u00C0-\u00FF:'\-#]*/g);
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
	 * This method converts the record tags into a propertie object according the given configuration.
	 */
	convertTagsToAttributes: function(record, attributesTagsConfig) {
		var attributes = {};
		for (var i in attributesTagsConfig) {
			var attr = attributesTagsConfig[i].attr;
			var tag = attributesTagsConfig[i].tag;
			var tagValue = "";
			
			if (tag.startsWith("rel:")) {
				tag = tag.substr(4);
			} 
			if (tag in record.data.tags) {
				// Copy only if value is correct type
				switch(attributesTagsConfig[i].type) {
					case "integer":
						if (!record.data.tags[tag].match(/\D/)) {
							tagValue = record.data.tags[tag];
						}
					break;
					case "boolean": // Values compatible with server
						if (["yes", "no"].indexOf(record.data.tags[tag]) > -1) {
							tagValue = record.data.tags[tag];
						}
					break;
					case "string": tagValue = record.data.tags[tag];
					break;
					default: break;
				}
			}
			attributes[attr] = tagValue;
		}
		return attributes;
	},
	
	/**
	 * Returns a list of Features of the record if it is compatible with Point geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	copyToPoint: function(records, attributesTagsConfig) {
		var features = [];
		if (this.data.type == "node") {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = this.calculateGeom(undefined, records);
			features.push(new ol.Feature(attr));
		} else if (this.data.type == "relation") {
			for (var memberId in this.data.members) {
				var member = this.data.members[memberId];
				if (member.type == "node") {
					var attr = this.convertTagsToAttributes(this.getSubElement(records, member.ref), attributesTagsConfig);
					attr.geometry = this.calculateGeom(member, records);
					features.push(new ol.Feature(attr));
				}
			}
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record if it is compatible with LineString geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	copyToLineString: function(records, attributesTagsConfig) {
		var features = [];
		if (this.data.type == "way" && !this.isPolygon(this.data)) {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = this.calculateGeom(undefined, records);
			features.push(new ol.Feature(attr));
		} else if (this.data.type == "relation") {
			for (var memberId in this.data.members) {
				var member = this.getSubElement(records, this.data.members[memberId].ref);
				var tags = {};
				for (var key in this.data.tags) {
					tags[key] = this.data.tags[key];
				}
				for (var key in member.data.tags) {
					tags[key] = member.data.tags[key];
				}
				var element = {type: member.data.type,
							   tags: tags,
							   geometry: member.data.geometry,
							   lat: member.data.lat,
							   lon: member.data.lon};
				if (element.type == "way" && !this.isPolygon(element)) {
					var attr = this.convertTagsToAttributes(member, attributesTagsConfig);
					attr.geometry = this.calculateGeom(element, records);
					features.push(new ol.Feature(attr));
				}
			}
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record if it is compatible with Polygon geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	copyToPolygon: function(records, attributesTagsConfig) {
		var features = [];
		if (this.data.type == "way" && this.isPolygon(this.data)) {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = this.calculateGeom(undefined, records);
			features.push(new ol.Feature(attr));
		} else if (this.data.type == "relation") {
			var geom = this.calculateGeom(undefined, records);
			if (geom.getType() == "Polygon") {
				var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
				attr.geometry = geom;
				features.push(new ol.Feature(attr));
			} else {
				for (var memberId in this.data.members) {
					var member = this.getSubElement(records, this.data.members[memberId].ref);
					// Copy the tags from relation and element in the member without modifying records
					var tags = {};
					for (var key in this.data.tags) {
						tags[key] = this.data.tags[key];
					}
					for (var key in member.data.tags) {
						tags[key] = member.data.tags[key];
					}
					var element = {type: member.data.type,
								   tags: tags,
								   geometry: member.data.geometry,
								   lat: member.data.lat,
								   lon: member.data.lon};
					if (element.type == "way" && this.isPolygon(element)) {
						var attr = this.convertTagsToAttributes(member, attributesTagsConfig);
						attr.geometry = this.calculateGeom(element, records);
						features.push(new ol.Feature(attr));
					}
				}
			}
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record if it is compatible with MultiPoint geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	copyToMultiPoint: function(records, attributesTagsConfig) {
		var features = [];
		if (this.data.type == "node") {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = new ol.geom.MultiPoint();
			var point = this.calculateGeom(undefined, records);
			attr.geometry.appendPoint(point);
			features.push(new ol.Feature(attr));
		} else if (this.data.type == "relation") {
			var points = [];
			for (var memberId in this.data.members) {
				var member = this.data.members[memberId];
				if (member.type == "node") {
					points.push(this.calculateGeom(member, records));
				}
			}
			if (points.length > 0) {
				var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
				attr.geometry = new ol.geom.MultiPoint();
				for (var i in points) {
					attr.geometry.appendPoint(points[i]);
				}
				features.push(new ol.Feature(attr));
			}
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record if it is compatible with MultiLineString geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	copyToMultiLineString: function(records, attributesTagsConfig) {
		var features = [];
		if (this.data.type == "way" && !this.isPolygon(this.data)) {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = new ol.geom.MultiLineString();
			var line = this.calculateGeom(undefined, records);
			attr.geometry.appendLineString(line);
			features.push(new ol.Feature(attr));
		} else if (this.data.type == "relation") {
			var lines = [];
			var relGeom = this.calculateGeom(undefined, records);
			if (relGeom.getType() == "GeometryCollection") {
				lines = Ext.Array.filter(relGeom.getGeometries(),
					function(member) {
						return member.getType() == "LineString";
					}
				);
			}
			if (lines.length > 0) {
				var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
				attr.geometry = new ol.geom.MultiLineString();
				for (var i in lines) {
					attr.geometry.appendLineString(lines[i]);
				}
				features.push(new ol.Feature(attr));
			}
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record if it is compatible with MultiPolygon geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	copyToMultiPolygon: function(records, attributesTagsConfig) {
		var features = [];
		if (this.data.type == "way" && this.isPolygon(this.data)) {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = new ol.geom.MultiPolygon();
			var poly = this.calculateGeom(undefined, records);
			attr.geometry.appendPolygon(poly);
			features.push(new ol.Feature(attr));
		} else if (this.data.type == "relation") {
			var polys = [];
			poly = this.calculateGeom(undefined, records);
			if (poly.getType() == "Polygon") {
				polys.push(poly);
			} else {  // If rel is not Polygon it is a GeometryCollection
				polys = Ext.Array.filter(poly.getGeometries(),
					function(geometry) {
						return geometry.getType() == "Polygon";
					}
				);
			}
			if (polys.length > 0) {
				var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
				attr.geometry = new ol.geom.MultiPolygon();
				for (var i in polys) {
					attr.geometry.appendPolygon(polys[i]);
				}
				features.push(new ol.Feature(attr));
			}
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record if it is compatible with undefined geometry.
	 * Each basic element is copied (Point, LineString, Polygon).
	 * Elements from relations are placed in specific Multi.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	copyToUndefined : function(records, attributesTagsConfig) {
		var features = [];
		var elementGeom = this.calculateGeom(undefined, records);
		var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
		if (elementGeom.getType() == "GeometryCollection") {
			var points = [];
			var lines = [];
			var polys = [];
			geom = [];
			var geometries = elementGeom.getGeometries();
			for (var i in geometries) {
				var member = geometries[i];
				if (member.getType() == "Point") {
					points.push(member);
				} else if (member.getType() == "LineString") {
					lines.push(member);
				} else if (member.getType() == "Polygon") {
					polys.push(member);
				}
			}
			if (points.length > 0) {
				attr.geometry = new ol.geom.MultiPoint();
				for (var i in points) {
					attr.geometry.appendPoint(points[i]);
				}
				features.push(new ol.Feature(attr));
			}
			if (lines.length > 0) {
				attr.geometry = new ol.geom.MultiLineString();
				for (var i in lines) {
					attr.geometry.appendLineString(lines[i]);
				}
				features.push(new ol.Feature(attr));
			}
			if (polys.length > 0) {
				attr.geometry = new ol.geom.MultiPolygon();
				for (var i in polys) {
					attr.geometry.appendPolygon(polys[i]);
				}
				features.push(new ol.Feature(attr));
			}
		} else {
			attr.geometry = elementGeom;
			features.push(new ol.Feature(attr));
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record converted in a Point geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	convertToPoint: function(records, attributesTagsConfig) {
		var features = [];
		if (this.data.type != "way" || this.isPolygon(this.data)) {  // Don't copy way not closed
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = this.calculateGeom(undefined, records);
			if (this.data.type != "node") {  // Convert polygons and relations
				attr.geometry = this.getCenterPoint(attr.geometry);
			}
			features.push(new ol.Feature(attr));
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record converted in a LineString geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	convertToLineString: function(records, attributesTagsConfig) {
		var features = [];
		if (this.data.type == "way" && !this.isPolygon(this.data)) {  // Copy only way not closed
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = this.calculateGeom(undefined, records);
			features.push(new ol.Feature(attr));
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record converted in a Polygon geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	convertToPolygon: function(records, attributesTagsConfig) {
		var features = [];
		var geom = this.calculateGeom(undefined, records);  // Get way closed and relation multipolygon with inners
		if (this.data.type == "node") {
			geom = this.getSquareFromPoint(geom);
		} else if ((this.data.type == "relation") && (geom.getType() != "Polygon")) {
			geom = ol.geom.Polygon.fromExtent(geom.getExtent()); 
		} else if (this.data.type == "way" && !this.isPolygon(this.data)) {
			geom = undefined;
		}
		if (geom) {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = geom;
			features.push(new ol.Feature(attr));
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record converted in a MultiPoint geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	convertToMultiPoint: function(records, attributesTagsConfig) {
		var features = [];
		var geom = undefined;
		if (this.data.type == "node") {
			geom = new ol.geom.MultiPoint();
			var point = this.calculateGeom(undefined, records);
			geom.appendPoint(point);
		} else if (this.data.type == "way" && this.isPolygon(this.data)) {
			geom = new ol.geom.MultiPoint();
			var poly = this.calculateGeom(undefined, records);
			var point = this.getCenterPoint(poly);
			geom.appendPoint(point);
		} else if (this.data.type == "relation") {
			var points = [];
			var relGeom = this.calculateGeom(undefined, records);
			if (relGeom.getType() == "Polygon") {
				var point = this.getCenterPoint(relGeom);
				points.push(point);
			} else {
				var geometries = relGeom.getGeometries();
				for (var i in geometries) {
					var member = geometries[i];
					if (member.getType() == "Point") {
						points.push(member);
					} else if (member.getType() == "Polygon") {
						var point = this.getCenterPoint(member);
						points.push(point);
					}
				}
			}
			if (points.length > 0) {
				geom = new ol.geom.MultiPoint();
				for (var i in points) {
					geom.appendPoint(points[i]);
				}
			}
		}
		if (geom) {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = geom;
			features.push(new ol.Feature(attr));
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record converted in a MultiLineString geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	convertToMultiLineString: function(records, attributesTagsConfig) {
		var features = [];
		var geom = undefined;
		if (this.data.type == "way" && !this.isPolygon(this.data)) {  // Copy only way not closed
			var lineString = this.calculateGeom(undefined, records);
			geom = new ol.geom.MultiLineString();
			geom.appendLineString(lineString);
		} else if (this.data.type == "relation") {
			var lines = [];
			var relGeom = this.calculateGeom(undefined, records);
			if (relGeom.getType() == "GeometryCollection") {
				lines = Ext.Array.filter(relGeom.getGeometries(),
					function(member) {
						return member.getType() == "LineString";
					}
				);
			}
			if (lines.length > 0) {
				geom = new ol.geom.MultiLineString();
				for (var i in lines) {
					geom.appendLineString(lines[i]);
				}
			}
		}
		if (geom) {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = geom;
			features.push(new ol.Feature(attr));
		}
		return features;
	},
	
	/**
	 * Returns a list of Features of the record converted in a MultiPolygon geometry.
	 * If not compatible, empty list is returned.
	 * Tag conversion into feature properties is realized if a configuration is given.
	 */
	convertToMultiPolygon: function(records, attributesTagsConfig) {
		var features = [];
		var geom = undefined;
		if (this.data.type == "node") {
			geom = new ol.geom.MultiPolygon();
			var point = this.calculateGeom(undefined, records);
			var poly = this.getSquareFromPoint(point);
			geom.appendPolygon(poly);
		} else if (this.data.type == "relation") {
			var polys = [];
			var relGeom = this.calculateGeom(undefined, records);
			if (relGeom.getType() == "Polygon") {
				polys.push(relGeom);
			} else {
				var geometries = relGeom.getGeometries();
				for (var i in geometries) {
					var member = geometries[i];
					if (member.getType() == "Point") {
						var poly = this.getSquareFromPoint(member);
						polys.push(poly);
					} else if (member.getType() == "Polygon") {
						polys.push(member);
					}
				}
			}
			if (polys.length > 0) {
				geom = new ol.geom.MultiPolygon();
				for (var i in polys) {
					geom.appendPolygon(polys[i]);
				}
			}
		} else if (this.data.type == "way" && this.isPolygon(this.data)) {
			geom = new ol.geom.MultiPolygon();
			var poly = this.calculateGeom(undefined, records);
			geom.appendPolygon(poly);
		}
		if (geom) {
			var attr = this.convertTagsToAttributes(this, attributesTagsConfig);
			attr.geometry = geom;
			features.push(new ol.Feature(attr));
		}
		return features;
	},
	
	/**
	 * Return a new Point positionned on the center of the bounding box of a geometry.
	 */
	getCenterPoint: function(geom) {
		var extent = geom.getExtent();
		return new ol.geom.Point([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
	},
	
	/**
	 * Create a square from a Point.
	 * @param sideWidth Width to set to the square. 10 Meters by default.
	 * Point is supposed to be in OSM projection.
	 * Square is generated in OSM projection.
	 */
	getSquareFromPoint: function(point, sideWidth) {
		var sideWidth = Ext.isNumber(sideWidth) ? sideWidth : 10;
		point.transform(this.OSM_PROJECTION, "EPSG:3857");  // Goes in a projection which use meters.
		point = new ol.geom.Circle(point.getCoordinates(), sideWidth);  // Create a circle with given point as center.
		var poly = ol.geom.Polygon.fromExtent(point.getExtent());  // Create square inside the circle. starts with 45° angle (0.78 rad)
		poly.transform("EPSG:3857", this.OSM_PROJECTION);
		return poly;
	}
});
