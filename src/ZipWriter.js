/**
 * Class to create a ZIP file as blob with a list of files inside.
 */
Ext.define('Ck.ZipWriter', {
	singleton: true,
	requires: [
		'Ck'
	],
	/**
	 * Creates a zip file containing list of files.
	 * Each item of filelist is an object with {filename: '', blob: Blob}
	 * at the end execute a callback returning a Blob that can be downloaded.
	 */
	createZipFile: function(filelist, callback) {
		// Default path to workers
		zip.workerScriptsPath = "packages/ck-viewer/libs/zip/";
		var o = Ck.getOption('zip');
		if (o && o.workerScriptsPath) {
			zip.workerScriptsPath = o.workerScriptsPath;
		}
		
		// Create the zip
		var bw = new zip.BlobWriter();
		zip.createWriter(bw, function(writer) {
			var nextFile = function(file) {
				writer.add(file.filename, new zip.BlobReader(file.blob), function(end) {
					var nextItem = filelist.pop();
					if (nextItem) {
						nextFile(nextItem);
					} else {
						writer.close(function(zipWrittenAsBlob) {
							callback(zipWrittenAsBlob);
						});
					}
				});
			};
			nextFile(filelist.pop());
		});
	}
});
