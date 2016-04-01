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