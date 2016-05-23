/**
 *
	Options after the #

	Example: http://mozilla.github.io/pdf.js/web/viewer.html#page=2

	page: page number. Example: page=2
	zoom: zoom level. Example: zoom=200 (accepted formats: `[zoom],[left],[top]`, `page-width`, `page-height`, `page-fit`, `auto`)
	nameddest: go to a named destination
	pagemode: either "thumbs" or "bookmarks". Example: pagemode=thumbs
	
	
	Options after the ?

	Example: http://mozilla.github.io/pdf.js/web/viewer.html?file=compressed.tracemonkey-pldi-09.pdf 
	
	file: the path of the PDF file to use (must be on the same server due to JavaScript limitations). Please notice that the path/URL must be encoded using encodeURIComponent(), e.g. "/viewer.html?file=%2Fpdf.js%2Fweb%2Fcompressed.tracemonkey-pldi-09.pdf"	
 */

 Ext.define("Ck.PdfViewer", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckpdfviewer",
	opening: null,
	
	config: {
		file: '',
		
		/**
		 * List of tools & commands to hide
		 
			sidebarToggle
			viewFind
			previous
			next
			presentationMode
			openFile
			print
			download
			viewBookmark
			
			firstPage
			lastPage
			pageRotateCw
			pageRotateCcw

			toggleHandTool

			documentProperties
			
			//secondaryToolbarToggle
		 */
		hiddenTools: []
		
	},
	
	// To be override to add specific process when pdf viewer is loaded
	onLoaded: Ext.emptyFn,
	
	initComponent: function(){
		var me = this;
		me.callParent(arguments);
		
		// Add iFrame with pdfjs viewer (?file= prevent loading default PDF)
		var pdfjsiFrame = new Ext.Component({
			// id: 'pdfjs_iframe',
			autoEl: {
				tag: 'iframe',
				style: 'height: 100%; width: 100%; border: none',
				src: Ck.getPath() + '/pdfjs/web/viewer.html?file='
			},
			listeners: {
				afterrender: function () {
					this.getEl().on('load', function (evt, htmlElement, opt) {
						// Init PDF Viewer when iFrame is loaded
						me.initPDFViewer(htmlElement);
					}, this, {single: true});
				}
			}
		});
		this.add(pdfjsiFrame);
	},
	
	initPDFViewer: function(htmlElement){
		var me = this;
		// Get document of the iFrame > access DIV ...
		me.doc = htmlElement.contentDocument;
		// Get window of the iFrame > access PDF JS functions 
		me.win = htmlElement.contentWindow;
		
		// Activate by defaut Drag mode
		me.win.HandTool.handTool.activate();
		
		// Check if we need to hide tools
		var tools = me.getHiddenTools();
		Ext.each(tools, function(tool, idx, a){
			me.hideTool(tool);
		});
		
		// Init event		
		me.win.addEventListener('pagechange', function(evt) {
			// console.log('test ' + evt.pageNumber);
			var page = evt.pageNumber;
			if (evt.previousPageNumber !== page) {
				me.fireEvent('pagechange', page);
			}
		}, true);
		
		// pdfViewer iframe loaded
		me.fireEvent('loaded');
		me.onLoaded();
	},
	
	hideTool: function(toolName) {
		if(!this.doc) {
			this.reCall();
			return;
		}
		
		var t = this.doc.getElementById(toolName);
		var st = this.doc.getElementById('secondary' + Ext.String.capitalize(toolName));
		
		if(t) t.classList.add('hidden');
		if(st) st.classList.add('hidden');
	},
	
	showTool: function(toolName) {
		if(!this.doc) {
			this.reCall();
			return;
		}
		
		var t = this.doc.getElementById(toolName);
		var st = this.doc.getElementById('secondary' + Ext.String.capitalize(toolName));
		
		if(t) t.classList.remove('hidden');
		if(st) st.classList.remove('hidden');		
	},
	
	// Call when 'file' config update - usefull with bind / load default pdf if 'file' is passed directly too
	updateFile: function(newFile, oldFile) {
		if(this.opening) return; // Prevent openFile twice when call setFile from openFile !
		this.openFile(newFile);
	},
	
	openFile: function(file) {
		if(!this.win) {
			this.reCall();
			return;
		}
		this.opening = true;
		
		if(file==''){
			if(this.win.PDFView.pdfDocument) this.win.PDFView.close();
		} else {
			// Update current file using builtIn setter
			this.setFile(file);
			this.win.PDFView.open( this.getFullFile(file) );
		}
		
		this.opening = false;
	},
	
	gotoPage: function(page) {
		if(!this.win) {
			this.reCall();
			return;
		}
		this.win.PDFView.page = page;
	},
	
	nextPage: function() {
		if(!this.win) {
			this.reCall();
			return;
		}
		this.win.PDFView.page++;
	},
	
	previousPage: function(){
		if(!this.win) {
			this.reCall();
			return;
		}
		this.win.PDFView.page--;
	},
	
	reCall: function() {
		// Get function caller. function who call the reCall... and need to be re call
		var caller = arguments.callee.caller;
		var args = caller.arguments;
		this.on('loaded', function(){
			if(Ext.isFunction(caller)) caller.apply(this, args);
		}, this, {single: true});
	},
	
	// From Ck.Controller ...
	getFullFile: function (name) {
		var file = '';

		if(name){
			// Already full file path/url
			if(Ext.String.startsWith(name, 'http')) {
				file = name;
			}
			// Static resource in ck-viewer package
			else if(Ext.String.startsWith(name, 'ck-')) {
				file = Ck.getPath() + name;
			}
			// Static resource in application
			else if(Ext.String.startsWith(name, '/')) {
				// file = location.protocol +'//'+ location.host +'/resources' + name;
				file = '/resources' + name;
				file = file.replace('//', '/');
			}
			// Resource from Web Service (API Call)
			else {
				file = Ck.getApi() + name;
			}

			// Security for file path
			file = file.replace(/\.\./g, '');
		}
		
		return file;
	}
});