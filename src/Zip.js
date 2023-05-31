/**
 * see zip library : https://gildas-lormeau.github.io/zip.js/
 */
Ext.define('Ck.Zip', {
	alternateClassName: 'CkZip',
	
	requires: [
		'Ck'
	],

	/**
	 * @event filesloaded
	 * Fires when all files are loaded
	 */

	/**
	 * Type of parameter given to the onMetaData callback.
	 * It can be "ProgressEvent" or "URL"
	 */
	outputFormat: "ProgressEvent",

	/**
	 * Temporary storage location: RAM (Blob) or HDD (File)
	 */
	tempStorage: "Blob",

	/**
	 * File extensions to read as text
	 * @type {Array} list of valid extensions
	 */
	readAsText: ['xml','txt','csv','json','prj'],

	/**
	 * Called when Zip archives are open
	 * @param {entry[]}
	 */
	onGetEntries: function(entries) {
		this.files = {};
		this.nbFiles = entries.length;
        if (this.nbFiles < 1 && Ext.isFunction(this.onError)) {
           this.onError('no file in zip'); 
		}
        entries.forEach(this.getEntryFile.bind(this));
	},

	/**
	 * Called when file are read
	 * @param {Blob}
	 */
	onGetData: Ext.emptyFn,

	/**
	 * Function to display the progress of file opening
	 */
	onProgress: Ext.emptyFn,

	onError: null,

	/**
	 * Function to display the progress of file opening
	 */
	onFilesLoaded: Ext.emptyFn,

	scope: {
		onGetEntries: this,
		onGetData: this,
		onProgress: this,
		onFilesLoaded: this
	},

	files: {},


	/**
	 * @ignore
	 */
	constructor: function(config) {
		Ext.apply(this, config);
		this.requestFileSystem = window.webkitRequestFileSystem || window.mozRequestFileSystem || window.requestFileSystem;

		zip.workerScriptsPath = "packages/ck-viewer/libs/zip/";
		var o = Ck.getOption('zip');
		if (o && o.workerScriptsPath) {
			zip.workerScriptsPath = o.workerScriptsPath;
		}
		// zip.useWebWorkers = false;
	},

	onerror: function(message) {
		alert(message);
	},

	/**
	 * Create a temporary file. Used when this.tempStorage == "File"
	 * @param {Function}
	 */
	createTempFile: function(callback) {
		var tmpFilename = "tmp.dat";
		this.requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
			function create() {
				filesystem.root.getFile(tmpFilename, {
					create : true
				}, function(zipFile) {
					callback(zipFile);
				});
			}

			filesystem.root.getFile(tmpFilename, null, function(entry) {
				entry.remove(create, create);
			}, create);
		});
	},

	/**
	 * Open the archive and call this.onGetEntry callback function
	 */
	getEntries: function() {
		var callback = function(zipReader) {
			zipReader.getEntries(this.onGetEntries.bind(this.scope["onGetEntries"] || this));
		};
		// Read from Blob filename
		if (this.fileName) {
			zip.createReader(new zip.BlobReader(this.fileName), callback.bind(this), this.onError);
		}
		// Read from file content as text
		else if (this.fileUrl) {
			zip.createReader(new zip.HttpReader(this.fileUrl), callback.bind(this), this.onError);
		}

	},


	getEntryFile : function(entry) {
		var writer;

		if (this.tempStorage == "Blob") {
			writer = new zip.BlobWriter();
			this.getData.bind(this)(entry, writer);
		} else {
			this.createTempFile(function(fileEntry) {
				writer = new zip.FileWriter(fileEntry);
				this.getData.bind(this)(entry, writer, fileEntry);
			});
		}
	},

	/**
	 * Open a file and call onGetData callback at end of reading
	 * @param
	 * @param
	 */
	getData: function(entry, writer, fileEntry) {
		entry.getData(writer, function(entry, blob) {
			var file = {
				filename: entry.filename,
				extension: Ck.getFileExtension(entry.filename), //.slice(-3).toLowerCase(),
				url: (this.tempStorage == "Blob") ? URL.createObjectURL(blob) : fileEntry.toURL()
			};

			var fileReader = new FileReader();
			fileReader.onload = this.saveData.bind(this, file);
			if (this.readAsText.indexOf(file.extension) != -1) {
				fileReader.readAsText(blob);
			} else {
				fileReader.readAsArrayBuffer(blob);
			}
		}.bind(this, entry), this.onProgress.bind(this.scope["onProgress"] || this));
	},

	/**
	 * Call when file are read
	 *
	 * Save the file in the "files" member, call onGetData and, if all files are loaded, call onFilesLoaded
	 * @param {String}
	 * @param {ProgressEvent}
	 */
	saveData: function(file, ev) {
		file.data = ev.target.result;
		this.files[file.filename] = file;
		this.onGetData.bind(this.scope["onGetData"] || this)(file);
		if(this.nbFiles == Object.keys(this.files).length) {
			this.onFilesLoaded.bind(this.scope["onFilesLoaded"] || this)();
		}
	},

	/**
	 * Get files from extension
	 */
	getFilesByExtension: function(extension) {
		var aFile = [];
		for(var file in this.files) {
			if(this.files[file].extension.toLowerCase() == extension.toLowerCase()) {
				aFile.push(this.files[file]);
			}
		}
		return aFile;
	}
});
