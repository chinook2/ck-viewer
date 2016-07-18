/** 
 * JS2Shapefile - A javascript class for generating ESRI shapefiles in the client from a variety of javascript map
 * API vector formats (ESRI Graphic, Google Maps, Openlayers (TODO)). Uses HTML5 binary data techniques where
 * available or emulations elsewhere.
 * 
 * By Harry Gibson, CEH Wallingford
 * (c) 2012
 * ceh.ac.uk@harr1 / gmail.com@harry.s.gibson / reversed
 * GNU / GPL v3
 * 
 * Intended as early proof of concept only! It works well for the tasks I need it for...
 * 
 * Intended uses all of which I have tested include:
 * - Export existing features from ArcGIS server services without the need to set up geoprocessing tasks for 
 * 	 "clip-and-ship", or any other server-side stuff
 * - Export graphics created as part of the user interaction in an ESRI javascript web app. E.g. a line returned
 *   from a network analyst routing task, giving a route / drivetime polygon / whatever as a saved shapefile
 * - Export graphics created by the user through "drawing" on the map, whether in ESRI or google maps. E.g. could
 *   be used to set up a basic feature digitisation web app based on google maps.
 * 
 * Requires and uses the jDataView_write implementation of DataView to enable use in browsers where DataView and / or Arraybuffer
 * aren't available. 
 * Requires and uses BlobBuilder polyfill class to ensure that Blobs created are suitable for use in the saving
 * method that is available (see BinaryHelper).
 * Both of these classes must be loaded before the getShapefile function is called. Do this by adding the
 * FileSaveTools script to your document as well as this file. That will load the required helpers.
 * 
 * Usage: 
 * var shapemaker = new Shapefile();
 * shapemaker.addESRIGraphics(ArrayOfEsriGraphics);
 *  // graphics can be a mix of points, lines, polygons. E.g. use the graphics of an ESRI Graphics Layer
 *  // each shapefile will include a unioned set of the graphics' attributes (hopefully)
 * 
 * shapemaker.addGoogleGraphics(ArrayOfGoogleGraphics);
 * // graphics are an array of google maps Markers, Polylines, and Polygons. No attribute handling implemented
 * 
 * shapemaker.addOLGraphics(ArrayOfOpenlayersGraphics); // not implemented yet
 * 
 * var pointfile = shapemaker.getShapefile("POINT");  // output shapefile will use point graphics only 
 * var linefile = shapemaker.getShapefile("POLYLINE");// output shapefile will use the polyline graphics only 
 * var polygonfile = shapemaker.getShapefile("POLYGON");
 * 
 *  // the returned objects have structure e.g.
 *  pointfile = {
 *  	successful : true | false,
 *  	shapefile: {
 *  		shp:	BlobBuilder,
 *  		shx:	BlobBuilder,
 *  		dbf:	BlobBuilder
 *  	}
 *  }
 *  The blobs can be saved to disk using BinaryHelper
 * 
 * IMPORTANT: NO AWARENESS OF PROJECTION / CRS IS IMPLEMENTED!
 * Output shapefile will contain coordinates in the form they were stored
 * in the input graphics. (The CRS of the ESRI map, or WGS84 lat/lon for google graphics). This could easily be
 * improved using proj4js or similar to build a library for reprojecting shapefiles in the browser
 */
