/**
 *
 */
Ext.define('NodeCapability', {
    extend: 'Ext.data.Model',
    fields: [
        // { name: 'id', type: 'int', mapping: 'Id' },
        { name: 'text', type: 'string', mapping: 'Text' },
        { name: 'leaf', type: 'boolean', mapping: 'Leaf' },
        { name: 'Properties'},
        { name: 'expanded', defaultValue: true }
    ]
});

Ext.define('Ck.CapabilitiesLoader', {
	extend: 'Ext.data.proxy.Ajax',
	alias: "proxy.capabilitiesloader",
	
	requires: [
		'Ck'
	],
	
	config: {
		service: null,
		useDefaultXhrHeader: false,
		
		/**
		 * @notimplemented
		 * True to return flat data
		 * False to return hierarchized data (tipicaly for tree)
		 */
		flat: false,
		
		/**
		 * Format
		 */
		format: "Xml",
		
		/**
		 * Configuration du template d'un getCapabilities du type en cours
		 */
		nodePath: null,
		nodeName: null,
		
		/**
		 * Le service dont il faut parser le getCapabilities (wfs, wms ou wmc)
		 */
		service: "WMC",
		
		/**
		 * Vrai pour garder la racine
		 */
		keepRoot: false,
		
		/**
		 * Vrai pour garder les générations pour lesquels il n'y a qu'un parent
		 */
		keepSingleParent: false,
		
		template:'{Title}',
		nodeTextTagName:'Title',
		
		requestMethod: 'GET',
		preloadChildren: true,

		nodeControls: null,
		uiProvider: null,
		
		version: null
	},
	
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
			nodeName: 'Context'
		},
		USER: {
			nodePath: 'Capability',
			nodeName: 'User'
		},
		DATASOURCE: {
			nodePath: 'Capability',
			nodeName: 'Datasource'
		}
	},
	
	/**
	 * Before processing the response set the transform function and some other attributes
	 */
	processResponse: function(success, operation, request, response) {
		if(this.getNodePath() === null || this.getNodeName() === null) {
			this.setNodePath(this.capabilitiesConfig[this.getService()].nodePath);
			this.setNodeName(this.capabilitiesConfig[this.getService()].nodeName);
		}
		
		this.setReader(Ext.create("Ext.data.reader." + this.getFormat(), {
			// transform: this.transformFunction.bind(this),
			record: this.getNodeName()
		}));
		
		this.getReader().readRecords = this.readRecords[this.getService()].bind(this);
		
		this.callOverridden(arguments);
	},
	
	/**
	 *
	 */
	getRoot: function(capabilities) {
		var aData = [];
		
		if(typeof this.getTemplate() == 'string'){
			this.setTemplate(new Ext.Template(this.getTemplate()));
		}
		
		var node_path = this.nodePath.split("/");
		// On va chercher la racine des couches
		for(var i=0; i< (node_path.length - ((this.keepRoot)? 1 : 0)); i++) {
			capabilities = Ext.DomQuery.selectNode(node_path[i], capabilities);
			if(!capabilities)
				return aData;
		}
		
		// Remove tree level wich have only one child
		if(false && !this.getKeepSingleParent && this.getService() != "WMC") {
			var nbList = 1;
			
			while(nbList == 1) {
				nbList = 0;
				
				// Check if there are several layers list
				var nbList = 0;
				for(var i=0; (i < capabilities.childNodes.length && nbList < 2); i++){
					if(capabilities.childNodes[i] && capabilities.childNodes[i].tagName == this.nodeName)
						nbList++;
				}
				
				// If there are only one list, set it as root
				if(nbList==1)
					capabilities = Ext.DomQuery.selectNode(this.nodeName, capabilities);
			}
		}
		return capabilities;
		var childNodes = capabilities.childNodes;
		
		switch(this.getService()){
			case "WMS" :
				
			break;
			case "WFS" :
				for(var i = 0; i < childNodes.length; i++){
					if(childNodes[i].tagName == this.nodeName)
						aData.push(this.getWFSAttributes(childNodes[i]));
				}
			break;
		}
		
		return aData;
	},
	
	getAttributes: {
		WMS: function(data, curGroup, projList) {
			curGroup = curGroup || [];
			
			var attr = {};
			
			if(!Ext.isEmpty(projList)) {
				attr["SRS"] = projList;
			}
			
			if(this.nodeControls){
				attr.controls = this.nodeControls ; 
			}
			if(this.uiProvider){
				attr.uiProvider = this.uiProvider;	
			}
			
			// Boucle sur les attributs
			for(var i=0;i< data.childNodes.length;i++){
				var child = data.childNodes[i];
				if(typeof child.tagName == 'string' && child.tagName != this.nodeName){				
					var textContent = Ext.DomQuery.selectValue('', child, ''); // assure compatibilite FF, IE...
					
					switch(child.tagName) {
						case "Title":
							attr["Group"] = curGroup.slice(0);
							curGroup.push(textContent);
							
							// Gestion de l'arborescence => liste des groupes
							if(attr[child.tagName]){
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
							if(attr[child.tagName]){
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
					if(attr[child.tagName]){
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
			if(this.getTemplate()) {
				attr.text = this.getTemplate().applyTemplate(attr);
			} else {
				attr.text = Ext.DomQuery.selectValue(this.getNodeTextTagName(), data, '');
			}
			
			// Si l'élément traité possède des enfants alors on appele cette fonction récursivement
			if(!Ext.isEmpty(Ext.DomQuery.selectNode(this.nodeName, data))){
				// Groupe de couche, on boucle + appel récursif
				attr.children = [];
				for(var i=0;i< data.childNodes.length;i++){
					var cu = data.childNodes[i];
					if(cu.tagName == this.nodeName){
						attr.children.push(this.getWMSAttributes(cu, curGroup.slice(0), attr["SRS"]));
					}
				}	
			} else if(attr.LayerType && (attr.LayerType == 'default' || attr.LayerType == 'union')){
				// Cas d'un dossier ou d'une union vide
				attr.children = [];
			} else {
				// Couche simple
				curGroup.pop();
				attr.leaf = true ;
			}
			
			attr = {
				text: attr.text,
				leaf: attr.leaf,
				data: attr
			};
			
			delete attr.data.text;
			delete attr.data.leaf;
			
			return attr;
		}
	},
	
	readRecords: {
		WFS: function(data) {
			var res = [];
			var lyrList = data.getElementsByTagName("FeatureTypeList")[0];
			if(lyrList) {
				res = lyrList.getElementsByTagName("FeatureType");
			}
			return res;
		},
		/**
		 * @method getWMSAttributes
		 * Récupère les attributs d'un élément, que ce soit un contexte ou une couches
		 *
		 * @return Object Objet contenant les attributs de l'élément
		 */
		WMS: function(domDoc) {
			this.projList = [];
			
			domDoc = this.getRoot(domDoc);
			var records = [];
			var childNodes = domDoc.childNodes;
			for(var i=0; i < childNodes.length; i++){
				switch(childNodes[i].tagName) {
					case this.getNodeName():
						// records.push(new Ext.data.Model(
							// this.getAttributes.WMS.call(this, childNodes[i], [], this.projList)
						// ));
						records.push(this.getAttributes.WMS.call(this, childNodes[i], [], this.projList));
						break;
					case "SRS":
						proj = childNodes[i].childNodes[0].nodeValue.split(" ");
						for(var x=0; x<proj.length; x++){
							this.projList.push(proj[x]);
						}
						break;
					case "CRS":
						proj = childNodes[i].childNodes[0].nodeValue.split(" ");
						for(var x=0; x<proj.length; x++){
							var tmpProjection = proj[x];
							if(tmpProjection === "CRS:84"){//si ca contient CRS:84
								tmpProjection = "EPSG:4326";//CRS:84 is equivalent to EPSG:4326
							}
							this.projList.push(tmpProjection);
						}
						break;
				}
			}
			
			return new Ext.data.ResultSet({
				total: records.length,
				count: records.length,
				records: records,
				success: true
				// message: message
			});
		}
	}
});
