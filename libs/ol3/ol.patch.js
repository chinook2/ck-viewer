ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_["http://www.opengis.net/gml"].pos = ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_["http://www.opengis.net/gml"].coordinates;


/**
 * Allow to apply specific style on sketchPoint when drawing + snapping
 */
// add flag 'snapped' to event
ol.interaction.Snap.handleEvent_ = function(evt) {
  var result = this.snapTo(evt.pixel, evt.coordinate, evt.map);

  // reset FLAG
  evt.snapped = false;
  //

  if (result.snapped) {
    evt.coordinate = result.vertex.slice(0, 2);
    evt.pixel = result.vertexPixel;

    // FLAG to set event as "snapped" event
    evt.snapped = true;
    //
  }

  return ol.interaction.Pointer.handleEvent.call(this, evt);
};

// apply styleSnapped if needed
ol.interaction.Draw.prototype.createOrUpdateSketchPoint_ = function(event) {
  var coordinates = event.coordinate.slice();
  if (!this.sketchPoint_) {
    this.sketchPoint_ = new ol.Feature(new ol.geom.Point(coordinates));
    this.updateSketchFeatures_();
  } else {
    var sketchPointGeom = /** @type {ol.geom.Point} */ (this.sketchPoint_.getGeometry());
    sketchPointGeom.setCoordinates(coordinates);

    // Apply or not special style...
    if (this.styleSnapped_) {
        if (event.snapped === true) {
            this.sketchPoint_.setStyle(this.styleSnapped_);
        } else {
            this.sketchPoint_.setStyle(null);
        }
    }
    //
  }
};



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
