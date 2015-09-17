/**
 * 
 */
Ext.define('Ck.Zip', {
	alternateClassName: 'CkZip',
	
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
	 * Called when Zip archives are open
	 * @param {entry[]}
	 */
	onGetEntries: function(entries) {
		this.files = {};
		this.nbFiles = entries.length;
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
		zip.workerScriptsPath = "packages/local/ck-viewer/libs/zip/WebContent/";
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
		zip.createReader(new zip.BlobReader(this.fileName), callback.bind(this));
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
				extension: entry.filename.slice(-3).toLowerCase(),
				url: (this.tempStorage == "Blob") ? URL.createObjectURL(blob) : fileEntry.toURL()
			};
			
			var fileReader = new FileReader();
			fileReader.onload = this.saveData.bind(this, file);
			fileReader.readAsArrayBuffer(blob);
			
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
			if(this.files[file].extension == extension) {
				aFile.push(this.files[file]);
			}
		}
		return aFile;
	}
});