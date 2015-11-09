/**
 * ViewController used to manage the Import Panel of OSM Import.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportimport',
	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		this.control({
			"ckosmimportimport button#cancel": {
				click: this.cancel
			},
			"ckosmimportimport treepanel#osmtags-tree": {
				load: this.onTreeOsmTagsLoad,
				checkchange: this.onTreeOsmTagsChange
			},
			"ckosmimportimport button#btnSelection": {
				click: this.onSelectionClick
			}
		});
		
		/**
		 * Init of the Map Elements for Selection
		 */
		this.selectionCoords = []; // stores the coordinates of the selection.
		this.olMap = Ck.getMap().getOlMap();
		this.selectionSource = new ol.source.Vector({wrapX:false});
		this.selectionVector = new ol.layer.Vector({
			source: this.selectionSource,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
			        color: 'rgba(255, 255, 255, 0.2)'
			    }),
			    stroke: new ol.style.Stroke({
			        color: '#ffcc33',
			        width: 2
			    }),
			    image: new ol.style.Circle({
			        radius: 7,
			        fill: new ol.style.Fill({
				        color: '#ffcc33'
			        })
			    })
			})
		});
		this.olMap.addLayer(this.selectionVector);
		this.mapInteraction = undefined;
	},
		
	/**
	 * Hide the import panel
	 */
	cancel: function() {
		this.getView().openner.close();
	},
	
	/**
	 * Method launched once the tree store is loaded and displayed
	 * Adds a checkbox to each leaf in the tree used to display OSM Tags.
	 */
	onTreeOsmTagsLoad: function(tree) {
		tree.getRootNode().cascadeBy(function(node) {
			if (node.isLeaf()) {
				node.set("checked", false);
			}
		});
	},
	
	/**
	 * Method launched when a node in the OSM Tags Tree is checked or unchecked.
	 * - update the list of checked tags in the ViewModel.
	 */
	onTreeOsmTagsChange: function(node, checked) {
		var vm = this.getViewModel();
		var checkedTags = vm.data.checkedTags;
		var obj = {
			text: node.data.text,
			tag: node.data.tag
		};
		if (checked) {
			checkedTags.push(obj);
		} else {
			var index = -1;
			for (var i = 0; i < checkedTags.length; i++) {
				if (checkedTags[i].tag === obj.tag) {
					index = i;
				}
			}
			if (index > -1) {
				checkedTags.splice(index, 1);
			}
		}
		var textexpert = checkedTags.map(function(a) {return a.tag;}).join(";");
		this.lookupReference("tagsexpert").setValue(textexpert);
	},
	
	/**
	 * Method launched when user clicks on the "Selection" button.
	 */
	onSelectionClick: function(btn) {
		this.getView().openner.collapse();
		this.prepareSelector();
	},
	
	/**
	 * Method called once the user has finished its selection of a geographical zone.
	 * - Converts the coordinates
	 * - Stores the coordinates
	 */
	onSelectionDone: function(evt) {
		var transformGeometry = new ol.geom.Polygon(evt.feature.getGeometry().getCoordinates());
		this.selectionCoords = transformGeometry.transform(this.olMap.getView().getProjection(), 'EPSG:4326').getCoordinates()[0];
	},
	
	/**
	 * Prepare the selector for the geographical zone according user's configuration.
	 */
	prepareSelector: function() {
		var selectType = Ext.getCmp("selectionMode").items.get(0).getGroupValue();
		var draw, geometryFunction, maxPoints;
		var self = this;
		if (selectType === "rectangle") {
			maxPoints = 2;
			selectType = "LineString";
			geometryFunction = function(coordinates, geometry) {
				self.selectionSource.clear();
				if (!geometry) {
					geometry = new ol.geom.Polygon(null);
				}
				var start = coordinates[0];
				var end = coordinates[1];
				geometry.setCoordinates([
					[start, [start[0], end[1]], end, [end[0], start[1]], start]
				]);
				return geometry;
			};
		} else if (selectType === "polygone") {
			maxPoints = 100;
			selectType = "Polygon";
			geometryFunction = function(coordinates, geometry) {
				self.selectionSource.clear();
				if (!geometry) {
					geometry = new ol.geom.Polygon(null);
				}
				geometry.setCoordinates(coordinates);
				return geometry;
			};
		}
		draw = new ol.interaction.Draw({
			source: self.selectionSource,
			type: /** @type {ol.geom.GeometryType} */ (selectType),
			geometryFunction: geometryFunction,
			maxPoints: maxPoints
        });
		draw.on('drawend', this.onSelectionDone, this);
		this.olMap.removeInteraction(this.mapInteraction);
		this.mapInteraction = draw;
        this.olMap.addInteraction(this.mapInteraction);
	}
});
