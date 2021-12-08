ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS["http://www.opengis.net/gml"].pos = ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS["http://www.opengis.net/gml"].coordinates;


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
 * New method
 */
ol.source.Vector.prototype.isExtentsLoaded = function(extents) {
	var loadedExtentsRtree = this.loadedExtentsRtree_;
	var i, ii;
	for (i = 0, ii = extents.length; i < ii; ++i) {
		var extentToLoad = extents[i];
		var alreadyLoaded = loadedExtentsRtree.forEachInExtent(extentToLoad, function(object) {
			return ol.extent.containsExtent(object.extent, extentToLoad);
		});
		if (!alreadyLoaded) {
			return false
		}
	}
	return true;
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
/**
 * Function to create a style with hash in Polygons at 45°.
 * Options:
 * * backgroundColor
 * * color: line color
 * * width: width and height of the image
 * * lineWidth: width of the line
 * * reverse: if true revers the sense (-45°)
 */
ol.style.HashFill = function(opt_options){
	const options = opt_options || {};
	return new ol.style.Fill({
		color: function() {
			var width = options.width || 10;
			var lineWidth = options.lineWidth || 1;
			var canvas = document.createElement('canvas');
			canvas.style.backgroundColor = options.backgroundColor || 'white';
			canvas.width = (width || 10) + .1;
			canvas.height = width || 10;
			var ctx = canvas.getContext('2d');
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = options.color || 'black';
			ctx.fillStyle = options.color || 'black';
			
			if (options.reverse === true) {
				// 1 - Draw the line
				// 2 & 3 - Draw corners because line truncated in corner
				ctx.beginPath();
				ctx.moveTo(0,0);
				ctx.lineTo(lineWidth,0);
				ctx.lineTo(width,width-lineWidth);
				ctx.lineTo(width, width);
				ctx.lineTo(width-lineWidth,width);
				ctx.lineTo(0, lineWidth);
				ctx.fill();
				
				ctx.beginPath();
				ctx.moveTo(width-lineWidth,0);
				ctx.lineTo(width,0);
				ctx.lineTo(width,lineWidth);
				ctx.fill();
				
				ctx.beginPath();
				ctx.moveTo(lineWidth,width);
				ctx.lineTo(0,width);
				ctx.lineTo(0, width-lineWidth);
				ctx.fill();
			} else {
				// 1 - Draw the line
				// 2 & 3 - Draw corners because line truncated in corner
				ctx.beginPath();
				ctx.moveTo(width-lineWidth,0);
				ctx.lineTo(width,0);
				ctx.lineTo(width,lineWidth);
				ctx.lineTo(lineWidth, width);
				ctx.lineTo(0,width);
				ctx.lineTo(0, width-lineWidth);
				ctx.fill();
				
				ctx.beginPath();
				ctx.moveTo(0,0);
				ctx.lineTo(lineWidth,0);
				ctx.lineTo(0,lineWidth);
				ctx.fill();
				
				ctx.beginPath();
				ctx.moveTo(width,width);
				ctx.lineTo(width-lineWidth,width);
				ctx.lineTo(width,width-lineWidth);
				ctx.fill();
			}
			
			
			
			return ctx.createPattern(canvas,'repeat');
		}()
	});
}
