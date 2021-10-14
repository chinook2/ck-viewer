/**
 * The map controller allow to interact with the map. You can use the Ck.map.Model binding to control the map from a view
 * or you can use directly the map controller functions from another controller or a Ck.Action.
 *
 * ### ckmap is the controller
 *
 * The events like ckmapReady, the Ck.Controller#getMap (and by inheritance getMap() of all the ck controllers) return a Ck.map.Controller.
 *
 * Example in Ck.map.action.ZoomIn :
 *
 *		var map = Ck.getMap();
 *		map.setZoom( map.getZoom() + 1 );
 *
 * Example in Ck.legend.Controller :
 *
 *     var layers = this.getMap().getLayers()
 *
 * ### Events relay
 *
 * The map controller relay also ol.Map events like addLayer.
 *
 */
Ext.define("Ck.map.Controller", {
  extend: "Ck.Controller",
  alias: "controller.ckmap",

  requires: ["Ck.format.OWSContext"],

  /**
   * @event ready
   * Fires when the map is ready (rendered)
   * @param {Ck.map.Controller} this
   */

  /**
   * @event ckmapReady
   * Global event. Fires when the map is ready (rendered)
   *
   *		Ext.on('ckmapReady', function(map) {
   *			this._map = map;
   *			// Do it here ...
   *		}, this);
   *
   * @param {Ck.map.Controller} this
   */

  /**
   * @event contextloading
   * Fires when context begin to load
   * @param {Ck.Owc}
   */

  /**
   * @event layersloading
   * Fires when layers data begin to load
   */

  /**
   * @event layersloaded
   * Fires when all layers data are loaded
   */

  /**
   * @event loaded
   * Fires when the map is ready (rendered) and all the layers of the current context are loaded
   * @param {Ck.map.Controller} this
   */

  /**
   * @event ckmapLoaded
   * Global event. Fires when the map is ready (rendered) and all the layers of the current context are loaded.
   *
   *		Ext.on('ckmapLoaded', function(map) {
   *			this._map = map;
   *			// Do it here ...
   *		}, this);
   *
   * @param {Ck.map.Controller} this
   */

  /**
   * @event addlayer
   * Fires when layer is added to the map
   * @param {ol.layer.*} layer
   * @param {Number} Index of inserted layer in its group
   */

  /**
   * @event removelayer
   * Fires when layer is removed from the map
   * @param {ol.layer.*} layer
   */

  /**
   * @event geolocationchange
   * Fires when geolocation change was detected
   * @param {ol.coordinate}
   */

  /**
   * @propety {boolean}
   * True when OpenLayers map is rendered (or rendering)
   */
  rendered: false,

  /**
   * @propety {Ck.legend.Controller}
   * Legend associated to this map
   */
  legend: null,

  /**
   * @var {ol.Geolocation}
   */
  geolocation: null,

  /**
   * @var {ol.coordinate}
   * Offset to translate marker to another location
   */
  geolocationOffset: [0, 0],

  /**
   * @var {Ext.data.Store}
   * Stores views (center + zoom) visited by the user
   */
  viewStore: null,

  /**
   * @property {integer}
   * Max views to store
   */
  viewMaxLength: 10,

  /**
   * @property {boolean}
   * Ignore view storing
   */
  ignoreViewRegister: false,

  currViewIdx: 0,

  currentOwsContext: null,

  /**
   * Init the map component, init the viewModel.
   * @protected
   */
  init: function () {
    var v = this.getView();

    if (Ck.params.context) {
      v.setContext(Ck.params.context);
    }

    // Create controls
    var olControls = [];
    var control,
      controls = v.getControls();
    for (var controlName in controls) {
      if (controls[controlName] === false) continue;
      control = Ck.create("ol.control." + controlName, controls[controlName]);
      if (control) {
        olControls.push(control);
      }
    }

    if (controls.ZoomSlider) {
      v.addCls(
        controls.ZoomSlider.style
          ? controls.ZoomSlider.style
          : "zoomslider-style1"
      );
    }

    // Create interactions
    var olInteractions = [];
    var interaction,
      interactions = v.getInteractions();
    for (var interactionName in interactions) {
      interaction = Ck.create(
        "ol.interaction." + interactionName,
        interactions[interactionName]
      );
      if (interaction) {
        olInteractions.push(interaction);
      }
    }

    // Create the map
    var olMap = new ol.Map({
      view: new ol.View({
        center: v.getCenter(),
        zoom: v.getZoom(),
      }),
      controls: olControls,
      interactions: olInteractions,
    });

    this.bindMap(olMap);

    //if (Ck.getAction("ckmapPreviousview") && Ck.getAction("ckmapNextview")) {
    Ext.define("StoredView", {
      extend: "Ext.data.Model",
      fields: [{ name: "center" }, { name: "zoom", type: "integer" }],
    });

    this.viewStore = Ext.create("Ext.data.Store", {
      model: "StoredView",
      data: [],
    });

    this.getOlMap().on(
      "moveend",
      function (mapEvt) {
        this.registerView();
      },
      this
    );

    //	Ck.getAction("ckmapPreviousview").controller = this;
    //	Ck.getAction("ckmapNextview").controller = this;
    //}

    this.on("layersloading", this.layersLoading, this);
    this.on("layersloaded", this.layersLoaded, this);
    this.layersAreLoading = false;

    // Relay olMap events
    olMap.getLayers().on(
      "add",
      function (colEvent) {
        var layer = colEvent.element;
        // Alias to get extension property directly
        layer.getExtension = function (key) {
          return Ext.isEmpty(this.get("extension"))
            ? undefined
            : this.get("extension")[key];
        };
        this.fireEvent("addlayer", layer);
      },
      this
    );
    olMap.getLayers().on(
      "remove",
      function (colEvent) {
        var layer = colEvent.element;
        this.fireEvent("removelayer", layer);
      },
      this
    );
  },

  registerView: function () {
    if (this.ignoreViewRegister === false) {
      var view = this.getOlView();

      if (this.currViewIdx < this.viewStore.getCount() - 1) {
        for (
          var i = this.viewStore.getCount() - 1;
          i >= this.currViewIdx;
          i--
        ) {
          this.viewStore.removeAt(i);
        }
      }

      this.viewStore.add({
        zoom: view.getZoom(),
        center: view.getCenter(),
      });

      this.currViewIdx = this.viewStore.getCount() - 1;
    }
    this.ignoreViewRegister = false;
  },

  layersLoading: function () {
    this.layersAreLoading = true;
  },

  layersLoaded: function () {
    this.layersAreLoading = false;
  },

  /**
   * Init the context map. Called when map is ready.
   * @param {undefined/Object} Object with features, id, properties and type members
   * @protected
   */
  initContext: function (context) {
    var vm = this.getViewModel();

    if (!context) {
      var contextName = this.getView().getContext();
      this.getContext(contextName);
      return;
    }

    var owc = new Ck.Owc({
      data: context,
    });
    if (!owc) {
      Ck.log("This context is not a OWS context !");
      return;
    }

    var v = this.getView();
    var olMap = this.getOlMap();
    var olView = this.getOlView();

    // Remove all layers
    olMap.setLayerGroup(Ck.create("ol.layer.Group"));

    this.originOwc = owc;

    var continueEvent = this.fireEvent("contextloading", owc);

    if (continueEvent) {
      var viewProj = owc.getProjection();
      var viewScales = owc.getScales();

      // Set scales for combobox and olView
      var vmStores = vm.storeInfo;
      vmStores.scales = new Ext.data.Store({
        fields: ["zoom", "res", "scale"],
        data: viewScales,
      });

      vm.setStores(vmStores);

      // Reset olView because "set" and "setProperties" method doesn't work for min/maxResolution
      olMap.setView(
        new ol.View({
          projection: viewProj,
          center: v.getCenter(),
          extent: owc.getMaxExtent(),
          zoom: v.getZoom(),
          minResolution: viewScales[0].res,
          maxResolution: viewScales[viewScales.length - 1].res,
        })
      );
      this.bindMap(olMap);
      vm.notify();

      // Set the bbox
      this.setExtent(owc.getExtent());
      this.currentOwsContext = owc;

      this.relayMapEvents(olMap.getLayerGroup());

      // Add a layer group to host special layer (draw, measure...)
      this.specialGroup = Ck.create("ol.layer.Group", {
        title: "CkOverlayGroup",
        path: "CkOverlayGroup",
        zIndex: 1,
      });
      olMap.addLayer(this.specialGroup);

      // Create overview collection
      this.overviewCollection = new ol.Collection();

      // Load all layers. Reverse the loading for right order displaying
      var layer,
        layers = owc.getLayers();
      var olExtent = owc.getMaxExtent();
      for (var i = layers.length - 1; i >= 0; i--) {
        var currLayer = layers[i];

        if (currLayer.getExtension("overviewLayer") === true) {
          layer = this.createLayer(currLayer, owc);
          layer.setVisible(true);
          layer.setExtent(olExtent);

          this.overviewCollection.push(layer);
        } else if (currLayer.getExtension("isFolder") === true) {
          this.addFolder(currLayer, owc);
        } else {
          this.addLayer(currLayer, owc, Infinity);
        }
      }
      //console.log(this.overviewCollection);

      // Init GPS manager. Overwrite getPosition to integrate offset to facilitate development
      // TODO Use navigator.geolocaiton directly because ol.Geolocation sucks
      this.geolocation = new ol.Geolocation({
        projection: viewProj,
        tracking: true,
        trackingOptions: {
          enableHighAccuracy: true,
          // timeout: 5000,
          maximumAge: 0,
        },
        geolocationOffset: Ck.getMap().geolocationOffset,
      });
      this.geolocation.geolocationOffset = this.geolocationOffset;
      this.geolocation.getRealPosition = this.geolocation.getPosition;
      this.geolocation.getPosition = function () {
        var p = this.getRealPosition();
        if (Ext.isArray(p)) {
          p[0] = p[0] + this.geolocationOffset[0];
          p[1] = p[1] + this.geolocationOffset[1];
        }
        return p;
      };

      this.geolocation.on(
        "change",
        function (evt) {
          var p = evt.target.getPosition();
          this.fireEvent("geolocationchange", p);
        },
        this
      );
      this.geolocation.on("error", function (error) {
        Ck.error("GPS : " + error.message);
      });

      // Fire when layers are loaded
      Ck.log("fireEvent ckmapLoaded");
      this.fireEvent("loaded", this);
      Ext.GlobalEvents.fireEvent("ckmapLoaded", this);
    }
  },

  addSpecialLayer: function (layer) {
    this.specialGroup.getLayers().insertAt(0, layer);
  },

  removeSpecialLayer: function (layer) {
    this.specialGroup.getLayers().remove(layer);
  },

  /**
   * Call createLayer and add the created layer to the group
   * @param {Ck.format.OWSContextLayer}
   * @param {Ck.format.OWSContext}
   * @param {Number} Index to insert in the legend. Infinity to insert at last
   */
  addLayer: function (layer, owc, index) {
    if (!(typeof index == "number")) {
      index = 0;
    }
    // var viewProj = owc.getProjection();

    var olLayer = this.createLayer(layer, owc);

    if (!Ext.isEmpty(olLayer)) {
      var path = layer.getExtension("path") || "";
      lyrGroup = this.getLayerGroup(path);

      if (olLayer) {
        if (index == 0) {
          index = lyrGroup.getLayers().getLength();
        } else if (index == Infinity) {
          index = 0;
        }
        olLayer.ckLayer = layer;
        lyrGroup.getLayers().insertAt(index, olLayer);
      }
    }
  },

  /**
   * Create a layer with its source.
   * @param {Ck.format.OWSContextLayer}
   * @param {Ck.format.OWSContext}
   * @return {ol.layer.Base}
   */
  createLayer: function (layer, owc) {
    if (Ext.isEmpty(owc)) {
      owc = this.currentOwsContext;
    }

    var olLayer,
      olStyle = false,
      mainOffering = layer.getOffering(0);
    var olSource = this.createSource(mainOffering, layer, owc);

    switch (mainOffering.getType()) {
      case "wfs":
      case "geojson":
        var style = layer.getExtension("style");
        var layerId = layer.getId();
        olStyle = Ck.map.Style.getStyleFromConfig(style, layerId, false);
        break;
    }

    if (!Ext.isEmpty(olSource)) {
      var cluster = layer.getExtension("cluster");
      if (cluster) {
        var styleCache = {};
        var nbFeatures = false;
        olStyle = function (opt, source, feature, resolution) {
          var size = feature.get("features").length;
          var style = styleCache[size];
          if (!style) {
            var minSize = opt.minSize || 10;
            var maxSize = opt.maxSize || opt.distance || 60;
            if (!nbFeatures) nbFeatures = source.getFeatures().length;
            var ptRadius = minSize + (size * maxSize) / nbFeatures;
            style = [
              new ol.style.Style({
                image: new ol.style.Circle({
                  radius: ptRadius,
                  stroke: new ol.style.Stroke({
                    color: "#fff",
                  }),
                  fill: new ol.style.Fill({
                    color: "rgba(51,153,204,0.75)",
                  }),
                }),
                text: new ol.style.Text({
                  text: size.toString(),
                  scale: ptRadius * 0.1,
                  fill: new ol.style.Fill({
                    color: "#fff",
                  }),
                }),
              }),
            ];
            styleCache[size] = style;
          }
          return style;
        }.bind(undefined, cluster, olSource);
      }

      var extent = layer.getExtent() || owc.getMaxExtent();
      if (mainOffering.getType() == "xyz") {
        extent = olSource.tileGrid.getExtent() || extent;
      }

      var ckLayerSpec =
        this.getViewModel().getData().ckOlLayerConnection[
          mainOffering.getType()
        ];

      // Create others source
      var sources = {};
      var off,
        offs = layer.getOfferings();
      for (var i = 1; i < offs.length; i++) {
        off = offs[i];
        if (!Ext.isArray(sources[off.getType()])) {
          sources[off.getType()] = [];
        }
        sources[off.getType()].push(this.createSource(off, layer, owc));
      }

      var attribution = layer.getExtension("attribution") || "";
      var path = layer.getExtension("path") || "";
      lyrGroup = this.getLayerGroup(path);

      var opacity = layer.getExtension("opacity");
      opacity = !isNaN(parseFloat(opacity)) && isFinite(opacity) ? opacity : 1;

      units = Ck.getMap().getOlView().getProjection().units_;
      minscaletmp = layer.getMinScale();
      if (minscaletmp) {
        minrestmp = Ck.getResolutionForScale(minscaletmp, units);
        layer.setMinResolution(minrestmp);
      } else {
        minrestmp = layer.getMinResolution();
      }
      maxscaletmp = layer.getMaxScale();
      if (maxscaletmp) {
        maxrestmp = Ck.getResolutionForScale(maxscaletmp, units);
        layer.setMaxResolution(maxrestmp);
      } else {
        maxrestmp = layer.getMaxResolution();
      }

      // Layer creation
      olLayer = Ck.create("ol.layer." + ckLayerSpec.layerType, {
        id: layer.getId(),
        title: layer.getTitle(),
        source: olSource,
        sources: sources,
        group: lyrGroup,
        extent: extent,
        style: olStyle,
        visible: layer.getVisible(),
        zIndex: layer.getZIndex(),
        path: path,
        attribution: attribution,
        // minResolution: layer.getMinResolution(),
        // maxResolution: layer.getMaxResolution(),
        minResolution: minrestmp,
        maxResolution: maxrestmp,
        opacity: opacity,
      });
    }

    return olLayer;
  },

  /**
   * Create a source from an offering
   * @param {Ck.owsLayerOffering}
   * @param {Ck.owsLayer}
   * @param {Ck.owc}
   * @return {ol.Source}
   */
  createSource: function (offering, layer, owc) {
    var olSourceOptions, params, mainOperation;
    var olSourceAdditional = {
      layer: layer,
    };
    var ckLayerSpec =
      this.getViewModel().getData().ckOlLayerConnection[offering.getType()];

    if (Ext.isEmpty(ckLayerSpec)) {
      Ck.error(
        "Layer of type " +
          offering.getType() +
          " is not supported by Chinook 2."
      );
    } else {
      switch (offering.getType()) {
        case "osm":
          olSourceOptions = {
            layer: "osm",
          };
          break;

        case "wms":
          mainOperation = offering.getOperation("GetMap");
          olSourceOptions = {
            url: mainOperation.getUrl(),
            params: mainOperation.getParams(),
            projection: mainOperation.getSrs(),
          };
          break;

        case "wmts":
          mainOperation = offering.getOperation("GetTile");
          params = mainOperation.getParams();

          // get grid origin from layer extent or context extent
          var origin =
            layer.getExtension("topLeftCorner") ||
            ol.extent.getTopLeft(layer.getExtent() || owc.getExtent());
          if (Ext.isArray(origin)) {
            origin = origin.map(parseFloat);
          }
          if (Ck.getOption("mapcacheOffset")) {
            var offset = Ck.getOption("mapcacheOffset");
            if (Ext.isArray(offset) && offset.length == 2) {
              origin = origin.map(function (num, idx) {
                return num + offset[idx];
              });
            }
          }

          // get resolution from main view. need inverse order
          var resolutions =
            layer.getExtension("resolutions") || owc.getResolutions(false);

          // generate resolutions and matrixIds arrays for this WMTS
          var matrixIds = [];
          for (var z = 0; z < resolutions.length; ++z) {
            matrixIds[z] = z;
          }

          // OpenLayers 2 zoomOffset backward capability
          var zoomOffset = layer.getExtension().zoomOffset;
          if (typeof zoomOffset == "number") {
            var minZoom = resolutions[0];
            for (var i = 0; i < zoomOffset; i++) {
              matrixIds.push(matrixIds[matrixIds.length - 1] + 1);
              resolutions.splice(0, 0, minZoom * Math.pow(2, i + 1));
            }
          }

          olSourceOptions = {
            url: mainOperation.getUrl(),
            layer: params.LAYER,
            matrixSet: params.TILEMATRIXSET,
            format: params.FORMAT || "image/png",
            style: params.STYLE || "default",

            // TODO : use extent, resolutions different from main view.
            tileGrid: new ol.tilegrid.WMTS({
              origin: origin,
              resolutions: resolutions,
              matrixIds: matrixIds,
            }),
          };
          break;

        case "xyz":
          mainOperation = offering.getOperation("GetTile");

          // get resolution from params or view if not provided
          var resolutions = mainOperation.getResolutions();
          if (!resolutions || resolutions.length == 0) {
            resolutions = owc.getResolutions(false);
          }

          // get resolution from params or view if not provided
          var resolutions = mainOperation.getResolutions();
          if (!resolutions || resolutions.length == 0) {
            resolutions = owc.getResolutions(false);
          }

          // get extent from params or view if not provided
          var extent = mainOperation.getExtent();
          if (!extent || extent.length == 0) {
            extent = owc.getMaxExtent();
          }

          olSourceOptions = {
            url: mainOperation.getUrl(),
            tileGrid: new ol.tilegrid.TileGrid({
              resolutions: resolutions,
              extent: extent,
            }),
          };
          break;

        case "wfs":
          var format;
          mainOperation = offering.getOperation("GetFeature");

          switch (mainOperation.getType()) {
            case "xml":
              format = new ol.format.WFS();
              break;
            case "json":
              format = new ol.format.JSONFeature();
              break;
            case "text":
              format = new ol.format.TextFeature();
              break;
          }
          format.defaultDataProjection = ol.proj.get(mainOperation.getSrs());

          olSourceOptions = {
            projection: ol.proj.get(mainOperation.getSrs()),
            url: mainOperation.getHref(),
            format: format,
          };
          break;
        case "shapefile":
          var thisRef = this;
          var manifestPath = Ext.manifest.fileConf.appDirectory;
          mainOperation = offering.getOperation("GetMap");
          var shapefileDirectory = mainOperation.getUrl().toString();
          var urlSplit = mainOperation.getUrl().split("/");
          urlSplit = urlSplit.reverse();
          urlSplit = urlSplit.slice(0, 1);
          urlSplit = urlSplit.toString().split(".");
          urlSplit = urlSplit.slice(0, 1);
          var shapeName = urlSplit.toString();
          var fileName = shapeName + ".geojson";

          var fE = new Ck.utils.file.Reader({
            path: Ext.manifest.fileConf.geojsonDirectory + fileName,
            listeners: {
              fileExistsChecked: function (evt) {
                // New offering param for geojson layer display
                var config = {
                  data: {
                    code: "http://www.opengis.net/spec/owc-geojson/1.0/req/geojson",
                    srs: offering.getSrs(),
                    shape: true,
                    operations: [
                      {
                        code: "GetMap",
                        href:
                          manifestPath +
                          Ext.manifest.fileConf.geojsonDirectory +
                          fileName +
                          "?SRS=" +
                          offering.getSrs(),
                        method: "GET",
                        type: "application/json",
                      },
                    ],
                  },
                  owsLayer: layer,
                };
                var geojsonOffering = new Ck.format.OWSContextLayerOffering(
                  config
                );
                layer.setOfferings([geojsonOffering]);

                if (evt.data.exists) {
                  var olSource = thisRef.createSource(
                    geojsonOffering,
                    layer,
                    owc
                  );
                  thisRef.attachLayer(
                    ckLayerSpec,
                    olSource,
                    geojsonOffering,
                    layer,
                    owc
                  );
                } else {
                  var shapePath = manifestPath + shapefileDirectory;
                  shp(shapePath).then(function (geojson) {
                    // convert geojson to defined projection
                    var geojsonFeat = new ol.format.GeoJSON();

                    var olFeat = geojsonFeat.readFeatures(geojson, {
                      dataProjection: "EPSG:4326", // !!! shapefile2js transforms to WGS84 no matter what
                      featureProjection: offering.getSrs(),
                    });

                    var geojsonProj = geojsonFeat.writeFeaturesObject(olFeat, {
                      dataProjection: offering.getSrs(),
                      featureProjection: offering.getSrs(),
                    });

                    geojsonProj.crs = {
                      type: "name",
                      properties: { name: offering.getSrs() },
                    };
                    thisRef.saveJsonFile(
                      ckLayerSpec,
                      fileName,
                      JSON.stringify(geojsonProj),
                      geojsonOffering,
                      layer,
                      owc
                    );
                  });
                }
              },
            },
          });
          fE.fileExists();
          olSourceOptions = false;

          break;

        case "geojson":
          Operation = offering.getOperation("GetMap");
          olSourceOptions = {
            url: Operation.getUrl(),
            format: new ol.format.GeoJSON(),
          };
          break;
      }

      if (olSourceOptions) {
        var olSource = Ck.create(
          "ol.source." + ckLayerSpec.source,
          olSourceOptions
        );

        // For vector layer only, if we want a clustered representation
        var cluster = layer.getExtension("cluster");
        if (cluster) {
          // TODO : check if scope is ok with N layers
          var olSrcVector = olSource;
          var dist = cluster.distance || 60;
          olSource = new ol.source.Cluster({
            distance: dist,
            source: olSrcVector,
          });
        }
      }
    }
    Ext.apply(olSource, olSourceAdditional);
    return olSource;
  },

  /**
   * Get the layer group corresponding to the path
   * 3 cases :
   *  - path == ""		-> root layer group
   *  - path == "foo"		-> child of root
   *  - path == "foo/bar"	-> sub-group
   *
   * @param {String}
   * @param {Boolean} False to return false if group doesn't exist. Create it otherwise
   * @return {ol.layer.Group}
   */
  getLayerGroup: function (path, autoCreate) {
    var lyrGroup,
      backPath = path;
    if (path == "") {
      var lyrGroup = this.getOlMap().getLayerGroup();
    } else {
      var layers, parentGroup;
      var paths = path.split("/");
      var groupName = paths.pop();

      // Create parent group recursively
      if (paths.length > 0) {
        parentGroup = this.getLayerGroup(paths.join("/"), autoCreate);
      } else {
        parentGroup = this.getLayerGroup("", autoCreate);
      }

      if (!Ext.isEmpty(parentGroup)) {
        // Now find the group
        var layers = parentGroup.getLayers().getArray();
        for (var i = 0; i < layers.length && Ext.isEmpty(lyrGroup); i++) {
          if (
            layers[i] instanceof ol.layer.Group &&
            layers[i].get("title") == groupName
          ) {
            lyrGroup = layers[i];
          }
        }

        // Layer group doesn't exist. Create it
        if (Ext.isEmpty(lyrGroup) && autoCreate !== false) {
          var lyrGroup = Ck.create("ol.layer.Group", {
            title: groupName,
            path: backPath,
            group: parentGroup,
          });
          this.relayMapEvents(lyrGroup);
          parentGroup.getLayers().insertAt(0, lyrGroup);
        }
      }
    }

    return lyrGroup;
  },

  /**
   * Relay add and remove layer events
   * @param {ol.layer.Group}
   */
  relayMapEvents: function (olGroup) {
    // Relay olMap events
    olGroup.getLayers().on(
      "add",
      function (colEvent) {
        if (
          Ck.functionInStackTrace(Ck.legend.Controller.prototype.onLayerMove, 6)
        ) {
          return;
        }
        var layer = colEvent.element;
        var col = colEvent.target;
        var idx = col.getArray().indexOf(layer);

        // Alias to get extension property directly
        layer.getExtension = function (key) {
          return this.ckLayer && Ext.isFunction(this.ckLayer.getExtension)
            ? this.ckLayer.getExtension(key)
            : undefined;
        };
        this.fireEvent("addlayer", layer, col.getArray().length - idx - 1);
      },
      this
    );
    olGroup.getLayers().on(
      "remove",
      function (colEvent) {
        if (
          Ck.functionInStackTrace(Ck.legend.Controller.prototype.onLayerMove, 6)
        ) {
          return;
        }
        var layer = colEvent.element;
        this.fireEvent("removelayer", layer);
      },
      this
    );
  },

  /**
   * Load the context. Called by initContext.
   * @param {String} The name of the context to load.
   * @return {Object} The OWS Context.
   * @protected
   */
  getContext: function (contextName) {
    if (contextName !== false) {
      Cks.get({
        url: this.getFullUrl(contextName),
        scope: this,
        success: function (response) {
          var owc = Ext.decode(response.responseText);
          this.initContext(owc);
        },
        failure: function (response, opts) {
          Ck.error(
            'Error when loading "' +
              contextName +
              '" context !. Loading the default context...'
          );
          this.getContext("ck-default");
        },
      });
    }
  },

  /**
   * Bind the map with the model. Update the model on map moveend event.
   * @param {ol.Map} olMap
   * @protected
   */
  bindMap: function (olMap) {
    var v = this.getView();
    var vm = this.getViewModel();

    v.setMap(olMap);

    var p = v.getCoordPrecision();
    var olv = olMap.getView();

    var proj = olv.getProjection().getCode();
    var units = olv.getProjection().getUnits();
    vm.set("olview.projection.code", proj);
    vm.set("olview.projection.units", units);

    olMap.on("moveend", function (e) {
      var c = olv.getCenter();
      vm.set("olview.center", c);

      var res = olv.getResolution();
      vm.set("olview.resolution", res);

      var rot = olv.getRotation();
      vm.set("olview.rotation", rot);

      var extent = olv.calculateExtent(olMap.getSize());
      var bl = ol.extent.getBottomLeft(extent);
      var tr = ol.extent.getTopRight(extent);
      vm.set("extent", [
        ol.coordinate.format(bl, "{x}", p),
        ol.coordinate.format(bl, "{y}", p),
        ol.coordinate.format(tr, "{x}", p),
        ol.coordinate.format(tr, "{y}", p),
      ]);

      var z = olv.getZoom();
      vm.set("olview.zoom", z);
    });

    var z = olv.getZoom();
    vm.set("olview.zoom", z);
  },

  /**
   * Getter for the viewModel. See Ck.map.Model for the list of avaible configs.
   *
   *		 ckmap.get('center')
   *
   * @param {String} property The parameter to retrieve
   * @return {Object/Array/String}
   */
  get: function (property) {
    return this.getViewModel().get(property);
  },

  /**
   * Setter for the viewModel. See Ck.map.Model for the list of avaible configs.
   *
   *		 ckmap.set('center', [10, 10])
   *
   * @param {String} property The parameter to update
   * @param {String} value The value
   */
  set: function (property, value) {
    return this.getViewModel().set(property, value);
  },

  /**
   * Get the map associated with the controller.
   * @return {ol.Map} The Ol map
   */
  getOlMap: function () {
    return this.getView().getMap();
  },

  /**
   * Get the Ol view associated with this map..
   * @return {ol.View} The view that controls this map.
   * @protected
   */
  getOlView: function () {
    return this.getOlMap().getView();
  },

  /**
   *
   */
  getLegend: function () {
    return this.legend;
  },

  /**
   * Get the map projection.
   * @return {ol.proj.Projection} proj
   */
  getProjection: function () {
    return this.getOlView().getProjection();
  },

  /**
   * Get the center of the current view.
   */
  getCenter: function () {
    return this.getOlView().getCenter();
  },

  /**
   * Set the center of the current view.
   * @param {ol.Coordinate} center An array of numbers representing an xy coordinate. Example: [16, 48].
   */
  setCenter: function (c) {
    return this.getOlView().setCenter(c);
  },

  /**
   * Set the resolution for this view.
   * @param {Number} res The resolution of the view.
   */
  setResolution: function (res) {
    return this.getOlView().setResolution(res);
  },

  /**
   * Set the rotation for this view.
   * @param {Number} rot The rotation of the view in radians.
   */
  setRotation: function (rot) {
    return this.getOlView().setRotation(rot);
  },

  /**
   * Get the current map extent.
   */
  getExtent: function () {
    return this.getOlView().calculateExtent(this.getOlMap().getSize());
  },

  /**
   * Fit the map view to the passed extent.
   * @param {ol.Extent} extent An array of numbers representing an extent: [minx, miny, maxx, maxy].
   */
  setExtent: function (extent) {
    return this.getOlView().fit(extent, this.getOlMap().getSize());
  },

  /**
   * Get the current zoom level. Return undefined if the current resolution is undefined or not a "constrained resolution".
   * @return {Number} zoom
   */
  getZoom: function () {
    return this.getOlView().getZoom();
  },

  /**
   * Zoom to a specific zoom level.
   * @param {Number} zoom The zoom level 0-n
   */
  setZoom: function (zoom) {
    return this.getOlView().setZoom(zoom);
  },

  /**
   * Recursive function to return all layers
   * @param {ol.layer.Group}
   * @return {Array}
   */
  getAllLayers: function (lyrGrp) {
    var col = lyrGrp.getLayers().getArray();
    var res = new Array();
    for (var i = 0; i < col.length; i++) {
      if (col[i] instanceof ol.layer.Group) {
        res = res.concat(this.getAllLayers(col[i]));
      } else {
        res.push(col[i]);
      }
    }
    return res;
  },

  /**
   * Get the collection of layers associated with this map.
   * @param {Function/undefined} Function with 1 param of ol.layer. Return true to add the layer to the result array
   * @return {ol.Collection} If no function was passed so all layers are returned
   */
  getLayers: function (fct) {
    var layers = new ol.Collection(
      this.getAllLayers(this.getOlMap().getLayerGroup())
    );
    var res;
    if (Ext.isEmpty(fct)) {
      res = layers;
    } else {
      res = new ol.Collection();
      layers.forEach(function (lyr) {
        if (fct(lyr)) {
          res.push(lyr);
        }
      });
    }
    return res;
  },

  /**
   * Get a layer according the passed function
   * @param {Function}
   * @return {ol.Layer/undefined}
   */
  getLayer: function (fct) {
    var layers = this.getLayers().getArray();

    for (var i = 0; i < layers.length; i++) {
      if (fct(layers[i])) {
        return layers[i];
      }
    }

    return undefined;
  },

  /**
   * Get a layer by ID.
   * @param {String}
   * @return {ol.Layer/undefined}
   */
  getLayerById: function (id) {
    return this.getLayer(function (lyr) {
      return lyr.get("id") == id;
    });
  },

  /**
   *
   */
  getLayersStore: function () {
    var res = [];
    this.getLayers().forEach(function (lyr) {
      // TODO improve true layer detection
      if (lyr.getProperties().title) {
        res.push({
          id: lyr.get("title"),
          data: lyr,
        });
      }
    });
    return res;
  },

  /**
   * Return true if at least one layers is loading. False otherwise
   */
  isLayerLoading: function () {
    return this.layersAreLoading;
  },

  /**
   *	Resize the map when the view is resized.
   * Render the map if it's not rendered (first call)
   * @protected
   */
  resize: function () {
    var v = this.getView();
    var m = this.getOlMap();
    if (!this.rendered) {
      m.setTarget(v.body.id);
      this.rendered = true;

      // Fire map ready when it's rendered
      Ck.log("fireEvent ckmapReady");
      this.fireEvent("ready", this);
      Ext.GlobalEvents.fireEvent("ckmapReady", this);

      this.initContext();
    } else {
      m.updateSize();
    }
  },

  /**
   * Reset the current view to initial extend
   */
  resetView: function () {
    this.setExtent(this.originOwc.getExtent());
  },

  redraw: function () {
    this.getLayers().forEach(function (layer) {
      var source = layer.getSource();
      if (source.getParams && source.updateParams) {
        var params = source.getParams();
        source.updateParams(params);
      }
    });
  },

  /**
   * Apply the given function to all layers of the map
   */
  applyFunction: function (fct) {
    this.getLayers().forEach(fct);
  },

  applyEffect: function (effectName, layer) {
    var kernel = Ck.normalizeKernel(effectName);
    if (!kernel) {
      return false;
    }

    var applyEffect = function (layer) {
      layer.on("postcompose", function (event) {
        Ck.convolve(event.context, kernel);
      });
    };

    if (layer) {
      applyEffect(layer);
    } else {
      this.applyFunction(applyEffect);
    }
  },

  /**
   * @param {ol.layer.Base}
   */
  /*layerInRange: function(layer) {
		var inRange = false;
		if(layer.ckLayer) {
			var res = this.getOlView().getResolution();
			inRange = (layer.ckLayer.getMaxResolution() > res && layer.ckLayer.getMinResolution() < res);
		}
		return inRange;
	},*/

  /**
   * @param {ol.layer.Base}
   */
  layerInRange: function (layer) {
    var inRange = true;
    if (layer.ckLayer) {
      var res = this.getOlView().getResolution();

      var maxRes = layer.ckLayer.getMaxResolution();
      var minRes = layer.ckLayer.getMinResolution();
      inRange =
        (maxRes === undefined || maxRes > res) &&
        (minRes === undefined || minRes < res);
    }
    return inRange;
  },

  /**
   *	Function saveFeatures
   *	Save geoJson object in geojson file
   **/
  saveJsonFile: function (
    ckLayerSpec,
    fileName,
    geojson,
    geoOffering,
    layer,
    owc
  ) {
    if (!fileName) return;
    var thisRef = this;
    var manifestPath = Ext.manifest.fileConf.appDirectory;
    var fileWriter = new Ck.utils.file.Writer({
      path: Ext.manifest.fileConf.geojsonDirectory + fileName,
      listeners: {
        dataWritten: function (evt) {
          if (evt.target.error !== undefined && evt.target.error) {
            Ck.error("Error while recording. ", evt.target.error);
          } else {
            //Ck.error('File saved succesfully.');
            // New offering param for geojson layer display
            var config = {
              data: {
                code: "http://www.opengis.net/spec/owc-geojson/1.0/req/geojson",
                srs: geoOffering.getSrs(),
                shape: geoOffering.getIsFromShape(),
                operations: [
                  {
                    code: "GetMap",
                    href:
                      manifestPath +
                      "GEOJSON/" +
                      fileName +
                      "?SRS=" +
                      geoOffering.getSrs(),
                    method: "GET",
                    type: "application/json",
                  },
                ],
              },
              owsLayer: layer,
            };
            var geojsonOffering = new Ck.format.OWSContextLayerOffering(config);
            layer.setOfferings([geojsonOffering]);
            // then load the geojson layer
            var olSource = thisRef.createSource(geoOffering, layer, owc);
            thisRef.attachLayer(
              ckLayerSpec,
              olSource,
              geojsonOffering,
              layer,
              owc
            );
          }
        },
      },
    });
    fileWriter.writeData(geojson, Ck.utils.file.Writer.MODE.ERASE);
  },

  /**
   *	Function attachLayer
   *	Attach layer on the fly
   **/
  attachLayer: function (ckLayerSpec, olSource, geojsonOffering, layer, owc) {
    //Layer creation
    var extent = layer.getExtent() || owc.getExtent();
    var style = layer.getExtension("style");
    var layerId = layer.getId();
    olStyle = Ck.map.Style.getStyleFromConfig(style, layerId, false);
    var pathlayer = layer.getExtension("path") || "";
    lyrGroup = this.getLayerGroup(pathlayer);

    // Test sur integration de sources
    var sources = {};
    var off,
      offs = geojsonOffering;
    for (var i = 1; i < offs.length; i++) {
      off = offs[i];
      if (!Ext.isArray(sources[off.getType()])) {
        sources[off.getType()] = [];
      }
      sources[off.getType()].push(this.createSource(off, layer, owc));
    }

    olLayer = Ck.create("ol.layer." + ckLayerSpec.layerType, {
      id: layer.getId(),
      title: layer.getTitle(),
      source: olSource,
      sources: sources,
      group: lyrGroup,
      extent: extent,
      style: olStyle,
      visible: layer.getVisible(),
      zIndex: layer.getZIndex(),
      path: pathlayer,
      minResolution: layer.getMinResolution(),
      maxResolution: layer.getMaxResolution(),
    });
    if (!Ext.isEmpty(olLayer)) {
      if (olLayer) {
        olLayer.ckLayer = layer;
        lyrGroup
          .getLayers()
          .insertAt(lyrGroup.getLayers().getLength(), olLayer);
      }
    }
  },

  /**
   *	Function addFolder
   *	Add layers from a folder source
   **/
  addFolder: function (folderLayer, owc) {
    var offering = folderLayer.getOfferings()[0];
    var thisRef = this;
    var mainOperation = offering.getOperation("GetMap");
    var shapefileDirectory = mainOperation.getUrl().toString();

    var fileReader = new Ck.utils.file.Reader({
      path: shapefileDirectory,
      listeners: {
        directoryListed: function (res) {
          if (res.data.entries && res.data.entries.length > 0) {
            var entries = res.data.entries;

            for (var i = 0; i < entries.length; i++) {
              var entry = entries[i];
              var layerName = entry.name.split(".")[0];

              var layerConfig = {
                data: {
                  type: "Feature",
                  id: layerName,
                  properties: {
                    title: layerName,
                    updated: "2015-07-22T00:00:00Z",
                    content: "",
                    publisher: "Chinook Server",
                    active: folderLayer.getVisible(),
                    zIndex: folderLayer.getZIndex(),
                    offerings: [
                      {
                        code: "http://www.opengis.net/spec/owc-shapefile/1.0/req/shapefile",
                        operations: [
                          {
                            code: "GetMap",
                            href:
                              shapefileDirectory +
                              "/" +
                              layerName +
                              "?SRS=" +
                              offering.getSrs(),
                            method: "GET",
                            type: "application/json",
                          },
                        ],
                      },
                    ],
                    extension: {
                      path: folderLayer.getExtension("path"),
                      editable: folderLayer.getExtension("editable"),
                      style: folderLayer.getExtension("style"),
                    },
                  },
                },
              };

              var layer = new Ck.format.OWSContextLayer(layerConfig);
              thisRef.addLayer(layer, owc);
            }
          }
        },
      },
    });
    fileReader.readDir("shp");
  },

  /**
   *	Function getVectorFeatureBy
   *	Return the first feature with a specific value of a field
   **/
  getVectorFeatureBy: function (layerSource, field, value) {
    var featToReturn = null;

    layerSource.forEachFeature(function (feature) {
      if (feature.get(field) == value) {
        featToReturn = feature;
        return feature;
      } else {
        return false;
      }
    }, this);

    return featToReturn;
  },
});
