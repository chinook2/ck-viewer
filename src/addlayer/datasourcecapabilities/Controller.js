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
	
	//requires: [
	//	'Ck.CapabilitiesLoader'
	//],
	
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
		loaderParams: "",
		
		/**
		 * Configuration du dataSource utilisé par défaut
		 */
		datasource: {
			url: 'index.php',
			title: 'Base de données Postgis',
			service: 'POSTGIS'
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
		firstPass: false,
		
		/**
		 * Indique s'il faut regarder s'il y a un serveur WMS associé au serveur WFS
		 */
		tryWMS: true,
		
		/**
		 * Version en cours de test (contient une valeur du tableau this.versions
		 */
		version: '1.1.0',
		
		/**
		 * Versions available to test
		 */
		versions: ["1.1.0", "1.3.0"],
		
		/**
		 * Version index to try
		 */
		idxVersion: -1,
		
		/**
		 * True to sort capabilities
		 */
		sort: false
	},
	
	/**
	 * @protected
	 */
	init: function(view) {
		if(this.getSort()) {
			view.on("load", function(view) {
				view.sort("text", "ASC");
			});
		}
		
		view.getStore().addListener({
			beforeLoad: this.beforeLoad,
			load: this.afterLoad,
			scope: this
		});
		this.callParent([view]);
	},
	
	/**
	 * @method beforeLoad
	 * Méthode appelée au début du chargement des couches. Affiche le masque
	 */
	beforeLoad: function() {
		this.getView().mask("Loading...");
	},
	
	/**
	 * After capabilities load
	 */
	afterLoad: function(TL) {
		this.getView().unmask();
		this.getView().getRootNode().expand();
		
		// Get projection list
		var cl = this.getView().getStore().getProxy();
		if(Array.isArray(cl.projList) && cl.projList.length > 0) {
			this.setProjList(cl.projList);
		} else {
			this.setProjList(false);
		}
		
		// Sort layer
		this.getView().getStore().sort
	},
	
	/**
	 * Start capabilities data loading. Called by DataSourceSelector select event.
	 * @params {Object} Datasource parameters
	 */
	loadDataSource: function(src) {
		this.setIdxVersion(-1);
		this.setFirstPass(true);
		this.setDatasource(src);
		
		if(this.nodePath === null || this.nodeName === null) {
			this.nodePath = this.getCapabilitiesConfig[src.service].nodePath;
			this.nodeName = this.getCapabilitiesConfig[src.service].nodeName;
		}
		
		this.reload();
	},
	
	/**
	 * @method reload
	 * Charge la liste des couches d'un serveur
	 */
	reload: function() {
		var dsrc = this.getDatasource();
		var service = dsrc.service;
		
		// Set request version
		if(dsrc.version) {
			this.setVersion(dsrc.version);
		} else {
			this.setIdxVersion(this.getIdxVersion() + 1);
			this.setVersion(this.getVersions()[this.getIdxVersion()]);
		}
		
		switch(service) {
			// Temporary datasource service by user
			case "WFS":
				// Try to request WFS server as WMS (performance question)
				if(this.getFirstPass() && this.getTryWMS()) {
					service = "WMS";
				}
				break;
			case "WMS":
				break;
			default:
				if(this.context != null) {
					// Internal data
					url = "index.php?s=wms&r=getcapabilities&params=Data,DataSource,ConnectionType,Type&context=" + this.context + '&' + this.getLoaderParams();
				} else {
					// Datasource from datasource.xml
					url = "index.php?s=datasource&r=getdata&datasource=" + dsrc.name;
				}
		}
		
		var url = dsrc.url + "?SERVICE=" + service + "&REQUEST=GetCapabilities&VERSION=" + this.getVersion() + '&' + this.getLoaderParams();
		var store = this.getView().getStore(); 
		
		store.getProxy().setService(service);
		store.getProxy().setUrl(url);
		store.load({
			node: this.getView().getRootNode()
		});
	},
	
	/**
	 * Called when the load fails
	 *
	 * @param {Mixed} Soit un entier : 1 pour abscence de réponse, 2 pour une requête WMS qui 
	 */
	loaderException: function(param) {
		if(this.idxVersion + 1 < this.versions.length) {
			this.reload();
		} else if(this.datasource.service == "WFS") {
			this.datasource.service = "WMS";
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
	}
});
