Ext.define("Ck.utils.file.Writer", {
	extend: 'Ck.utils.Model',
	
	defaultCreateParams: {
		create: true, 
		exclusive: false
	},
	mode: 2,
	statics: {
		MODE: {
			APPEND: 1,
			ERASE: 2
		}
	},
	
	/**
	*	Function writeData
	*	Permet d'écrire des donées dans le fichier
	**/
	writeData: function(data, mode) {
		if(mode !== undefined && mode) {
			this.setMode(mode);
		}
		this.setData(data);
		this.write();
	},
	
	/**
	*	Function write
	*	Permet d'écrire dans le fichier
	**/
	write: function() {
		var thisref = this;
        if(!window.LocalFileSystem) return;
        
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
        
            // Init path recursive before creating file.
            // http://stackoverflow.com/questions/10961000/nested-directory-creator-phonegap
            function createPath(fs, path, callback) {
				path = path.replace("file:///", ""); // suppr prefix de direction
                var dirs = path.split("/").reverse();
                dirs.shift(); // suppr le nom du fichier...
                var root = fs.root;

                var createDir = function(dir) {
                    if (dir.trim()!="") {
                        root.getDirectory(dir, {
                            create: true,
                            exclusive: false
                        }, success, function(dir) {
                            Ck.error("failed to create dir " + dir);
                        });
                    } else {
                        callback();
                    }
                };

                var success = function(entry) {
                    root = entry;
                    if (dirs.length > 0) {
                        createDir(dirs.pop());
                    } else {
                        callback();
                    }
                };

                createDir(dirs.pop());
            };
            
            createPath(fileSystem, thisref.path, function() {
                fileSystem.root.getFile(thisref.path, thisref.defaultCreateParams, function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        switch(thisref.mode) {
                            case Ck.utils.file.Writer.MODE.APPEND:
                                thisref.appendToFile(writer);
                                break;
                                
                            case Ck.utils.file.Writer.MODE.ERASE:
                            default:
                                thisref.writeToFile(writer);
                                break;			
                        }
                    }, thisref.fail);
                }, thisref.fail);
            });
            
		}, thisref.fail);			
	},
	
	/**
	*	Function appendToFile
	*	Ecrit les données à la fin du fichier en mode Ck.utils.file.Writer.MODE.APPEND
	*	Fire : dataWritten une fois que les données sont écrites
	**/
	appendToFile: function(writer) {
		var thisref = this;
		writer.onwriteend = function(evt) {
			thisref.fireEvent("dataWritten", evt);
		};
		writer.seek(writer.length);
		writer.write(this.getData());
	},

	/**
	*	Function writeToFile
	*	Ecrase et écrit les données dans le fichier en mode Ck.utils.file.Writer.MODE.ERASE
	*	Fire : dataWritten une fois que les données sont écrites
	**/
	writeToFile: function(writer) {
		var thisref = this;
		writer.onwriteend = function(evt) {
			thisref.fireEvent("dataWritten", evt);
		};
		writer.write(this.getData());
	},
	
	/**
	*	Function copyTo
	*	Copie le fichier dans le fichier spécifié
	*	Fire : fileCopied une fois le fichier copié
	**/
	copyTo: function(path, newName) {
		var thisref = this;
        if(!window.LocalFileSystem) return;
        
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
			fileSystem.root.getDirectory(path, {create: false}, function(directoryEntry) {
				fileSystem.root.getFile(thisref.path, thisref.defaultCreateParams, function(fileEntry) {
					fileEntry.copyTo(
						directoryEntry,
						newName,
						function(newEntry) {
							thisref.fireEvent("fileCopied", newEntry);
						}, 
						thisref.fail
					);
				}, thisref.fail);
			}, thisref.fail);			
		}, thisref.fail);			
	},
    
	/**
	*	Function moveTo
	*	Déplace le fichier dans le dossier spécifié
	*	Fire : fileMoved une fois le fichier déplacé
	**/
	moveTo: function(path, newName) {
		var thisref = this;
        if(!window.LocalFileSystem) return;
        
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
			fileSystem.root.getDirectory(path, {create: true}, function(directoryEntry) {
				fileSystem.root.getFile(thisref.path, thisref.defaultCreateParams, function(fileEntry) {
					fileEntry.moveTo(
						directoryEntry,
						newName,
						function(newEntry) {
							thisref.fireEvent("fileMoved", newEntry);
						}, 
						thisref.fail
					);
				}, thisref.fail);
			}, thisref.fail);			
		}, thisref.fail);			
	}
});