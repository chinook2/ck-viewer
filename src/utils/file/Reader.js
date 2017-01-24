Ext.define("Ck.utils.file.Reader", {
	extend: 'Ck.utils.Model',
	
	mode: 2,
	statics: {
		MODE: {
			URL: 1,
			TEXT: 2
		}
	},
	
	/**
	*	Function read
	*	Permet de récupérer le fichier et le lire
	**/
	read: function() {
		var thisref = this;
        if(!window.LocalFileSystem) return;
        
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
			fileSystem.root.getFile(thisref.path, null, function(fileEntry) {
				fileEntry.file(function(file) {
					switch(thisref.mode) {
						case Panama.utils.file.Reader.MODE.URL:
							thisref.readDataUrl(file);
							break;
							
						case Panama.utils.file.Reader.MODE.TEXT:
						default:
							thisref.readAsText(file);
							break;			
					}
				}, thisref.fail);
			}, thisref.fail);
		}, thisref.fail);			
	},
	
	/**
	*	Function readDataUrl
	*	Lis le contenu d'un fichier en mode Panama.utils.file.Reader.MODE.URL
	*	Fire : dataLoaded une fois que les données sont chargées
	**/
	readDataUrl: function(file) {
		var reader = new FileReader();
		var thisref = this;
		reader.onloadend = function(evt) {
			thisref.data = evt.target.result;
			thisref.fireEvent("dataLoaded",{
				data: thisref.data,
				event: evt
			});
		};
		reader.readAsDataURL(file);
	},

	/**
	*	Function readDataUrl
	*	Lis le contenu d'un fichier en mode Panama.utils.file.Reader.MODE.TEXT
	*	Fire : dataLoaded une fois que les données sont chargées
	**/
	readAsText: function(file) {
		var thisref = this;
		var reader = new FileReader();
		reader.onloadend = function(evt) {
			thisref.data = evt.target.result;
			thisref.fireEvent("dataLoaded",{
				data: thisref.data,
				event: evt
			});
		};
		reader.readAsText(file);
	},
	
	/**
	*	Function fileExists
	*	Vérifie si un fichier existe
	*	Fire : fileExistsChecked une fois le test effectué
	**/
	fileExists: function() {
		var thisref = this;
        if(!window.LocalFileSystem) {
			Ext.log('window.LocalFileSystem Not dedined');
			return;
        }
		
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
			fileSystem.root.getFile(
				thisref.path, 
				{ create: false },
				function(evt) {
					thisref.fireEvent("fileExistsChecked",{
						data: {
							path: thisref.path,
							exists: true
						},
						event: evt
					});
				}, 
				function(evt) {
					thisref.fireEvent("fileExistsChecked",{
						data: {
							path: thisref.path,
							exists: false
						},
						event: evt
					});
				}
			);
		}, thisref.fail);
	}
});