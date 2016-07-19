ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_["http://www.opengis.net/gml"].pos = ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_["http://www.opengis.net/gml"].coordinates;


/**
 * Patch to add directly in ol-debug.js
 *
 *
ol.layer.Layer.prototype.setMap = function(map) {
  goog.events.unlistenByKey(this.mapPrecomposeKey_);
  this.mapPrecomposeKey_ = null;
  if (goog.isNull(map)) {
    this.changed();
  }
  goog.events.unlistenByKey(this.mapRenderKey_);
  this.mapRenderKey_ = null;
  if (!goog.isNull(map)) {
    this.mapPrecomposeKey_ = goog.events.listen(
        map, ol.render.EventType.PRECOMPOSE, function(evt) {
          var layerState = this.getLayerState();
		  
		  * Here the important fix
		  var zIndex = this.getZIndex();
          layerState.managed = false;
          layerState.zIndex = (goog.isDef(zIndex) && zIndex != 0) ? zIndex : Infinity;
		  
		  
          evt.frameState.layerStatesArray.push(layerState);
          evt.frameState.layerStates[goog.getUid(this)] = layerState;
        }, false, this);
    this.mapRenderKey_ = goog.events.listen(
        this, goog.events.EventType.CHANGE, map.render, false, map);
    this.changed();
  }
};
 *
 *
 *
 *
 *
 this.featureOverlay_ = new ol.layer.Vector({
    source: new ol.source.Vector({
      useSpatialIndex: false,
      wrapX: options.wrapX
    }),
    style: goog.isDef(options.style) ? options.style :
        ol.interaction.Select.getDefaultStyleFunction(),
    updateWhileAnimating: true,
    updateWhileInteracting: true,
	zIndex: goog.isDef(options.zIndex) ? options.zIndex : Infinity // The line to add
  });
 *
 *
 *
 *
 */