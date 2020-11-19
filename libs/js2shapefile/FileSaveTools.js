/** Class to handle saving input binary data to a file in a moderately cross-browser way
 * Usage pattern is to create an HTML button or small Flash button that when pressed will initiate the save
 * This is because saving from Flash (via Downloadify) cannot be initiated without user action i.e. click on
 * a button. Only browsers supporting HTML5 file write api (i.e. Chrome) can save programatically
 *
 * By Harry Gibson, CEH Wallingford
 * (c) 2012
 * ceh.ac.uk@harr1 / gmail.com@harry.s.gibson / reversed
 * GNU / GPL v3
 *
 * Usage:
 * var blob1 = BinaryHelper.createBlob();
 * var blob2 = BinaryHelper.createBlob();
 * blob1.append(someArrayBuffer);
 * blob2.append(someBinaryStringData);
 * var dataObject = {
 * 	file1: blob1.getBlob(),
 * 	file2: blob2.getBlob()
 * }
 * var bH = new BinaryHelper();
 *
 * bH.addData({
 * 	filename: string,
 * 	extension: string,
 * 	datablob: dataObject['file1']
 * });
 * (etc)
 * If more than one file is added then if downloadify is used (non-Chrome) the file produced will be a 
 * zipped archive of them
 * // create the button in an existing div; clicking it will save the file
 * var btn = bH.createSaveControl("existingDivId);
 * // In Chrome we don't need to use createSaveControl and can programmatically or otherwise just call:
 * bH._saveNative()
 */

// Compatibility notes for making binary data and saving it:
// Chrome: We can use Dataview, ArrayBuffer and Blobs (as WebKitBlobBuilder). We can save the blobs as-is.
// 			This class isn't really needed as data can be saved programatically there with no user interaction
// 			required. Only a saveAs helper library is used to wrap this up. 
//			Require: saveAs
// Firefox: Binary data can be created in ArrayBuffer but need to use a fake Dataview. For saving, whilst blobs 
//			are available (as MozBlobBuilder), we cannot practically save them.  (data URI is possible but no 
//			filename - saveAs library can provide this as a fallback but not implemented yet).
//			Neat saving needs the Downloadify flash library and that cannot accept real blobs as input. 
//			Need to be able to get the "blob"'s data itself, which is
//			possible with the FakeBlobBuilder class. Also use JSZip to combine multiple files into one for 
// 			convenience (otherwise multiple flash buttons would be required).
//			Require: Downloadify, FakeBlobBuilder, jDataView_write, JSZip
// IE:		We have to fake everything and use the flash downloadify object. Works effectively the same as firefox.

/*
 * Helper classes / 3rd party code used in this file:
 * FileSaver, used in _saveNative method for saving in Chrome, loaded if required:
 * * FileSaver.js
 * * A saveAs() FileSaver implementation.
 * * 2011-08-02 
 * * By Eli Grey, http://eligrey.com
 * * License: X11/MIT
 * *   See LICENSE.md
 * * http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js
 *
 * BlobBuilder: for providing a blob-like object that allows access to its data, modified slightly, source
 * and license at the end of this file so always loaded
 *
 * JSZip: for combining multiple files into a single file for more convenient download, loaded if required
 * 
 * jDataView_write: provides implementation of Dataview in non-chrome browsers. Always loaded by this file.
 */
