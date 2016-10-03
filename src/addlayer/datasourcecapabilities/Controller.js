/**
 * Controller of the addlayer panel. An addlayer panel consists of :
 *
 * - AddLayer action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.datasourcecapabilities.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer.datasourcecapabilities',
	
	config: {
		groupName: 'Mes données',
		groupByDatasource: false,
		groupExists : false,
		
		/**
		 * @property {Boolean/String}
		 * False pour charger les couches du référentiel quelque soit le contexte </br>
		 * Le nom du contexte  ou chaîne vide pour charger les couches du contexte  en cours de consultation </br>
		 * Null pour utiliser this.datasource
		 */
		context: null,
		
		/**
		 * Paramètres additionels ajoutés à la fin de la requête getCapabilities
		 */
		loaderParams: false,
		
		/**
		 * Configuration du dataSource utilisé par défaut
		 */
		datasource: {
			url: 'index.php',
			title: 'Base de données Postgis',
			type: 'POSTGIS'
		},
		
		/**
		 * @property {Array/Boolean}
		 * Liste des projections proposées par le serveur ou faux si non renseigné
		 */
		projList: false,
		
		/**
		 * Message pendant la requête getCapabilities
		 */
		loadingMsg: "Chargement des couches...",
		
		/**
		 * Indique pour les WFS si c'est la passe en WMS (true) ou la passe en WFS (false)
		 */
		firstPass: true,
		
		/**
		 * Indique s'il faut regarder s'il y a un serveur WMS associé au serveur WFS
		 */
		testWMS: false,
		
		/**
		 * Version en cours de test (contient une valeur du tableau this.versions
		 */
		version: '1.1.0',
		
		versions: ["1.1.0", "1.3.0"]
	},
	
	/**
	 * @protected
	 */
	init: function(view) {
		// http://mem-ouganda:8090/geoserver/wfs/?service=wfs&request=getCapabilities
		this.store = Ext.create("Ext.data.TreeStore", {
			proxy: Ext.create("Ext.data.proxy.Ajax", {
				reader: Ext.create("Ext.data.reader.Xml", {
					transform: this.readRecords
				})
			})
		});
		
		this.store.on("load", this.test, this);
		
		// recordCreator
		
		/* Initialisation du TreeLoader
		this.loader = new Ext.ux.XmlGetCapabilitiesTreeLoader({
			baseAttrs: {
				iconCls: 'x-tree-node-no-icon',
				singleClickExpand: true
			},
			listeners: {
				"beforeload": this.beforeLoad,
				"load": this.afterLoad,
				"loadexception": this.loaderException,
				scope: this
			},
			clearOnLoad: true,
			skipUser: false
		});
		this.root = new Ext.tree.TreeNode();*/
		// this.store.load();
		this.callParent([view]);
	},
	
	test: function(a,b,c) {
		var toto = 1;
		toto += 1;
	},
	
	readRecords: function(data) {
		return data;
	},
	
	/**
	 * @method initMask
	 * Initilise le masque de chargement s'il n'y en a pas déjà un
	 */
	initMask: function() {
		if(!this.loadMask)
			this.loadMask = new Ext.LoadMask({
				target: this.getView().el,
				message: this.getLoadingMsg()
			});
	},
	
	/**
	 * @method beforeLoad
	 * Méthode appelée au début du chargement des couches. Affiche le masque
	 */
	beforeLoad: function() {
		this.loadMask.show();
	},
	
	/**
	 * @method afterLoad
	 * Méthode appelée à la fin du chargement des couches. Cache le masque
	 * On vérifie le succès car l'évènement "load" est appelé même avec "loaderexception" !!
	 * @param {Ext.ux.XmlGetCapabilitiesTreeLoader}
	 */
	afterLoad: function(TL) {
		if(TL.success) {
			this.loadMask.hide();
			
			if(!Ext.isEmpty(TL.version)) {
				this.version = TL.version;
			}
			
			if(Array.isArray(TL.projList) && TL.projList.length!=0)
				this.projList = TL.projList;
			else
				this.projList = false;
		}
	},
	
	loadDataSource: function(src) {
		this.idxVersion = -1;
		this.firstPass = true;
		this.datasource = src;
		
		this.reload();
	},
	
	/**
	 * @method reload
	 * Charge la liste des couches d'un serveur
	 */
	reload: function() {
		this.idxVersion++;
		
		this.version = this.getVersions()[this.idxVersion];
		
		var service = this.datasource.type;
		
		switch(this.datasource.type) {
			// Datasource temporaire saisie par l'utilisateur
			case "WFS":
				// On essai de requêter le serveur WFS en WMS (question performance)
				if(this.firstPass && this.testWMS) {
					service = "WMS";
				}
			case "WMS":
				var url = this.datasource.url;
				url += '?SERVICE=' + service + '&REQUEST=GetCapabilities&VERSION=' + this.version + '&' + this.loaderParams;
			break;
			default:
				if(this.context != null) {
					// Data internes
					url = "index.php?s=wms&r=getcapabilities&params=Data,DataSource,ConnectionType,Type&context=" + this.context + '&' + this.loaderParams;
				} else {
					// Datasource via datasource.xml
					url = "index.php?s=datasource&r=getdata&datasource="+this.datasource.name;
				}
		}
		
		// loadexception 
		// this.loader.service = service;
		// this.loader.dataUrl = url;
		// this.loader.load(this.root);
		this.store.getProxy().setUrl(url);
		this.store.load();
		// this.root.expand();
	},
	
	/**
	 * @method loaderException
	 * Appelé lors d'une exception de chargement
	 *
	 * @param {Mixed} Soit un entier : 1 pour abscence de réponse, 2 pour une requête WMS qui 
	 */
	loaderException: function(param) {
		if(this.idxVersion + 1 < this.versions.length) {
			this.reload();
		} else if(this.datasource.type == "WFS") {
			this.datasource.type = "WMS";
			this.idxVersion = -1;
			this.reload();
		} else {
			Ext.Msg.show({
				title: "Requête getCapabilities",
				msg: "Impossible de récupérer la liste des couches de cette source de données",
				buttons: Ext.Msg.OK,
				icon: Ext.MessageBox.ERROR
			});
		}
	},
	
	onClick: function(node, evt){
		var layer = this.addLayer(node);
		if(layer) {
			this.redrawLegendPanel(layer);
			// Pour le WFS on lance la requête getFeatures pour les autres on fait un simple redraw
			if(layer.connectiontype == "WFS") {
				layer.strategies[0].activate();
			} else {
				layer.redraw(true);
			}
			this.fireEvent("layeradded", layer, node);
		}
	}
});
