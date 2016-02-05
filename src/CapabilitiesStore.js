/**
 *
 */
Ext.define('Ck.CapabilitiesStore', {
	extend: "Ext.data.Store",
	alternateClassName: 'CkCapabilitiesLoader',

	requires: [
		"Layer",
		"Context"
	],
	
	config: {
		/**
		 * Configuration du template d'un getCapabilities du type en cours
		 */
		nodePath: null,
		nodeName: null,

		/**
		 * The data type returned by the getCapabilities requets
		 */
		type: "Xml",

		/**
		 * Le service dont il faut parser le getCapabilities (wfs, wms ou wmc)
		 */
		service: "WMC",

		/**
		 * True to build non-structures result
		 * @todo To implement
		 */
		flatStore: false,

		/**
		 * True to keep empty folder displayed
		 */
		keepEmptyFolder: false,

		/**
		 * Vrai pour garder les générations pour lesquels il n'y a qu'un parent
		 */
		keepSingleParent: false,

		/**
		 * Template for displayed text (must be a combination of fields)
		 */
		template: '{Title}',

		version: null,

		/**
		 * Configuration des template des getCapabilities
		 */
		capabilitiesConfig: {
			GEOPORTAIL: {
				nodePath: 'Contents',
				nodeName: 'Layer'
			},
			POSTGIS: {
				nodePath: 'Capability/Layer',
				nodeName: 'Layer'
			},
			WMS: {
				nodePath: 'Capability/Layer',
				nodeName: 'Layer'
			},
			WFS: {
				nodePath: 'FeatureTypeList',
				nodeName: 'FeatureType'
			},
			WMC: {
				nodePath: 'Capability',
				nodeName: 'Context',
				model: "Context"
			},
			USER: {
				nodePath: 'Capability',
				nodeName: 'User'
			},
			DATASOURCE: {
				nodePath: 'Capability',
				nodeName: 'Datasource'
			}
		}
	},



	constructor: function(config) {
		config = (Ext.isEmpty(config))? {} : config;
		
		switch(config.service) {
			case "WMC":
				config.model = "Context";
				break;
			default:
				config.model = "Layer";
		}
		
		this.callParent([config]);
		
		var reader = Ck.create("Ext.data.reader." + this.type);

		if(this.getNodePath() === null || this.getNodeName() === null) {
			this.setNodePath(this.getCapabilitiesConfig()[this.getService()].nodePath);
			this.setNodeName(this.getCapabilitiesConfig()[this.getService()].nodeName);
		}

		Ext.override(reader, {
			extractData: this.parseCapabilities.bind(this)
		});

		Ext.apply(this.proxy, {
			model: "Layer",
			reader: reader
		});
	},
	
	setTemplate: function(template) {
		this.template = new Ext.Template(template);
	},
	
	setService: function(service) {
		service = service.toUpperCase();
		service = (service == "CHINOOK")? "WMS" : service;
		this.service = service;
	},

	/**
	 * When XHR query success it will be called with the response
	 */
	parseCapabilities: function(root, readOptions) {
		var capabilities = Ext.DomQuery.select(this.getNodePath(), root);
		var nodeName = this.getNodeName();
		var data, aData = [], mData = [];

		if(capabilities.length == 0) {
			// Error, no root capabilities
			return false;
		}

		capabilities = capabilities[0];

		// Check s'il n'y a pas une erreur
		var exceptionNode = Ext.DomQuery.select("ServiceException", root);
		if(!Ext.isEmpty(exceptionNode[0])) {
			return false;
		}

		var attrVersion = root.getAttribute("version");
 		if(!Ext.isEmpty(attrVersion) && typeof attrVersion == "string") {
			this.version = attrVersion;
		}


		var record, childNodes = capabilities.childNodes;

		switch(this.getService()) {
			case "POSTGIS" :
			case "GEOPORTAIL" :
			case "WMS" :
				this.projList = [];

				for(var i=0;i< childNodes.length;i++) {
					switch(childNodes[i].tagName) {
						case "SRS":
							proj = childNodes[i].childNodes[0].nodeValue.split(" ");
							for(var x=0; x<proj.length; x++) {
								this.projList.push(proj[x]);
							}
							break;
						case "CRS":
							proj = childNodes[i].childNodes[0].nodeValue.split(" ");
							for(var x=0; x<proj.length; x++) {
								var tmpProjection = proj[x];
								if(tmpProjection === "CRS:84") {//si ca contient CRS:84
									tmpProjection = "EPSG:4326";//CRS:84 is equivalent to EPSG:4326
								}
								this.projList.push(tmpProjection);
							}
							break;
					}
				}

				record = this.getWMSRecord(capabilities, [], this.projList);
				mData.push(record);
			break;
			case "WFS" :
				for(var i = 0; i < childNodes.length; i++) {
					if(childNodes[i].tagName == nodeName)
						aData.push(this.getWFSAttributes(childNodes[i]));
				}
			break;
			case "USER" :
				for(var i = 0; i < childNodes.length; i++) {
					if(childNodes[i].tagName == nodeName)
						aData.push(this.getUserAttributes(childNodes[i]));
				}
			break;
			default:
			case 'WMC' :
			case "DATASOURCE" :
			case "COMPONENT" :
				for(var i = 0; i < childNodes.length; i++) {
					if(childNodes[i].tagName == nodeName)
						mData.push(this.getDefaultRecord(childNodes[i]));
				}
			break;
		}

		return mData ;
	},

	/**
	 * @method getDefaultRecord
	 * Récupère les attributs d'un getCapbilities simple : <br/>
	 * - pas de parents / enfants
	 * - pas de traitement sur les attributs
	 *
	 * @return Object Objet contenant les attributs de l'élément
	 */
	getDefaultRecord: function(data) {
		var attr = {
			leaf: true
		};
		if(this.nodeControls) {
			attr.controls = this.nodeControls ;
		}
		if(this.uiProvider) {
			attr.uiProvider = this.uiProvider;
		}

		// Boucle sur les attributs
		for(var i=0;i< data.childNodes.length;i++) {
			var child = data.childNodes[i];
			if(typeof child.tagName == 'string' && child.tagName != this.getNodeName()) {
				var textContent = Ext.DomQuery.selectValue('', child, ''); // assure compatibilite FF, IE...
				attr[child.tagName] = textContent;
			}
		}

		// Applique le template qui formate le texte affiché
		attr.Text = this.getTemplate().applyTemplate(attr);
		
		return new window[this.getCapabilitiesConfig()[this.getService()].model](attr);
	},

	/**
	 * @method getUserAttributes
	 * Récupère les attributs d'un contexte à partir d'un noeud XML
	 *
	 * @return Object Objet contenant les attributs de l'élément
	 */
	getUserAttributes: function(data) {
		var attr = {};
		if(this.nodeControls) {
			attr.controls = this.nodeControls ;
		}
		if(this.uiProvider) {
			attr.uiProvider = this.uiProvider;
		}

		// Boucle sur les attributs
		for(var i=0;i< data.childNodes.length;i++) {
			var child = data.childNodes[i];
			if(typeof child.tagName == 'string' && child.tagName != this.getNodeName()) {
				var textContent = Ext.DomQuery.selectValue('', child, ''); // assure compatibilite FF, IE...

				switch(child.tagName) {
					case "Login" :
					case "Name" :
					case "Firstname" :
						attr[child.tagName] = textContent;
						break;
					case "Isgroup" :
						attr["Isgroup"] = (textContent == "true");
				}
			}
		}

		// Applique le template qui formate le texte affiché
		attr.text = this.getTemplate().applyTemplate(attr);

		// Si l'élément traité possède des enfants alors on appele cette fonction récursivement
		if(!Ext.isEmpty(Ext.DomQuery.selectNode(this.getNodeName(), data))) {
			// Groupe de couche, on boucle + appel récursif
			attr.children = data.childNodes;
			attr.Layer = data.childNodes;
			// for(var i=0;i< data.childNodes.length;i++) {
				// var cu = data.childNodes[i];
				// if(cu.tagName == this.getNodeName()) {
					// attr.children.push(this.getUserAttributes(cu));
				// }
			// }
		} else {
			attr.leaf = true;
		}



		return attr;
	},

	/**
	 * @method getWMSAttributes
	 * Récupère les attributs d'un élément, que ce soit un contexte ou une couches
	 *
	 * @return Object Objet contenant les attributs de l'élément
	 */
	getWMSRecord: function(data, curGroup, projList) {
		curGroup = curGroup || [];

		var attr = {
			leaf: false
		};

		if(!Ext.isEmpty(projList)) {
			attr["SRS"] = projList;
		}

		if(this.nodeControls) {
			attr.controls = this.nodeControls ;
		}
		if(this.uiProvider) {
			attr.uiProvider = this.uiProvider;
		}

		// Boucle sur les attributs
		for(var i=0;i< data.childNodes.length;i++) {
			var child = data.childNodes[i];
			if(typeof child.tagName == 'string' && child.tagName != this.getNodeName()) {
				var textContent = Ext.DomQuery.selectValue('', child, ''); // assure compatibilite FF, IE...

				switch(child.tagName) {
					case "Title":
						attr["Group"] = curGroup.slice(0);
						curGroup.push(textContent);

						// Gestion de l'arborescence => liste des groupes
						if(attr[child.tagName]) {
							if(Ext.isArray(attr[child.tagName])) {
								attr[child.tagName].push(textContent);
							} else {
								var v = attr[child.tagName];
								attr[child.tagName] = new Array();
								attr[child.tagName].push(v);
								attr[child.tagName].push(textContent);
							}
						} else {
							attr[child.tagName] = textContent;
						}
						break;

					case "BoundingBox":
					case "LatLongBoundingBox":
						if(Ext.isEmpty(attr["BoundingBox"])) {
							attr["BoundingBox"] = new Array();
						}
						var minx = child.attributes.getNamedItem("minx").value;
						var miny = child.attributes.getNamedItem("miny").value;
						var maxx = child.attributes.getNamedItem("maxx").value;
						var maxy = child.attributes.getNamedItem("maxy").value;

						if(child.tagName == "BoundingBox") {
							srs = (!Ext.isEmpty(child.attributes.getNamedItem("SRS")))? child.attributes.getNamedItem("SRS").value : "";
							if(Ext.isEmpty(srs)) {
								srs = (!Ext.isEmpty(child.attributes.getNamedItem("CRS")))? child.attributes.getNamedItem("CRS").value : "";
							}
						} else {
							srs = "EPSG:4326";
						}

						if(!Ext.isEmpty(srs)) {
							attr["BoundingBox"].push({
								bbox: minx + ',' + miny + ',' + maxx + ',' + maxy,
								srs: srs
							});
						}
						break;
					case "ScaleHint":
						attr['minResolution'] = child.attributes.getNamedItem("min").value;
						attr['maxResolution'] = child.attributes.getNamedItem("max").value;
						break;
					case "Attribution":
						var title = Ext.DomQuery.selectValue('Title', child, false);
						if(title) attr[child.tagName] = title;
						break;
					// Si l'attribut existe déjà on construit un tableau
					default:
					case "Name":
						if(attr[child.tagName]) {
							if(Ext.isArray(attr[child.tagName])) {
								attr[child.tagName].push(textContent);
							} else {
								var v = attr[child.tagName];
								attr[child.tagName] = new Array();
								attr[child.tagName].push(v);
								attr[child.tagName].push(textContent);
							}
						}else{
							attr[child.tagName] = textContent;
						}
						break;
					case "SRS":
					case "CRS":
						if(Ext.isEmpty(attr["SRS"])) {
							attr["SRS"] = [];
						}
						textContent = textContent.split(" ");
						attr["SRS"] = attr["SRS"].concat(textContent);
						break;
				}

				/* Normalement il n'y a que la BoundingBox qui peut apparaitre plusieurs fois
				// Si un attribut existe plusieurs fois on créé un tableau pour rassembler les occurnces (ex plusieurs SRS)
				if(attr[child.tagName]) {
					if(Ext.isArray(attr[child.tagName])) {
						attr[child.tagName].push(textContent);
					} else {
						var v = attr[child.tagName];
						attr[child.tagName] = new Array();
						attr[child.tagName].push(v);
						attr[child.tagName].push(textContent);
					}
				}else{
					attr[child.tagName] = textContent;
				}
				*/
			}
		}

		// Compatibilité avec Geoportail IGN
		if(!attr["Name"] && attr["Identifier"])
			attr["Name"] = attr["Identifier"];

		// On traite la BoundingBox. Elle peut être indiqué dans plusieurs projections
		if(attr["BoundingBox"] && attr["SRS"] && attr["BoundingBox"][attr["SRS"]])
			attr["BoundingBox"] = attr["BoundingBox"][attr["SRS"]];

		// Applique le template qui formate le texte affiché
		attr.text = this.getTemplate().applyTemplate(attr);

		var childToProcces = false;
		// Si l'élément traité possède des enfants alors on appele cette fonction récursivement
		if(!Ext.isEmpty(Ext.DomQuery.selectNode(this.getNodeName(), data))) {
			childToProcces = true;
		} else if(!attr.LayerType || (attr.LayerType != 'default' && attr.LayerType != 'union')) {
			curGroup.pop();
			attr.leaf = true;
		}

		var child, record = new Layer(attr);

		if(childToProcces) {
			record.data.children = [];
			// Groupe de couche, on boucle + appel récursif
			for(var i=0;i< data.childNodes.length;i++) {

				var cu = data.childNodes[i];
				if(cu.tagName == this.getNodeName()) {
					child = this.getWMSRecord(cu, curGroup.slice(0), attr["SRS"]);
					if(child != null) {
						record.childNodes.push(child);
						// Required to manage tree "tabulation"
						child.parentNode = record;

						// child.data.parentId = record.id;
						record.data.children.push(child.data);
					}
				}
			}
		}

		// Check if it's an empty folder. Possibility to didnt add it
		if(attr.leaf != true && !childToProcces && !this.getKeepEmptyFolder()) {
			return null;
		} else {
			return record;
		}
	},

	/**
	 * @method getWFSAttributes
	 * Récupère les attributs d'un élément, que ce soit un contexte ou une couches
	 *
	 * @return Object Objet contenant les attributs de l'élément
	 */
	getWFSAttributes: function(data, curGroup) {
		curGroup = curGroup || [];
		// Paramètre par défaut
		var attr = {
			"SRS": "EPSG:4326"
		};

		if(this.nodeControls) {
			attr.controls = this.nodeControls ;
		}
		if(this.uiProvider) {
			attr.uiProvider = this.uiProvider;
		}

		// Boucle sur les attributs
		for(var i=0;i< data.childNodes.length;i++) {
			var child = data.childNodes[i];
			if(typeof child.tagName == 'string' && child.tagName != this.getNodeName()) {
				var textContent = Ext.DomQuery.selectValue('', child, ''); // assure compatibilite FF, IE...

				switch(child.tagName) {
					case "Name":
						attr["Name"] = textContent;
						break;
					case "Title":
						attr["Group"] = curGroup.slice(0);
						curGroup.push(textContent);

						// Gestion de l'arborescence => liste des groupes
						if(attr[child.tagName]) {
							if(Ext.isArray(attr[child.tagName])) {
								attr[child.tagName].push(textContent);
							} else {
								var v = attr[child.tagName];
								attr[child.tagName] = new Array();
								attr[child.tagName].push(v);
								attr[child.tagName].push(textContent);
							}
						} else {
							attr[child.tagName] = textContent;
						}
						break;

					case "ows:WGS84BoundingBox":
						var upperCorner = child.getElementsByTagName("ows:UpperCorner");
						var lowerCorner = child.getElementsByTagName("ows:LowerCorner");
						if(upperCorner[0] && lowerCorner[0]) {
							upperCorner = upperCorner[0].innerHTML.replace(" ", ",");
							lowerCorner = lowerCorner[0].innerHTML.replace(" ", ",");
							attr["LatLongBoundingBox"] = lowerCorner + "," + upperCorner;
						}
						break;
					case "DefaultSRS":
					case "SRS":
						attr["SRS"] = child.innerHTML;
						break;
					case "BoundingBox":
					case "LatLongBoundingBox":
						if(Ext.isEmpty(attr["BoundingBox"])) {
							attr["BoundingBox"] = new Array();
						}
						var minx = child.attributes.getNamedItem("minx").value;
						var miny = child.attributes.getNamedItem("miny").value;
						var maxx = child.attributes.getNamedItem("maxx").value;
						var maxy = child.attributes.getNamedItem("maxy").value;

						if(child.tagName == "BoundingBox") {
							srs = (!Ext.isEmpty(child.attributes.getNamedItem("SRS")))? child.attributes.getNamedItem("SRS").value : "";
							if(Ext.isEmpty(srs)) {
								srs = (!Ext.isEmpty(child.attributes.getNamedItem("CRS")))? child.attributes.getNamedItem("CRS").value : "";
							}
						} else {
							srs = "EPSG:4326";
						}

						if(!Ext.isEmpty(srs)) {
							attr["BoundingBox"].push({
								bbox: minx + ',' + miny + ',' + maxx + ',' + maxy,
								srs: srs
							});
						}
						break;
					case "ScaleHint":
						attr['minResolution'] = child.attributes.getNamedItem("min").value;
						attr['maxResolution'] = child.attributes.getNamedItem("max").value;
						break;
					case "Attribution":
						var title = Ext.DomQuery.selectValue('Title', child, false);
						if(title) attr[child.tagName] = title;
						break;
				}
			}
		}

		// On reprojète la BoundingBox si : la BoundingBox n'est pas renseigné, la LatLongBoundingBox est renseigné et si la couche n'est pas en 4326
		if(!attr["BoundingBox"] && attr["LatLongBoundingBox"]) {
			if(attr["SRS"] == "EPSG:4326") {
				attr["BoundingBox"] = attr["LatLongBoundingBox"];
			} else {
				var bbox = attr["LatLongBoundingBox"].split(",");
				var fProj = new OpenLayers.Projection("EPSG:4326");
				var tProj = new OpenLayers.Projection(attr["SRS"]);
				bbox = new OpenLayers.Bounds(bbox[0], bbox[1], bbox[2], bbox[3]).transform(fProj, tProj, true);
				attr["BoundingBox"] = bbox.toString();
			}
			delete attr["LatLongBoundingBox"];
		}

		// Applique le template qui formate le texte affiché
		attr.text = this.getTemplate().applyTemplate(attr);

		// Couche simple
		curGroup.pop();
		attr.leaf = true ;

		return attr;
	}
});

/**
 * Tree store version to bind with a tree panel
 */
Ext.define("Ck.CapabilitiesTreeStore", {
	extend: "Ext.data.TreeStore",
	mixins: ["Ck.CapabilitiesStore"],

	/**
	 *
	 */
	constructor: function(config) {
		this.mixins["Ck.CapabilitiesStore"].constructor.apply(this, arguments);
		this.on("load", this.onLoad, this);
	},

	/**
	 * To replace abstract root with real capabilities root
	 */
	onLoad: function(store, records) {
		store.setRoot(records[0]);
		records[0].expand();
	}
});