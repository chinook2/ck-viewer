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
	
	config: {
		src: null,
		file: null,
		
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
	
	initComponent: function(){
		var me = this;
		me.callParent(arguments);
		
		// Pass PDF file to load
		var file = this.getSrc();
		if(!file) file = this.getFile();
		if(file) file = '?file='+ this.getFullUrl(file);
		
		// Add iFrame with pdfjs viewer
		var pdfjsiFrame = new Ext.Component({
			// id: 'pdfjs_iframe',
			autoEl: {
				tag: 'iframe',
				style: 'height: 100%; width: 100%; border: none',
				src: Ck.getPath() + '/pdfjs/web/viewer.html'+ file
			},
			listeners: {
				afterrender: function () {
					this.getEl().on('load', function (evt, htmlElement, opt) {
						// Init PDF Viewer when iFrame is loaded
						me.initPDFViewer(htmlElement);
					});
				}
			}
		});
		this.add(pdfjsiFrame);
	},
	
	initPDFViewer: function(htmlElement){
		// Get document of the iFrame > access DIV ...
		this.doc = htmlElement.contentDocument;
		// Get window of the iFrame > access PDF JS functions 
		this.win = htmlElement.contentWindow;
		
		// Activate by defaut Drag mode
		this.win.HandTool.handTool.activate();
		
		// Check if we need to hide tools
		var tools = this.getHiddenTools();
		Ext.each(tools, function(tool, idx, a){
			this.hideTool(tool);
		}, this);
	},
		
	hideTool: function(toolName) {
		var t = this.doc.getElementById(toolName);
		var st = this.doc.getElementById('secondary' + Ext.String.capitalize(toolName));
		
		if(t) t.classList.add('hidden');
		if(st) st.classList.add('hidden');
	},
	
	showTool: function(toolName) {
		var t = this.doc.getElementById(toolName);
		var st = this.doc.getElementById('secondary' + Ext.String.capitalize(toolName));
		
		if(t) t.classList.remove('hidden');
		if(st) st.classList.remove('hidden');		
	},
	
	
	openFile: function(file) {
		this.win.PDFView.open( this.getFullUrl(file) );
	},
	
	gotoPage: function(page) {
		this.win.PDFView.page = page;
	},
	nextPage: function() {
		this.win.PDFView.page++;
	},
	previousPage: function(){
		this.win.PDFView.page--;
	},
	
	
	// From Ck.Controller ...
	getFullUrl: function (name) {
		var url = '';
		
		if(Ext.String.startsWith(name, 'http')) {
			return name;
		}

		// Static resource in ck-viewer package
		if(Ext.String.startsWith(name, 'ck-')) {
			url = Ck.getPath() + name;
		}
		// Static resource in application
		else if(Ext.String.startsWith(name, '/')) {
			// url = location.protocol +'//'+ location.host +'/resources' + name;
			url = '/resources' + name;
			url = url.replace('//', '/');
		}
		// Resource from Web Service (API Call)
		else {
			url = Ck.getApi() + name;
		}

		// Security for url path
		url = url.replace(/\.\./g, '');
		return url;
	}
});