var Shapefile = (function(){
	// some compatibility bits
	//pad strings on the left
	if (!"".lpad) {
		String.prototype.lpad = function(padString, length){
			var str = this;
			while (str.length < length) 
				str = padString + str;
			return str;
		}
	}
 	//pad strings on the right
	if (!"".rpad) {
		String.prototype.rpad = function(padString, length){
			var str = this;
			while (str.length < length) 
				str = str + padString;
			return str;
		}
	}
	// array indexof method for IE
	if(!Array.indexOf){
	    Array.prototype.indexOf = function(obj){
	        for(var i=0; i<this.length; i++){
	            if(this[i]==obj){
	                return i;
	            }
	        }
	        return -1;
	    }
	}
	// the main constructor function to be returned
	var ShapeMaker = function(){
		this._pointgraphics = [];
		this._polylinegraphics = [];
		this._polygongraphics = [];
	};
	// define everything else as private variables on the prototype function of ShapeMaker. 
	// Then set return of prototype function to be an object containing
	// only the "public" functions, bound within a function to give them correct scope. 
	ShapeMaker.prototype = (function(){
	
	var ShapeTypes = {
		"POINT":1,
		"POLYLINE":3,
		"POLYGON":5
	}
// DECLARE FUNCTIONS THAT WILL BE EXPOSED THROUGH PROTOTYPE 
	// Load ESRI JSAPI graphics, takes an arbitrary array of them (e.g. map.graphicslayer.graphics) 
	// and places them in the right arrays
	var addESRIGraphics = function(esrigraphics){
		for (var i = 0; i < esrigraphics.length; i++) {
			var thisgraphic = esrigraphics[i];
			if (thisgraphic.geometry) {
				if (thisgraphic.geometry.type === "point") {
					this._pointgraphics.push(thisgraphic);
				}
				else 
					if (thisgraphic.geometry.type === "polyline") {
						this._polylinegraphics.push(thisgraphic);
					}
					else 
						if (thisgraphic.geometry.type === "polygon") {
							this._polygongraphics.push(thisgraphic);
						}
			}
		}
	}

	// "translate" the openlayers graphics item to something compatible with the esri format before adding
	var addOLGraphics = function (openlayersgraphics) {
		for (var i = 0; i < openlayersgraphics.length; i++) {
			var feature = openlayersgraphics[i];
			var quasiEsriGraphic = {
				attributes: feature.attributes,
				geometry: {}
			};
			if (feature.geometry.CLASS_NAME === "OpenLayers.Geometry.Point") {
				quasiEsriGraphic.geometry.type = "POINT";
				quasiEsriGraphic.geometry.x = feature.geometry.x;
				quasiEsriGraphic.geometry.y = feature.geometry.y;
				this._pointgraphics.push(quasiEsriGraphic);
			} else if (feature.geometry.CLASS_NAME === "OpenLayers.Geometry.LineString") {
				quasiEsriGraphic.geometry.type = "POLYLINE";
				quasiEsriGraphic.geometry.paths = [];
				var path = [];
				for (var j = 0; j < feature.geometry.components.length; j++) {
					var point = feature.geometry.components[j];
					path.push([point.x, point.y]);
				}
				quasiEsriGraphic.geometry.paths.push(path);
				this._polylinegraphics.push(quasiEsriGraphic);
			} else if (feature.geometry.CLASS_NAME === "OpenLayers.Geometry.Polygon") {
				quasiEsriGraphic.geometry.type = "POLYGON";
				var rings = [];
				for (var j = 0; j < feature.geometry.components.length; j++) {
					var ring = [];
					var contour = feature.geometry.components[j];
					for (var k = 0; k < contour.components.length; k++) {
						var point = contour.components[k];
						ring.push([point.x, point.y]);
					}
					rings.push(ring);
				}
				quasiEsriGraphic.geometry.rings = rings;
				this._polygongraphics.push(quasiEsriGraphic);
			}
		}
	};
	// "translate" the openlayers 3 graphics item to something compatible with the esri format before adding
	var addOL3Graphics = function (openlayersgraphics) {
		for (var i = 0; i < openlayersgraphics.length; i++) {
			var feature = openlayersgraphics[i];
			var quasiEsriGraphic = {
				attributes: feature.getProperties(),
				geometry: {}
			};
			var geom = feature.getGeometry();
			var type = geom.getType();
			var coordinates = geom.getCoordinates();
			if (type === "Point") {
				quasiEsriGraphic.geometry.type = "POINT";
				quasiEsriGraphic.geometry.x = coordinates[0];
				quasiEsriGraphic.geometry.y = coordinates[1];
				this._pointgraphics.push(quasiEsriGraphic);
			} else if (type === "LineString") {
				quasiEsriGraphic.geometry.type = "POLYLINE";
				quasiEsriGraphic.geometry.paths = [];
				var path = [];
				for (var j = 0; j < coordinates.length; j++) {
					var point = coordinates[j];
					path.push([point[0], point[1]]);
				}
				quasiEsriGraphic.geometry.paths.push(path);
				this._polylinegraphics.push(quasiEsriGraphic);
			} else if (type === "Polygon") {
				quasiEsriGraphic.geometry.type = "POLYGON";
				var rings = [];
				for (var j = 0; j < coordinates.length; j++) {
					var ring = [];
					var contour = coordinates[j];
					for (var k = 0; k < contour.length; k++) {
						var point = contour[k];
						ring.push([point[0], point[1]]);
					}
					rings.push(ring);
				}
				quasiEsriGraphic.geometry.rings = rings;
				this._polygongraphics.push(quasiEsriGraphic);
			}
		}
	};
	// "translate" the gmapsgraphics to something that quacks like an esri graphic before adding
	var addGoogleGraphics = function(googlegraphics){
		for (var i = 0; i < googlegraphics.length; i++) {
			var quasiEsriGraphic = {
				geometry: {}
			}
			var thisgraphic = googlegraphics[i];
			if (thisgraphic.position) {
				// it's a google maps marker, "position" is a LatLng, retrieve with getPosition()
				quasiEsriGraphic.geometry.x = thisgraphic.getPosition().lng();
				quasiEsriGraphic.geometry.y = thisgraphic.getPosition().lat();
				quasiEsriGraphic.geometry.type = "POINT";
				this._pointgraphics.push(quasiEsriGraphic);
			}
			else 
				if (thisgraphic.getPaths) {
					// only polygons have the getPaths (PLURAL!) function
					// it's a google maps polygon. retrieve each path using getPaths() then each one is an MVCArray
					var ringsMVC = thisgraphic.getPaths();
					var numRings = ringsMVC.getLength();
					quasiEsriGraphic.geometry.rings = [];
					for (var r = 0; r < numRings; r++) {
						var ringArray = [];
						var ringMVC = ringsMVC.getAt(r);
						var numVerts = ringMVC.getLength();
						for (var v = 0; v < numVerts; v++) {
							var vertex = ringMVC.getAt(v);
							ringArray.push([vertex.lng(), vertex.lat()]);
						}
						quasiEsriGraphic.geometry.rings.push(ringArray);
					}
					quasiEsriGraphic.geometry.type = "POLYGON";
					this._polygongraphics.push(quasiEsriGraphic);
				}
				else 
					if (thisgraphic.getPath) {
						// lines and polygons both have the getPath (SINGULAR!) function
						// it's a google maps polyline; "path" is an MVCArray of LatLngs, use getPath() to retrieve it
						// then go over the vertices using getAt(i)
						// only one path (part) is allowed 
						var pathMVC = thisgraphic.getPath();
						var length = pathMVC.getLength();
						quasiEsriGraphic.geometry.paths = [[]];
						for (var v = 0; v < length; v++) {
							var vertex = pathMVC.getAt(v);
							quasiEsriGraphic.geometry.paths[0].push([vertex.lng(), vertex.lat()]);
						}
						quasiEsriGraphic.geometry.type = "POLYLINE";
						this._polylinegraphics.push(quasiEsriGraphic);
					}
		}
	}
	var getShapefile = function(shapetype){
		// Main function to generate shapefile, after adding graphics
		// Returns an object with three members named shp,shx, and dbf, values are the associated Blobs
		if (typeof(shapetype) === 'undefined' && !(shapetype === "POINT" || shapetype === "POLYLINE" || shapetype === "POLYGON")) {
			return {
				successful: false,
				message: "Unknown or unspecified shapefile type requested"
			};
		}
		var arrayToUse = shapetype === "POINT" ? 
			this._pointgraphics : shapetype === "POLYLINE" ? 
						this._polylinegraphics : this._polygongraphics;
		if (arrayToUse.length === 0) {
			return {
				successful: false,
				message: "No graphics of type " + shapetype + " have been added!"
			};
		}
		//var resultObject = _createShapeShxFile.apply(this,[shapetype,arrayToUse]);
		var resultObject = _createShapeShxFile(shapetype,arrayToUse);
		var attributeMap = _createAttributeMap.apply(this,[arrayToUse]);
		resultObject["dbf"] = _createDbf.apply(this,[attributeMap, arrayToUse]);
		return {
			successful: true,
			shapefile: {
				shp: resultObject["shape"],
				shx: resultObject["shx"],
				dbf: resultObject["dbf"]
			}
		};
	}
// DECLARE FUCNTIONS THAT WILL BE PRIVATE (NOT EXPOSED THROUGH PROTOTYPE)
	// this is where the shapefile goodness happens
	var _createShapeShxFile = function(shapetype, graphics){
		// use the jDataView_write convenience method to create whatever kind of buffer is supported in browser
		var shpHeaderBuf = jDataView_write.createEmptyBuffer(100);
		var shpHeaderView = new jDataView_write(shpHeaderBuf);
		var shxHeaderBuf = jDataView_write.createEmptyBuffer(100);
		var shxHeaderView = new jDataView_write(shxHeaderBuf);
		// start writing the headers
		// Big-endian 32 bit int of 9994 at byte 0 in both files 
		shpHeaderView.setInt32(0, 9994);
		shxHeaderView.setInt32(0, 9994);
		// Little endian 32 bit int of 1000 at byte 28 in both files
		shpHeaderView.setInt32(28, 1000, true);
		shxHeaderView.setInt32(28, 1000, true);
		// Little endian 32 bit int at byte 32 in both files gives shapetype
		shpHeaderView.setInt32(32, ShapeTypes[shapetype], true);
		shxHeaderView.setInt32(32, ShapeTypes[shapetype], true);
		// That's the fixed info, rest of header depends on contents. Start building contents now.
		// will get extent by naive method of increasing or decreasing the min / max for each feature 
		// outside those currently set
		var ext_xmin = Number.MAX_VALUE, ext_ymin = Number.MAX_VALUE, ext_xmax = -Number.MAX_VALUE, ext_ymax = -Number.MAX_VALUE;
		var numRecords = graphics.length;
		// use the BlobBuilder polyfiller class to wrap WebkitBlobbuilder, MozBlobBuilder, or a fake blob
		// for each record we will create a buffer via a dataview, and append it to these blobs
		// This is fairly inefficient particularly for points where we could easily work out overall required 
		// buffer length for all records first. But a bit clearer for now.
		var shapeContentBlobObject = new Blob([]);
		var shxContentBlobObject = new Blob([]);
		// track overall length of files in bytes
		var byteFileLength = 100; // value is fixed 100 bytes from the header, plus the contents
		var byteShxLength = 100;
		var byteLengthOfRecordHeader = 8; // 2 integers, same for all shape types
		switch (shapetype) {
			case "POINT":
				// length of record is fixed at 20 for points, being 1 int and 2 doubles in a point record
				var byteLengthOfRecord = 20;
				var byteLengthOfRecordInclHeader = byteLengthOfRecord + byteLengthOfRecordHeader;
				for (var i = 1; i < numRecords + 1; i++) { // record numbers begin at 1 not 0
					var graphic = graphics[i - 1];
					var x = graphic.geometry["x"];
					var y = graphic.geometry["y"];
					if (x < ext_xmin) 
						ext_xmin = x;
					if (x > ext_xmax) 
						ext_xmax = x;
					if (y < ext_ymin) 
						ext_ymin = y;
					if (y > ext_ymax) 
						ext_ymax = y;
					// we'll write the shapefile record header and content into a single arraybuffer
					var recordBuffer = jDataView_write.createEmptyBuffer(byteLengthOfRecordInclHeader);
					var recordDataView = new jDataView_write(recordBuffer);
					recordDataView.setInt32(0, i); // big-endian value at byte 0 of header is record number
					// Byte 4 is length of record content only, in 16 bit words (divide by 2)
					recordDataView.setInt32(4, byteLengthOfRecord / 2); // always 20 / 2 = 10 for points
					//now the record content
					recordDataView.setInt32(8, ShapeTypes[shapetype], true); // 1=Point. LITTLE endian! 
					recordDataView.setFloat64(12, x, true); //little-endian
					recordDataView.setFloat64(20, y, true); //little-endian
					// now do the shx record. NB no record header in shx, just fixed 8 byte records.
					var shxRecordBuffer = jDataView_write.createEmptyBuffer(8);
					var shxRecordView = new jDataView_write(shxRecordBuffer);
					// byte 0 of shx record gives offset in the shapefile of record start
					// byte 4 of shx record gives length of the record in the shapefile
					shxRecordView.setInt32(0, byteFileLength / 2);
					shxRecordView.setInt32(4, (byteLengthOfRecord / 2));
					// append the data to the content blobs, use the getBuffer convenience method rather 
					// than the buffer object itself as if it's a mock (normal array) buffer it needs converting
					// to a string first
					shapeContentBlobObject = new Blob([shapeContentBlobObject, recordDataView.getBuffer()]);
					shxContentBlobObject = new Blob([shxContentBlobObject, shxRecordView.getBuffer()]);
					byteFileLength += byteLengthOfRecordInclHeader;
				}
				break;
			case "POLYLINE":
			case "POLYGON":
				// file structure is identical for lines and polygons, we just use a different shapetype and refer to
				// a different property of the input graphic
				for (var i = 1; i < numRecords + 1; i++) {
					var graphic = graphics[i - 1];
					var feat_xmin = Number.MAX_VALUE, feat_ymin = Number.MAX_VALUE, feat_xmax = -Number.MAX_VALUE, feat_ymax = -Number.MAX_VALUE;
					var numParts;
					if (shapetype == "POLYLINE") {
						numParts = graphic.geometry.paths.length;
					}
					else 
						if (shapetype == "POLYGON") {
							numParts = graphic.geometry.rings.length;
						}
					var partsIndex = [];
					var pointsArray = [];
					for (var partNum = 0; partNum < numParts; partNum++) {
						var thisPart = shapetype === "POLYLINE" ? graphic.geometry.paths[partNum] : graphic.geometry.rings[partNum];
						var numPointsInPart = thisPart.length;
						// record the index of where this part starts in the overall record's point array
						partsIndex.push(pointsArray.length);
						// add all the part's points to a single array for the record;
						for (var pointIdx = 0; pointIdx < numPointsInPart; pointIdx++) {
							pointsArray.push(thisPart[pointIdx]); // would just joining be quicker? still got to get indices 
						}
					}
					var numPointsOverall = pointsArray.length;
					// now we know all we need in order to create the binary stuff. pointsarray contains the points in JS array
					// format and partsIndex is a JS array of the start indices in pointsarray 
					// NB: each "point" or rather vertex in shapefile is just 2 doubles, 16 bytes 
					// (not a full "point" record! not clear in shapefile docs!)
					var pointsArrayBuf = jDataView_write.createEmptyBuffer(16 * numPointsOverall);
					var pointsArrayView = new jDataView_write(pointsArrayBuf);
					for (var pointIdx = 0; pointIdx < numPointsOverall; pointIdx += 1) {
						// each item in pointsArray should be an array of two numbers, being x and y coords
						var thisPoint = pointsArray[pointIdx];
						pointsArrayView.setFloat64(pointIdx * 16, thisPoint[0], true); //little-endian
						pointsArrayView.setFloat64(pointIdx * 16 + 8, thisPoint[1], true); //little-endian
						// check and update feature box / extent if necessary
						if (thisPoint[0] < feat_xmin) {
							feat_xmin = thisPoint[0];
						}
						if (thisPoint[0] > feat_xmax) {
								feat_xmax = thisPoint[0];
						}
						if (thisPoint[1] < feat_ymin) {
							feat_ymin = thisPoint[1];
						}
						if (thisPoint[1] > feat_ymax) {
								feat_ymax = thisPoint[1];
						}
					}
					// length of record contents excluding the vertices themselves is 44 + 4*numparts
					// we add another 8 for the record header which we haven't done separately, hence offsets
					// below are 8 higher than in shapefile specification (table 6)
					var recordInfoLength = 8 + 44 + 4 * numParts;
					// amount that file length is increased by
					var byteLengthOfRecordInclHeader = recordInfoLength + 16 * numPointsOverall;
					// value to use in shp record header and in shx record
					var byteLengthOfRecordContent = byteLengthOfRecordInclHeader - 8;
					// buffer to contain the record header plus the descriptive parts of the record content,
					// effectively these are header too i reckon
					var shpRecordInfo = jDataView_write.createEmptyBuffer(recordInfoLength);
					var shpRecordInfoView = new jDataView_write(shpRecordInfo);
					shpRecordInfoView.setInt32(0, i);
					shpRecordInfoView.setInt32(4, (byteLengthOfRecordContent / 2));//value is in 16 bit words
					// that's the 8 bytes of record header done, now add the shapetype, box, numparts, and numpoints
					// add 8 to all offsets given in shapefile doc to account for header
					// all numbers in the record itself are little-endian
					shpRecordInfoView.setInt32(8, ShapeTypes[shapetype], true);
					shpRecordInfoView.setFloat64(12, feat_xmin, true);
					shpRecordInfoView.setFloat64(20, feat_ymin, true);
					shpRecordInfoView.setFloat64(28, feat_xmax, true);
					shpRecordInfoView.setFloat64(36, feat_ymax, true);
					shpRecordInfoView.setInt32(44, numParts, true);
					shpRecordInfoView.setInt32(48, numPointsOverall, true);
					// now write in the indices of the part starts
					for (var partNum = 0; partNum < partsIndex.length; partNum++) {
						shpRecordInfoView.setInt32(52 + partNum * 4, partsIndex[partNum], true);
					}
					//now featureRecordInfo and pointsArrayBuf together contain the complete feature
					// now do the shx record
					var shxBuffer = jDataView_write.createEmptyBuffer(8);
					var shxDataView = new jDataView_write(shxBuffer);
					shxDataView.setInt32(0, byteFileLength / 2);
					shxDataView.setInt32(4, byteLengthOfRecordContent / 2);
					shapeContentBlobObject = new Blob([shapeContentBlobObject, shpRecordInfoView.getBuffer()]);
					shapeContentBlobObject = new Blob([shapeContentBlobObject, pointsArrayView.getBuffer()]);
					shxContentBlobObject = new Blob([shxContentBlobObject, shxDataView.getBuffer()]);
					if (feat_xmax > ext_xmax) 
						ext_xmax = feat_xmax;
					if (feat_xmin < ext_xmin) 
						ext_xmin = feat_xmin;
					if (feat_ymax > ext_ymax) 
						ext_ymax = feat_ymax;
					if (feat_ymin < ext_ymin) 
						ext_ymin = feat_ymin;
					// finally augment the overall file length tracker
					byteFileLength += byteLengthOfRecordInclHeader;
				}
				break;
			default:
				return ({
					successful: false,
					message: "unknown shape type specified"
				});
		}
		// end of switch statement. build the rest of the file headers as we now know the file extent and length
		// set extent in shp and shx headers, little endian
		shpHeaderView.setFloat64(36, ext_xmin, true);
		shpHeaderView.setFloat64(44, ext_ymin, true);
		shpHeaderView.setFloat64(52, ext_xmax, true);
		shpHeaderView.setFloat64(60, ext_ymax, true);
		shxHeaderView.setFloat64(36, ext_xmin, true);
		shxHeaderView.setFloat64(44, ext_ymin, true);
		shxHeaderView.setFloat64(52, ext_xmax, true);
		shxHeaderView.setFloat64(60, ext_ymax, true);
		// overall shp file length in 16 bit words at byte 24 of shp header
		shpHeaderView.setInt32(24, byteFileLength / 2);
		// overall shx file length in 16 bit words at byte 24 of shx header, easily worked out
		shxHeaderView.setInt32(24, (50 + numRecords * 4));
		
		// all done. make and return the final blob objects
		var shapeFileBlobObject = new Blob([shpHeaderView.getBuffer(), shapeContentBlobObject]);
		var shxFileBlobObject = new Blob([shxHeaderView.getBuffer(), shxContentBlobObject]);
		return {
			successful: true,
			shape: shapeFileBlobObject,
			shx: shxFileBlobObject
		}
	}
	// DBF created by two separate functions for header and content. This function combines them
	var _createDbf = function(attributeMap, graphics){
		if (attributeMap.length == 0) {
			attributeMap.push({
				name: "ID_AUTO",
				type: "N",
				length: "8"
			});
		}
		var dbfInfo = _createDbfHeader(attributeMap, graphics.length);
		var dbfRecordLength = dbfInfo["recordLength"];
		var dbfHeaderBlob = dbfInfo["dbfHeader"];
		var dbfData = _createDbfRecords(attributeMap, graphics, dbfRecordLength);
		var dbfBlob = new Blob([dbfHeaderBlob, dbfData]);
		return dbfBlob;
	}
	var _createDbfHeader = function(attributeMap, numRecords){
		// DBF File format references: see
		// (XBase) http://www.clicketyclick.dk/databases/xbase/format/dbf.html#DBF_STRUCT
		// http://www.quantdec.com/SYSEN597/GTKAV/section4/chapter_15a.htm
		// http://ulisse.elettra.trieste.it/services/doc/dbase/DBFstruct.htm
		/* attributes parameter will be in the format 
		 [
		 {
		 name: 	string,
		 type: 	string, // (1 character),
		 length: number, // only req if type is C or N, will be used if less than datatype maximum
		 value: 	string,
		 scale:  number  // only req if type is N, will be used for "decimal count" property
		 }
		 ]
		 */
		var numFields = attributeMap.length; // GET NUMBER OF FIELDS FROM PARAMETER
		var fieldDescLength = 32 * numFields + 1;
		// use convenience method to create compatible buffer format
		var dbfFieldDescBuf = jDataView_write.createEmptyBuffer(fieldDescLength);
		var dbfFieldDescView = new jDataView_write(dbfFieldDescBuf);
		var namesUsed = [];
		var numBytesPerRecord = 1; // total is the length of all fields plus 1 for deletion flag
		for (var i = 0; i < numFields; i++) {
			// each field has 32 bytes in the header. These describe name, type, and length of the attribute  
			var name = attributeMap[i].name.slice(0, 10);
			// need to check if the name has already been used and generate a altered one
			// if so. not doing the check yet, better make sure we don't try duplicate names!
			// NB older browsers don't have indexOf but given the other stuff we're doing with binary 
			// i think that's the least of their worries
			if (namesUsed.indexOf(name) == -1) {
				namesUsed.push(name);
			}
			// write the name into bytes 0-9 of the field description
			for (var x = 0; x < name.length; x++) {
				dbfFieldDescView.setInt8(i * 32 + x, name.charCodeAt(x));
			}
			// nb byte 10 is left at zero
			/* Now data type. Data types are 
			 C = Character. Max 254 characters.
			 N = Number, but stored as ascii text. Max 18 characters.
			 L = Logical, boolean. 1 byte, ascii. Values "Y", "N", "T", "F" or "?" are valid
			 D = Date, format YYYYMMDD, numbers
			 */
			var datatype = attributeMap[i].type || "C"
			var fieldLength;
			if (datatype == "L") {
				fieldLength = 1; // not convinced this datatype is right, doesn't show as boolean in GIS
			}
			else 
				if (datatype == "D") {
					fieldLength = 8;
				}
				else 
					if (datatype == "N") {
						// maximum length is 18
						fieldLength = attributeMap[i].length && attributeMap[i].length < 19 ? attributeMap[i].length : 18;
					}
					else 
						if (datatype == "C") {
							fieldLength = attributeMap[i].length && attributeMap[i].length < 254 ? attributeMap[i].length : 254;
						}
			//else {
			//	datatype == "C";
			//	fieldLength = 254;
			//}
			// write the type into byte 11
			dbfFieldDescView.setInt8(i * 32 + 11, datatype.charCodeAt(0)); // FIELD TYPE
			// write the length into byte 16
			dbfFieldDescView.setInt8(i * 32 + 16, fieldLength); //FIELD LENGTH
			if (datatype = "N") {
				var fieldDecCount = attributeMap[i].scale || 0;
				// write the decimal count into byte 17
				dbfFieldDescView.setInt8(i * 32 + 17, fieldDecCount); // FIELD DECIMAL COUNT
			}
			// modify what's recorded so the attribute map doesn't have more than 18 chars even if there are more 
			// than 18 present
			attributeMap[i].length = parseInt(fieldLength);
			numBytesPerRecord += parseInt(fieldLength);
		}
		// last byte of the array is set to 0Dh (13, newline character) to mark end of overall header
		dbfFieldDescView.setInt8(fieldDescLength - 1, 13)
		// field map section is complete, now do the main header
		var dbfHeaderBuf = jDataView_write.createEmptyBuffer(32);
		var dbfHeaderView = new jDataView_write(dbfHeaderBuf);
		dbfHeaderView.setUint8(0, 3) // File Signature: DBF - UNSIGNED
		var rightnow = new Date();
		dbfHeaderView.setUint8(1, rightnow.getFullYear() - 1900); // UNSIGNED
		dbfHeaderView.setUint8(2, rightnow.getMonth()); // UNSIGNED
		dbfHeaderView.setUint8(3, rightnow.getDate()); // UNSIGNED
		dbfHeaderView.setUint32(4, numRecords, true); // LITTLE ENDIAN, UNSIGNED
		var totalHeaderLength = fieldDescLength + 31 + 1;
		// the 31 bytes of this section, plus the length of the fields description, plus 1 at the end 
		dbfHeaderView.setUint16(8, totalHeaderLength, true); // LITTLE ENDIAN , UNSIGNED
		// the byte length of each record, which includes 1 initial byte as a deletion flag
		dbfHeaderView.setUint16(10, numBytesPerRecord, true); // LITTLE ENDIAN, UNSIGNED
		//dbfHeaderView.setUint8(29,03) // language driver, 03 = windows ansi
		// except for 29, bytes 12 - 31 are reserved or for things we don't need in this implementation
		// header section is complete, now build the overall header as a blob
		var dbfHeaderBlob = new Blob([dbfHeaderView.getBuffer(), dbfFieldDescView.getBuffer()]);
		return {
			recordLength: numBytesPerRecord,
			dbfHeader: dbfHeaderBlob
		}
	}
	var _createDbfRecords = function(attributeMap, graphics, dbfRecordLength){
		/* PARAMETERS:
		 * graphics is an array of objects of structure
		 * [{
		 * 	something: xxx,
		 *  somethingelse: xyz,
		 *  attributes: {
		 * 		attribname: value,
		 * 		anotherattribname: value
		 * 	}
		 * }]
		 * i.e. each object in the array must have an property called "attributes" which in turn contains
		 * the actual attributes of that object to be written as DBF fields, and these must match those
		 * in the attributeMap.
		 * Any other properties of the object are ignored as are attributes not mentioned in attributeMap.
		 * IN OTHER WORDS - attributeData is an array of esri.graphics, or something that looks like one!
		 *
		 * Each object is one record so the array MUST be in the same order as the array used to build
		 * the shapefile
		 *
		 * attributeMap is the same object that was passed to the header-building function
		 * this is used to confirm that they are the same, to get the order they appear in within a record,
		 * and to be able to ignore any attributes that we don't want to carry forward into the DBF.
		 *
		 * Recordlength gives the byte length of a record as defined in the header
		 *
		 * All record data is stored as ASCII, i.e. numbers as their ASCII representation rather than binary int etc
		 * It appears that number fields are left padded with spaces to their defined length (data on right),
		 * and string fields are right padded.
		 *
		 * There are almost certainly more ways to break this than there are ways to make it work!
		 */
		// overall datalength is number of records * (length of record including 1 for deletion flag) +1 for EOF
		var dataLength = (dbfRecordLength) * graphics.length + 1;
		//var dbfDataBuf = new ArrayBuffer(dataLength);
		var dbfDataBuf = jDataView_write.createEmptyBuffer(dataLength);
		var dbfDataView = new jDataView_write(dbfDataBuf);
		var currentOffset = 0;
		for (var rownum = 0; rownum < graphics.length; rownum++) {
			var rowData = graphics[rownum].attributes || {};
			//console.log ("Writing DBF record for searchId "+rowData['SEARCHID'] + 
			//	" and type " + rowData['TYPE'] + "to row "+rownum);
			var recordStartOffset = rownum * (dbfRecordLength); // recordLength includes the byte for deletion flag
			//var currentOffset = rownum*(recordLength);
			dbfDataView.setUint8(currentOffset, 32); // Deletion flag: not deleted. 20h = 32, space
			currentOffset += 1;
			for (var attribNum = 0; attribNum < attributeMap.length; attribNum++) {
				// loop once for each attribute
				var attribInfo = attributeMap[attribNum];
				var attName = attribInfo["name"];
				var dataType = attribInfo["type"] || "C";
				var fieldLength = parseInt(attribInfo["length"]) || 0; // it isn't alterable for L or D type fields
				var attValue = rowData[attName] || rownum.toString(); // use incrementing number if attribute is missing,
				// this will come into play if there were no attributes in the original graphics, hence the attributeMap contains "ID_AUTO"
				//var fieldLength;
				if (dataType == "L") {
					fieldLength = 1;
					if (attValue) {
						dbfDataView.setUint8(currentOffset, 84); // 84 is ASCII for T
					}
					else {
						dbfDataView.setUint8(currentOffset, 70); // 70 is ASCII for F
					}
					currentOffset += 1;
				}
				else 
					if (dataType == "D") {
						fieldLength = 8;
						var numAsString = attValue.toString();
						if (numAsString.length != fieldLength) {
							// if the length isn't what it should be then ignore and write a blank string
							numAsString = "".lpad(" ", 8);
						}
						for (var writeByte = 0; writeByte < fieldLength; writeByte++) {
							dbfDataView.setUint8(currentOffset, numAsString.charCodeAt(writeByte));
							currentOffset += 1;
						}
					}
					else 
						if (dataType == "N") {
							// maximum length is 18. Numbers are stored as ascii text so convert to a string.
							// fieldLength = attribinfo.length && attribinfo.length<19 ? attribinfo.length : 18;
							var numAsString = attValue.toString();
							if (fieldLength == 0) {
								continue;
							}
							// bug fix: was calling lpad on != fieldLength i.e. for too-long strings too
							if (numAsString.length < fieldLength) {
								// if the length is too short then pad to the left
								numAsString = numAsString.lpad(" ", fieldLength);
							}
							else if (numAsString.length > fieldLength){
								numAsString = numAsString.substr(0,18);
							}
							for (var writeByte = 0; writeByte < fieldLength; writeByte++) {
								dbfDataView.setUint8(currentOffset, numAsString.charCodeAt(writeByte));
								currentOffset += 1;
							}
						}
						else 
							if (dataType == "C" || dataType == "") {
								if (fieldLength == 0) {
									continue;
								}
								if (typeof(attValue) !== "string") {
									// just in case a rogue number has got in...
									attValue = attValue.toString();
								}
								if (attValue.length < fieldLength) {
									attValue = attValue.rpad(" ", fieldLength);
								}
								// doesn't matter if it's too long as we will only write fieldLength bytes
								for (var writeByte = 0; writeByte < fieldLength; writeByte++) {
									dbfDataView.setUint8(currentOffset, attValue.charCodeAt(writeByte));
									currentOffset += 1;
								}
							}
			}
			// row done, rinse and repeat
		}
		// all rows written, write EOF
		dbfDataView.setUint8(dataLength - 1, 26);
		//var dbfDataBlobObject = new WebKitBlobBuilder();
		var dbfDataBlobObject = new Blob([dbfDataView.getBuffer()]);
		return dbfDataBlobObject;
	}
	var _createAttributeMap = function(graphicsArray){
		// creates a summary of the attributes in the input graphics
		// will be a union of all attributes present so it is sensible but not required that 
		// all input graphics have same attributes anyway
		var allAttributes = {};
		for (var i = 0; i < graphicsArray.length; i++) {
			var graphic = graphicsArray[i];
			if (graphic.attributes) {
				for (var attribute in graphic.attributes) {
					if (graphic.attributes.hasOwnProperty(attribute)) {
						var attvalue = graphic.attributes[attribute];
						if (allAttributes.hasOwnProperty(attribute)) {
							// Call toString on all attributes to get the length in characters
							if (allAttributes[attribute].length < attvalue.toString().length) {
								allAttributes[attribute].length = attvalue.toString().length;
							}
						}
						else {
							switch (typeof(attvalue)) {
								case "number":
									if (parseInt(attvalue) === attvalue) {
										// it's an int
										allAttributes[attribute] = {
											type: 'N',
											length: attvalue.toString().length
										}
									}
									else 
										if (parseFloat(attvalue) === attvalue) {
											// it's a float
											var scale = attvalue.toString().length -
											(attvalue.toString().split('.')[0].length + 1);
											allAttributes[attribute] = {
												type: 'N',
												length: attvalue.toString().length,
												scale: scale
											}
										}
									break;
								case "boolean":
									allAttributes[attribute] = {
										type: 'L'
									}
									break;
								case "string":
									allAttributes[attribute] = {
										type: "C",
										length: attvalue.length
									}
									break;
							}
						}
					}
				}
			}
		}
		var attributeMap = [];
		for (attributeName in allAttributes) {
			if (allAttributes.hasOwnProperty(attributeName)) {
				var thisAttribute = {
					name: attributeName,
					type: allAttributes[attributeName]["type"],
					length: allAttributes[attributeName]["length"]
				};
				if (allAttributes[attributeName].hasOwnProperty("length")) {
					thisAttribute["length"] = allAttributes[attributeName]["length"];
				}
				if (allAttributes[attributeName].hasOwnProperty("scale")) {
					thisAttribute["scale"] = allAttributes[attributeName]["scale"];
				}
				attributeMap.push(thisAttribute);
			}
		}
		return attributeMap;
	}
// DEFINE THE OBJECT THAT WILL REPRESENT THE PROTOTYPE
	// all functions defined, now return as the prototype an object giving access to the ones we want
	// to be public
	return {
		constructor: ShapeMaker,
		addESRIGraphics: function(){
			return addESRIGraphics.call(this,arguments[0])
		},
		addGoogleGraphics: function(){
			return addGoogleGraphics.call(this,arguments[0]);
		},
		addOLGraphics:function(){
			return addOLGraphics.call(this,arguments[0]);
		},
		addOL3Graphics:function(){
			return addOL3Graphics.call(this,arguments[0]);
		},
		getShapefile: function(){
			return getShapefile.call(this,arguments[0]);
		}
	}
	// execute the prototype definition immediately
	})();
	// return the ShapeMaker object  
	return ShapeMaker;
// execute the whole lot so that ShapeFile is available in the global space	
})();