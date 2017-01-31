ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_["http://www.opengis.net/gml"].pos = ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_["http://www.opengis.net/gml"].coordinates;

/**
 * Fix to get intersected segment on vertex live creation (on click on segment)
 */
ol.interaction.Modify.handleDownEvent_ = function(evt) {
  this.handlePointerAtPixel_(evt.pixel, evt.map);
  this.dragSegments_ = [];
  this.modified_ = false;
  var vertexFeature = this.vertexFeature_;
  if (vertexFeature) {
    var insertVertices = [];
    var geometry = /** @type {ol.geom.Point} */ (vertexFeature.getGeometry());
    var vertex = geometry.getCoordinates();
    var vertexExtent = ol.extent.boundingExtent([vertex]);
    var segmentDataMatches = this.rBush_.getInExtent(vertexExtent);
    var componentSegments = {};
    segmentDataMatches.sort(ol.interaction.Modify.compareIndexes_);
    for (var i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
      var segmentDataMatch = segmentDataMatches[i];
      var segment = segmentDataMatch.segment;
      var uid = goog.getUid(segmentDataMatch.feature);
      var depth = segmentDataMatch.depth;
      if (depth) {
        uid += '-' + depth.join('-'); // separate feature components
      }
      if (!componentSegments[uid]) {
        componentSegments[uid] = new Array(2);
      }
      if (ol.coordinate.equals(segment[0], vertex) &&
          !componentSegments[uid][0]) {
        this.dragSegments_.push([segmentDataMatch, 0]);
        componentSegments[uid][0] = segmentDataMatch;
      } else if (ol.coordinate.equals(segment[1], vertex) &&
          !componentSegments[uid][1]) {

        // prevent dragging closed linestrings by the connecting node
        if ((segmentDataMatch.geometry.getType() ===
            ol.geom.GeometryType.LINE_STRING ||
            segmentDataMatch.geometry.getType() ===
            ol.geom.GeometryType.MULTI_LINE_STRING) &&
            componentSegments[uid][0] &&
            componentSegments[uid][0].index === 0) {
          continue;
        }

        this.dragSegments_.push([segmentDataMatch, 1]);
        componentSegments[uid][1] = segmentDataMatch;
      } else if (goog.getUid(segment) in this.vertexSegments_ &&
          (!componentSegments[uid][0] && !componentSegments[uid][1])) {
        insertVertices.push([segmentDataMatch, vertex]);
      }
    }
	
	// Here the patch. Invert the "for" and the "if"
    for (var j = insertVertices.length - 1; j >= 0; --j) {
      this.insertVertex_.apply(this, insertVertices[j]);
    }
	if (insertVertices.length) {
      this.willModifyFeatures_(evt);
    }
  }
  return !!this.vertexFeature_;
};

/**
 * Patch setMap to allow a layer to be above all other
 */
ol.layer.Vector.prototype.setMap = function(map) {
  if (this.mapPrecomposeKey_) {
    ol.events.unlistenByKey(this.mapPrecomposeKey_);
    this.mapPrecomposeKey_ = null;
  }
  if (!map) {
    this.changed();
  }
  if (this.mapRenderKey_) {
    ol.events.unlistenByKey(this.mapRenderKey_);
    this.mapRenderKey_ = null;
  }
  if (map) {
    this.mapPrecomposeKey_ = ol.events.listen(
        map, ol.render.EventType.PRECOMPOSE, function(evt) {
          var layerState = this.getLayerState();
          layerState.managed = false;
		  
		  // Here the patch
		  var zIndex = this.getZIndex();
          layerState.zIndex = goog.isDef(zIndex) ? zIndex : Infinity;
		  
          evt.frameState.layerStatesArray.push(layerState);
          evt.frameState.layerStates[goog.getUid(this)] = layerState;
        }, this);
    this.mapRenderKey_ = ol.events.listen(
        this, ol.events.EventType.CHANGE, map.render, map);
    this.changed();
  }
};

/**
 * @param {string|ol.FeatureUrlFunction} url Feature URL service.
 * @param {ol.format.Feature} format Feature format.
 * @param {function(this:ol.VectorTile, Array.<ol.Feature>, ol.proj.Projection)|function(this:ol.source.Vector, Array.<ol.Feature>)} success
 *     Function called with the loaded features and optionally with the data
 *     projection. Called with the vector tile or source as `this`.
 * @param {function(this:ol.VectorTile)|function(this:ol.source.Vector)} failure
 *     Function called when loading failed. Called with the vector tile or
 *     source as `this`.
 * @return {ol.FeatureLoader} The feature loader.
 */
ol.featureloader.loadFeaturesXhr = function(url, format, success, failure) {
  return (
      /**
       * @param {ol.Extent} extent Extent.
       * @param {number} resolution Resolution.
       * @param {ol.proj.Projection} projection Projection.
       * @this {ol.source.Vector|ol.VectorTile}
       */
      function(extent, resolution, projection) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET',
            goog.isFunction(url) ? url(extent, resolution, projection) : url,
            true);
        if (format.getType() == ol.format.FormatType.ARRAY_BUFFER) {
          xhr.responseType = 'arraybuffer';
        }
        /**
         * @param {Event} event Event.
         * @private
         */
        xhr.onload = function(event) {
		  // Add xhr.statut == 0 to load the geojson from local file (ajax versus filesystem)
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 0) {
            var type = format.getType();
            /** @type {Document|Node|Object|string|undefined} */
            var source;
            if (type == ol.format.FormatType.JSON ||
                type == ol.format.FormatType.TEXT) {
              source = xhr.responseText;
            } else if (type == ol.format.FormatType.XML) {
              source = xhr.responseXML;
              if (!source) {
                source = ol.xml.parse(xhr.responseText);
              }
            } else if (type == ol.format.FormatType.ARRAY_BUFFER) {
              source = /** @type {ArrayBuffer} */ (xhr.response);
            } else {
              goog.asserts.fail('unexpected format type');
            }
            if (source) {
              success.call(this, format.readFeatures(source,
                  {featureProjection: projection}),
                  format.readProjection(source));
            } else {
              goog.asserts.fail('undefined or null source');
            }
          } else {
            failure.call(this);
          }
        }.bind(this);
        xhr.send();
      });
};

/**
 * @classdesc
 * Layer source for the MapQuest tile server.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.MapQuestOptions=} opt_options MapQuest options.
 * @api stable
 */
ol.source.MapQuest = function(opt_options) {

  var options = opt_options || {};
  goog.asserts.assert(options.layer in ol.source.MapQuestConfig,
      'known layer configured');

  var layerConfig = ol.source.MapQuestConfig[options.layer];

  /**
   * Layer. Possible values are `osm`, `sat`, and `hyb`.
   * @type {string}
   * @private
   */
  this.layer_ = options.layer;

  // var url = options.url !== undefined ? options.url :
      // 'https://otile{1-4}-s.mqcdn.com/tiles/1.0.0/' +
      // this.layer_ + '/{z}/{x}/{y}.jpg';
  var url = options.url !== undefined ? options.url :
      "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"
	  
  goog.base(this, {
    attributions: layerConfig.attributions,
    crossOrigin: 'anonymous',
    logo: 'https://developer.mapquest.com/content/osm/mq_logo.png',
    maxZoom: layerConfig.maxZoom,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    opaque: layerConfig.opaque,
    tileLoadFunction: options.tileLoadFunction,
    url: url
  });

};

goog.inherits(ol.source.MapQuest, ol.source.XYZ);