Ext.define("Ck.utils.Model", {
	extend: 'Ext.Component',
	
	path: null,	
	data: null,
	
	/**
	*	Function getData
	*	Retourne les données du fichier chargé
	**/
	getData: function() {
		return this.data;
	},

	/**
	*	Function getPath
	*	Retourne le chemin vers le fichier
	**/
	getPath: function() {
		return this.path;
	},
	
	/**
	*	Function setData
	*	Affecte les données
	**/
	setData: function(data) {
		this.data = data;
	},
	
	/**
	*	Function setPath
	*	Affecte le chemin vers le fichier
	**/
	setPath: function(path) {
		this.path = path;
	},
	
	/**
	*	Function setMode
	*	Affecte le mode d'accès au fichier
	**/
	setMode: function(mode) {
		this.mode = mode;
	},
	
	/**
	*	Function fail
	*	Affiche une erreur
	**/
	fail: function(fileError) {
		console.log(fileError);
		var msg = "Unknown error";
		switch(fileError.code) {
			case FileError.NOT_FOUND_ERR:
				msg = "File not found";
				break;
			case FileError.SECURITY_ERR:
				msg = "Security problem";
				break;
			case FileError.ABORT_ERR:
				msg = "Interrupted task";
				break;
			case FileError.NOT_READABLE_ERR:
				msg = "File unreadable";
				break;
			case FileError.ENCODING_ERR:
				msg = "Codification problem";
				break;
			case FileError.NO_MODIFICATION_ALLOWED_ERR:
				msg = "Unauthorized modification";
				break;
			case FileError.INVALID_STATE_ERR:
				msg = "State invalid";
				break;
			case FileError.SYNTAX_ERR:
				msg = "Syntax error";
				break;
			case FileError.INVALID_MODIFICATION_ERR:
				msg = "Invalid modification";
				break;
			case FileError.QUOTA_EXCEEDED_ERR:
				msg = "Quota exceeded";
				break;
			case FileError.TYPE_MISMATCH_ERR:
				msg = "Type mismatch";
				break;
			case FileError.PATH_EXISTS_ERR:
				msg = "The path already exists";
				break;
		}
		Ck.error("File", msg);
	}
});