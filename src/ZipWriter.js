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
	 * Returns a Blob that can be downloaded.
	 */
	createZipFile: function(filelist, callback) {
		var bw = new zip.BlobWriter();
		zip.createWriter(bw, function(writer) {
			var nextFile = function(file) {
				writer.add(file.filename, new zip.BlobReader(file.blob), function(end) {
					var nextItem = filelist.pop();
					if (nextItem) {
						nextFile(nextItem);
					} else {
						writer.close(function(zipWrittenAsBlob) {
							var el = document.createElement('a');
							el.href = window.URL.createObjectURL(zipWrittenAsBlob);
							el.setAttribute('download', "test.zip");
							document.body.appendChild(el);
							el.click();
							document.body.removeChild(el);
						});
					}
				});
			};
			nextFile(filelist.pop());
		});
	}
});