(function(preferredOptions){
    var getSaveMethod = function(preferred){
        // preferred options for saving are chosen in order (or specify "FLASH" to force that): 
        // 1 - saveAs from eligrey.com FileSaver library. Saves files natively and correctly with Chrome directly
        // from blob objects. Use to save individual files all at once in Chrome. But not in Firefox as filename
        // can't be set there so user can't tell which file is which 
        // 2 - downloadify flash library. If flash is installed will work in any browser based on base64 encoded
        // input string. Inconvenient to save multiple files so combine with JSZip to zip all into a single 
        // file. Blobs not then required for saving (but still used in shapefile creation)
        // 3 - saveAs from eligrey.com in Firefox. Works, but filename cannot be set. Therefore use this if we're in
        // firefox but flash not installed. Zip file first so there is only one, and warn user to rename to xyz.zip   
        if (typeof(chrome) !== 'undefined' && !(preferred && preferred != "CHROME")) {
            // Case 1: can use saveAs which will use filesystem method to save
            return "CHROME";
        }
        var hasFlash = false;
        try {
            var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            if (fo) 
                hasFlash = true;
        } 
        catch (e) {
            if (navigator.mimeTypes["application/x-shockwave-flash"] != undefined) 
                hasFlash = true;
        }
        if (hasFlash && !(preferred && preferred != "FLASH")) {
            // Case 2: can use flash library
            return "FLASH";
        }
        // maybe we don't have flash but can use data URIs. If data URIs are available, the saveAs object will
        // work albeit with dodgy download names
        var data = new Image();
        data.onload = data.onerror = function(){
            if (this.width != 1 || this.height != 1) {
                // failed - we can't save anything
                return "NONE";
            }
            else {
                // case 3:  can use saveAs which will use data uri method to save
                return "DATAURI";
            }
        }
        data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    }
    // function to load some external script files not using dojo
	// generally this makes you realise how useful dojo.require, dojo.io.script.get, dojo.deferred, and
	// dojo.deferredlist really are. 
    var loadScriptFile = function(src, checkobject, loaderCallBack){
        function calltheCallback(){
            if (typeof window[checkobject] != 'undefined') {
				loaderCallBack(checkobject);
			}
			else {
				setTimeout (function(){
					calltheCallback();
				},500)
			}
        }
        if ((typeof window[checkobject] == 'undefined') && !window['loading' + checkobject]) {
            window['loading' + checkobject] == true;
            //console.log("loadScriptFile in FileSaveTools loading file " + src);
            var fileref = document.createElement('script');
            fileref.setAttribute("type", "text/javascript");
            fileref.setAttribute("src", src);
            if (loaderCallBack) {
                //fileref.onload = loaderCallBack.bind(this, arguments);
                fileref.onload = calltheCallback();
                fileref.onreadystatechange = function(){
                    if (this.readyState == 'complete') {
                        //return loaderCallBack.bind(this, arguments);
                        calltheCallback()
                    }
                }
            }
            document.getElementsByTagName("head")[0].appendChild(fileref);
        }
        else 
            if (typeof window[checkobject] == 'undefined') {
               // console.log("Repeated call made to load " + src + " but it is already attempting to load");
                calltheCallback();
            }
            else {
               // console.log("Object " + checkobject + " is already defined, no need to load script " + src);
                calltheCallback();
            }
    }
    var sourceUrls = {
        // keys are name of the check object that is defined by the script (something that, when it exists
        // in window scope, means we know the script has loaded and executed
        saveAs: "/js2shapefile/lib/external/FileSaver.min.js",
        JSZip: "/js2shapefile/lib/external/jszip.js",
        // currently BlobBuilder script is included in this file so no need to load
        BlobBuilder: "/js2shapefile/lib/external/BlobBuilder_mod.js",
        jDataView_write: "/js2shapefile/lib/jDataView_write.js",
        Downloadify: "/js2shapefile/lib/downloadify/js/downloadify.js",
        swfobject: "/js2shapefile/lib/downloadify/js/swfobject.js"
    };
    
    var _saveMethod = getSaveMethod();
    
   
    // MAIN CONSTRUCTOR FOR BINARY HELPER CLASS
    var BinaryHelper = function(){
        this.data = [];
    }
    BinaryHelper.RequireFakeBlob = _saveMethod === "FLASH" ? true : false;
    
	// DEFINE ALL METHODS ON THE PROTOTYPE OF BINARYHELPER
    var bH_Proto = BinaryHelper.prototype;
    bH_Proto.addData = function(dataObject){
        // dataObject is an object where keys are filename and values are Fake-blobs of data (where data property
        // is accessible)
        // optional fileBaseName parameter if true will treat the keys as a suffix rather than full filename
        this.data.push(dataObject);
        //this._filenamebase = fileBaseName || null;
    }
    bH_Proto._saveNative = function(dataObjOrArray, fileNamesOrArray){
        // function calls the native FileSaver, via the saveAs wrapper class for now
        // saveAs function to neaten native saving in Chrome, taken from:
        /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
        // saveAs does enable saving in browsers with data URI support too but no filenames then
        if (typeof(saveAs) === 'undefined') {
            // run the code to set up native saving as a global object only when we need it
            // TODO remove this from here as it has been loaded by separate script call
           // console.log("Error! saveAs function has not been loaded");
            return;
        }
        for (var i = 0; i < this.data.length; i++) {
            saveAs(this.data[i]['datablob'], this._getFileName(this.data[i]));
        }
    }
    bH_Proto.createBlob = function(){
        // if we are using saveAs native saving then blob builder can also be native (WebKitBlobBuilder).
        // If not then it needs to be something to which we can append either normal arrays, arraybuffers,
        // or strings, and from which we can extract the data in a (binary) string format
        // we will use the BlobBuilder class from Eli Grey for this; it has lots of more advanced handling
        // not needed here but will minimise changes needed in clients later 
        return new Blob();
    }
    // sort out filename for saved data
    bH_Proto._getFileName = function(dataObject){
        if (dataObject['filename'] && dataObject['extension']) {
            return dataObject['filename'] + "." + dataObject['extension'];
        }
        else 
            if (dataObject['filename']) {
                return dataObject['filename'];
            }
            else 
                if (dataObject['extension']) {
                    return "unknown." + dataObject['extension'];
                }
                else 
                    return "unknown_file.saved";
    }
    bH_Proto._getBase64DataAsSingleFile = function(){
        // function returns the data to be sent to the downloadify swf as a base64 string
        // it will be the file itself if only one in the data object, or a zip of them if multiple
        var numFiles = 0;
        if (this.data.length == 0) {
          //  console.log("BinaryHelper: No data to save!");
            return;
        }
        if (this.data.length == 1) {
            var saveData = JSZipBase64.encode(this.data[0]['datablob']['data']);
            return saveData;
        }
        // if more than one file, use JSZip to join them into one
        var zip = new JSZip();
        for (var i = 0; i < this.data.length; i++) {
            var dataObj = this.data[i];
            // need to use the blob's data directly. This is a dirty hack which isn't in the "native" blob,
            // only in the fake blob. 
            // could instead check whether flash saving will be required when making the shapefile
            // and simply return binary string if so, but that would mean the shapefile library being
            // less agnostic
            var b64 = JSZipBase64.encode(this.data[i]['datablob']['data']);
            var fname = this._getFileName(this.data[i]);
            zip.add(fname, b64, {
                base64: true
            })
        }
        return zip.generate();
    }
    bH_Proto.createSaveControl = function(locationDiv, append){
        // function takes as input the id of a div; to this it will append either a native HTML button 
        // or a flash movie looking like one (As shown in Windows - will look goofy on a machine that shows 
        // buttons differently but that's life). 
        // div will have size 96*22 pixels. 
        // clicking the button will cause the data to be saved either by calling _saveNative on this 
        // BinaryHelper object or by running the Downloadify flash routine fed with data from calling 
        // _getBase64DataAsSingleFile on this BinaryHelper object
        
        var that = this;
        if (!append) {
            document.getElementById(locationDiv).innerHTML = "";
        }
        if (_saveMethod == "CHROME") {
            var btn = document.createElement("input");
            btn.value = "Save results";
            btn.type = "button";
            btn.onclick = function(){
                that._saveNative();
            };
            document.getElementById(locationDiv).appendChild(btn);
        }
        else 
            if (_saveMethod == "FLASH") {
                Downloadify.create(locationDiv, {
                    swf: '/js2shapefile/lib/downloadify/media/downloadify.swf',
                    downloadImage: '/js2shapefile/lib/downloadify/images/download_nativelook.png',
                    filename: function(){
                   //     console.log("filename requested");
                        //return that._getFileName("zip");
                        return "all_" + that.data.length + "_files.zip"
                    },
                    width: 96,
                    height: 22,
                    data: function(){
                      //  console.log("data requested");
                        return that._getBase64DataAsSingleFile();
                    //return that.getBlobData();
                    },
                    //dataType:"string", 
                    dataType: 'base64',
                    transparent: false,
                    append: true
                });
            }
            else 
                if (_saveMethod == "DATAURI") {
                    // not implemented yet
                    locationDiv.innerHTML = "Error!";
                    //console.log("DATA URI save methods not implemented yet, try getting flash or Chrome");
                }
                else 
                    if (_saveMethod == "NONE") {
                        // error
                        locationDiv.innerHTML = "Error!";
                     //   console.error("Cannot save, no method is available... get a better browser!");
                    }
        //return wrapper;
    }
	
	// The line "self.BinaryHelper = BinaryHelper" is the point at which BinaryHelper becomes available in
	// the page loading this file (e.g. if this file has been loaded via dojo.io.script.get with
	// checkString = "BinaryHelper"
	// But because this file loads other files asynchronously we don't want to execute this line until 
	// they have all loaded (as some of the functions that are made available by BinaryHelper rely on things
	// in those files, we don't want the functions to be called until they are loaded, so effectively we prevent
	// BinaryHelper from announcing that it's loaded. When all sub-files are loaded, DefineMainFunction will be 
	// called then. 
	// This is basically mimicking the behaviour that's achieved through a Dojo.DeferredList. But loads more 
	// confusing. Think of this as the function passed to DeferredList.then()
    var DefineMainFunction = function(){
       	self.BinaryHelper = BinaryHelper;
		self.BlobBuilder = BlobBuilder;
    }
	// Now load all the things required in the current environment
	// always load jDataView_write file (for now)
	var scriptsToLoadObj = {
		// keys are the key in the sourceUrls object, also being the value of the checkObject defined in the 
		// file. Values represent whether it has loaded yet
		jDataView_write:false
	}
	if (_saveMethod == "CHROME") {
        scriptsToLoadObj['saveAs']=false;
    }
    else {
		scriptsToLoadObj['JSZip']=false;
		scriptsToLoadObj['Downloadify']=false;	
		scriptsToLoadObj['swfobject']=false;
    }
	// loadScriptFile calls this when the script is loaded
    var onScriptLoaded = function(checkObj){
    	scriptsToLoadObj[checkObj] = true;
		//console.log("Loaded script containing object "+checkObj);
		var allDone = true;
		for (var prop in (scriptsToLoadObj)){
			if (scriptsToLoadObj.hasOwnProperty(prop)){
				if (!scriptsToLoadObj[prop]){
					allDone = false;
				}
			}
		}
		if (allDone){
			// we are finally ready to announce BinaryHelper to the world
			DefineMainFunction();
		}
    }
	
	// DEFINE BLOBBUILDER CLASS INSIDE MAIN FUNCTION WHERE BINARYHELPER IS ALSO DEFINED
	// BECAUSE IT IS (sort of) DEPENDENT ON BINARYHELPER TO KNOW IF FAKE BLOBS ARE REQUIRED EVEN THOUGH
	// REAL ONES ARE AVAILABLE (FIREFOX), BUT AS ABOVE WE DON'T WANT TO MAKE BINARYHELPER 
	// GLOBALLY AVAILABLE YET
    /* BlobBuilder.js
     * A BlobBuilder implementation.
     * 2011-07-13
     *
     * By Eli Grey, http://eligrey.com
     * License: X11/MIT
     *   See LICENSE.md
     */
    /*global self, unescape */
    /*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
     plusplus: true */
    /*! @source http://purl.eligrey.com/github/BlobBuilder.js/blob/master/BlobBuilder.js */
    
    var BlobBuilder = BlobBuilder ||// self.WebKitBlobBuilder || self.MozBlobBuilder ||
    (function(view){
        "use strict";
        // modified to allow forcing of fake blob builder. Used in browsers (firefox) where real blobs are 
        // available but no useful native means of saving them is implemented. Saving to files is then 
        // based on Downloadify, but this needs string input and therefore needs access to the data of the blob,
        // therefore MozBlobBuilder is no use for building a file-saving application
        if (!BinaryHelper.RequireFakeBlob && (self.WebKitBlobBuilder || self.MozBlobBuilder)) {
            return self.WebKitBlobBuilder || self.MozBlobBuilder;
        }
        var get_class = function(object){
            return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
        }, FakeBlobBuilder = function(){
            this.data = [];
        }, FakeBlob = function(data, type, encoding){
            this.data = data;
            this.size = data.length;
            this.type = type;
            this.encoding = encoding;
        }, FBB_proto = FakeBlobBuilder.prototype, FB_proto = FakeBlob.prototype, FileReaderSync = view.FileReaderSync, FileException = function(type){
            this.code = this[this.name = type];
        }, file_ex_codes = ("NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR " +
        "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR").split(" "), file_ex_code = file_ex_codes.length, realURL = view.URL || view.webkitURL || view, real_create_object_URL = realURL.createObjectURL, real_revoke_object_URL = realURL.revokeObjectURL, URL = realURL, btoa = view.btoa, atob = view.atob, can_apply_typed_arrays = false, can_apply_typed_arrays_test = function(pass){
            can_apply_typed_arrays = !pass;
        }, ArrayBuffer = view.ArrayBuffer, Uint8Array = view.Uint8Array;
        FakeBlobBuilder.fake = FB_proto.fake = true;
        while (file_ex_code--) {
            FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
        }
        try {
            if (Uint8Array) {
                can_apply_typed_arrays_test.apply(0, new Uint8Array(1));
            }
        } 
        catch (ex) {
        }
        if (!realURL.createObjectURL) {
            URL = view.URL = {};
        }
        /*URL.createObjectURL = function(blob){
            var type = blob.type, data_URI_header;
            if (type === null) {
                type = "application/octet-stream";
            }
            if (blob instanceof FakeBlob) {
                data_URI_header = "data:" + type;
                if (blob.encoding === "base64") {
                    return data_URI_header + ";base64," + blob.data;
                }
                else 
                    if (blob.encoding === "URI") {
                        return data_URI_header + "," + decodeURIComponent(blob.data);
                    }
                if (btoa) {
                    return data_URI_header + ";base64," + btoa(blob.data);
                }
                else {
                    return data_URI_header + "," + encodeURIComponent(blob.data);
                }
            }
            else 
                if (typeof(real_create_object_url) !== "undefined") {
                    return real_create_object_url.call(realURL, blob);
                }
        };*/
        URL.revokeObjectURL = function(object_url){
            if (object_url.substring(0, 5) !== "data:" && real_revoke_object_url) {
                real_revoke_object_url.call(realURL, object_url);
            }
        };
        FBB_proto.append = function(data/*, endings*/){
            var bb = this.data;
            // decode data to a binary string
            if (Uint8Array && data instanceof ArrayBuffer) {
                if (can_apply_typed_arrays) {
                    bb.push(String.fromCharCode.apply(String, new Uint8Array(data)));
                }
                else {
                    var str = "", buf = new Uint8Array(data), i = 0, buf_len = buf.length;
                    for (; i < buf_len; i++) {
                        str += String.fromCharCode(buf[i]);
                    }
                }
                // what about bb.push?? missing
            }
            else 
                if (get_class(data) === "Blob" || get_class(data) === "File") {
                    if (FileReaderSync) {
                        var fr = new FileReaderSync;
                        bb.push(fr.readAsBinaryString(data));
                    }
                    else {
                        // async FileReader won't work as BlobBuilder is sync
                        throw new FileException("NOT_READABLE_ERR");
                    }
                }
                else 
                    if (data instanceof FakeBlob) {
                        if (data.encoding === "base64" && atob) {
                            bb.push(atob(data.data));
                        }
                        else 
                            if (data.encoding === "URI") {
                                bb.push(decodeURIComponent(data.data));
                            }
                            else 
                                if (data.encoding === "raw") {
                                    bb.push(data.data);
                                }
                    }
                    else {
                        if (typeof data !== "string") {
                            data += ""; // convert unsupported types to strings
                        }
                        // decode UTF-16 to binary string
                        // cancelled this ... 
                        //bb.push(unescape(encodeURIComponent(data)));
                        bb.push(data);
                    }
        };
        FBB_proto.getBlob = function(type){
            if (!arguments.length) {
                type = "";//type = null;
            }
            return new FakeBlob(this.data.join(""), type, "raw");
        };
        FBB_proto.toString = function(){
            return "[object BlobBuilder]";
        };
        FB_proto.slice = function(start, end, type){
            var args = arguments.length;
            if (args < 3) {
                type = null;
            }
            return new FakeBlob(this.data.slice(start, args > 1 ? end : this.data.length), type, this.encoding);
        };
        FB_proto.toString = function(){
            return "[object Blob]";
        };
        return FakeBlobBuilder;
    }(self));
    //end of BlobBuilder definition
	//console.log("break here");
	// load the actual scripts required
	for (var script in scriptsToLoadObj){
		if (scriptsToLoadObj.hasOwnProperty(script)){
			//loadScriptFile.call(window,sourceUrls[script],script,onScriptLoaded);
			loadScriptFile(sourceUrls[script],script,onScriptLoaded);
		}
	}
// end of function that defines BinaryHelper and everything else. Call it immediately	
}());