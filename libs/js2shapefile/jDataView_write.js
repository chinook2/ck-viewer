/**A prototype implementation of (parts of) the HTML5 DataView specification available at 
 * http://www.khronos.org/registry/typedarray/specs/latest/#8
 * Provides a way to _create_ "binary" data in browsers that do not have DataView (currently only Chrome does).
 * 
 * By Harry Gibson, CEH Wallingford
 * (c) 2012
 * ceh.ac.uk@harr1 / gmail.com@harry.s.gibson / reversed
 * GNU / GPL v3
 * 
 * Based on jsDataView at https://github.com/gmarty/jsDataView
 * which is read only. This is write only. 
 * (Maybe someone ought to combine them...)
 * Data are created as an ArrayBuffer if available and a JS array of ints if not.
 * Use the createEmptyBuffer(length) method to create a buffer of the best available type first,
 * then pass this to the constructor: 
 * var buf = jDataView_write.createEmptyBuffer(100); 
 * var vw = new jDataView_write(buf);
 * (The byteOffset and byteLength parameters are not used yet; the view will be of the whole buffer)
 * Retrieve the buffer using vw.getBuffer(), this will return either an ArrayBuffer or 
 * a binary string where each character's code represents the associated value.
 * Either are suitable for appending to BlobBuilder (implemented by eli grey)
*/

//var jDataView_write = //jDataView_write ||
//self.DataView ||
(function(){
var compatibility = {
		ArrayBuffer: typeof ArrayBuffer !== 'undefined',
		DataView: typeof DataView !== 'undefined' && 'getFloat64' in DataView.prototype
};
var jDataView_write = function(buffer,byteOffset,byteLength,debug){
		this._buffer = buffer;
		if (!(compatibility.ArrayBuffer && buffer instanceof ArrayBuffer) &&
			!(buffer instanceof Array)){
			throw new TypeError('Type Error');
		}
		this._isArrayBuffer = compatibility.ArrayBuffer && buffer instanceof ArrayBuffer;
		// FOR TESTING - log things to console
		this._log = debug;
		this._isDataView = compatibility.DataView && this._isArrayBuffer;
		// Default endian-ness for get/set methods - this has been added in jDataView but I am 
		// not implementing for now (as per standard DataView), use methods to set required value each time
		this._littleEndian = false; 
		var bufferLength = this._isArrayBuffer ? buffer.byteLength : buffer.length;
		// Start offset of view relative to its buffer - not implementing for now, will force 
		// view length = buffer length 
		var byteOffset=0;
		if (byteLength == undefined){ // which it is, until we implement it
			byteLength = bufferLength - byteOffset; // == bufferLength until byteOffset implemented
		}
		if (!this._isDataView){
		// Do additional checks to simulate DataView
			if (typeof byteOffset !== 'number') {
				throw new TypeError('Type error');
			}
			if (typeof byteLength !== 'number') {
				throw new TypeError('Type error');
			}
			if (typeof byteOffset < 0) {
				throw new Error('INDEX_SIZE_ERR: DOM Exception 1');
			}
			if (typeof byteLength < 0) {
				throw new Error('INDEX_SIZE_ERR: DOM Exception 1');
			}
		}
		if (this._isDataView) {
			this._view = new DataView(buffer, byteOffset, byteLength);
			this._start = 0;
		}
		this._start = byteOffset; // not using offset tracking stuff, just doing basic dataview
		if (byteOffset >= bufferLength) {
			throw new Error('INDEX_SIZE_ERR: DOM Exception 1');
		}
		this._offset = 0; // not using offset tracking stuff, just doing basic dataview
		this.length = byteLength;
	};
	
jDataView_write.createBuffer = function(){
	// left this in from jsDataView but not used - string array buffer type needs zero filling
	if (typeof ArrayBuffer !== 'undefined') {
		var buffer = new ArrayBuffer(arguments.length);
		var view = new Int8Array(buffer);
		for (var i = 0; i < arguments.length; ++i) {
			view[i] = arguments[i];
		}
		return buffer;
	}
	return String.fromCharCode.apply(null, arguments);
}
/**
 * Create a buffer for use in initialising a new jDataView_write. Buffer will either be an ArrayBuffer
 * or just a normal array initialised to 0 at each position. forceFake parameter provided for easier debugging
 * in firefox etc
 * @param {int} length
 * @param {boolean} forceFake
 */
jDataView_write.createEmptyBuffer = function(length,forceFake){
	// temporary replacement for createBuffer. If ArrayBuffer isn't available (or forceFake is 
	// set true, for debugging in a browser that does have ArrayBuffer), it creates 
	// a normal array containing zero at each position
	if (typeof ArrayBuffer !== 'undefined' && !forceFake){
		var buffer = new ArrayBuffer(length);
		return buffer;	
	}
	var buffer = [];
	for (var i=0;i<length;i++){
		buffer[i]=0x00;
	}
	return buffer;
}
// set all the write-value methods on the prototype. Define the prototype as a function that has 
// all the functions declared privately within it and which returns only those we want to expose as public,
// with a suitable binding to the instance
// This seems (?) to work as a way of giving private / public functions whilst still being able to define them
// only once on the prototype, unless I've missed something
// EDIT yes it works and the approach is documented at  
// http://webreflection.blogspot.com/2008/04/natural-javascript-private-methods.html
jDataView_write.prototype = (function(){
	//console.log("scope = "+scope);
	var _setUint8 = function(offset,value){
		// the fundamental method for setting a value, writing a single unsigned byte to the buffer 
		if (this._isArrayBuffer){
			// if arraybuffer is available then so is Uint8 typed array
			// need to rewrite other methods to do the same by iterating over the bytes of the input value
			// and setting into a Uint32Array etc, rather than calling this method and making a new 
			// Uint8Array for each byte... 
			try {
				(new Uint8Array(this._buffer, offset, 1))[0] = value;
			}
			catch (err){
				console.error("error setting value into array buffer at offset "+offset+ " value "+value+". Buffer length is "+this.length);
			}
		}
		else {
			//this._buffer[offset] = String.fromCharCode(value&0xff)
			//this._buffer[offset]=value;
			if (typeof(value)==="string") this._buffer[offset]=value.charCodeAt(0)
			else this._buffer[offset]=value;
		}
	}
	var _setInt8 = function(offset,value){
		if (value < 0){
			this.setUint8(offset,Math.pow(2,8)+value) // -1 will be stored as 255, -128 as 128, 
		}
		else {
			this.setUint8(offset,value);
		}
	}
	var _setUint16 = function(offset,value,littleEndian){
		if (this._isDataView) {
			// use the native dataview methods directly if they're available
			this._view.setUint16(offset, value, littleEndian);
		}
		else {
			var byte0 = Math.floor(value / Math.pow(2, 8));
			var byte1 = value % (Math.pow(2, 8));
			this.setUint8(_getOffsetOfByte(offset, 0, 2, littleEndian), byte0);
			this.setUint8(_getOffsetOfByte(offset, 1, 2, littleEndian), byte1);
		}
	}
	var _setInt16 = function(offset,value,littleEndian){
		if (this._isDataView) {
			this._view.setInt16(offset,value,littleEndian);
			return;
		}
		if (value < 0){
			var twoscomp = Math.pow(2,16)+value;
			this.setUint16(offset,twoscomp,littleEndian);
		}
		else {
			this.setUint16(offset,value,littleEndian);
		}
	}
	var _setUint32 = function(offset,value,littleEndian){
		if (this._isDataView){
			this._view.setUint32(offset,value,littleEndian);
			return;
		}
		var byte0 = value % 256; // least significant
		var byte1 = (value >>> 8) % 256;
		var byte2 = (value >>> 16) % 256;
		var byte3 = (value >>> 24) % 256; // most significant
		this.setUint8 (_getOffsetOfByte(offset,0,4,littleEndian),byte3);
		this.setUint8(_getOffsetOfByte(offset,1,4,littleEndian),byte2);
		this.setUint8 (_getOffsetOfByte(offset,2,4,littleEndian),byte1);
		this.setUint8(_getOffsetOfByte(offset,3,4,littleEndian),byte0);
	}
	var _setInt32 = function(offset,value,littleEndian){
		if (this._isDataView){
			this._view.setInt32(offset,value,littleEndian);
			return;
		}
		var bytesArray = _encodeInt(value,32,true); //bytesarray in LE order
		if (!littleEndian){bytesArray.reverse();} //bytes array is returned as little-endian
		if (this._log)console.log("About to set int32 value of "+value) 
		for (var bytenum=0;bytenum<bytesArray.length;bytenum+=1){
			//var offsetOfByte = this._getOffsetOfByte(offset,bytenum,4,littleEndian);
			// the array is in the right order for the required endian-ness so don't need to calculate the 
			// byte offset by working backwards
			var offsetOfByte = offset+bytenum; 
			var val = bytesArray[bytenum];
			if (this._log)console.log("LE: "+littleEndian+" setting byte "+bytenum+" of int32 to "+val+" or hex "+val.toString(16)+" at "+offsetOfByte);
			//this.setUint8(this._getOffsetOfByte(offset,bytenum,4,littleEndian),bytesArray[bytenum]);
			this.setUint8(offsetOfByte,val);
		}
	}
	var _setFloat32 = function(offset,value,littleEndian){
		if (this._isDataView){
			this._view.setFloat32(offset,value,littleEndian);
			return;
		}
		// now it gets tricky. single precision floating point format consists of:
		// 32 bits / 4 bytes where
		// bit 31 = sign
		// bits 30-23 = exponent
		// bits 22 - 0 = fraction
		// luckily someone else has already written a method for doing it 
		// which I have included as _encodeFloat...
		var bytesArray = _encodeFloat(value,23,8);
		if (!littleEndian){bytesArray.reverse();}
		for (var bytenum=0;bytenum<bytesArray.length;bytenum+=1){
			this.setUint8(_getOffsetOfByte(offset,bytenum,8,littleEndian),bytesArray[bytenum]);
		}	
	}
	var _setFloat64 = function(offset,value,littleEndian){
		if (this._isDataView){
			this._view.setFloat64(offset,value,littleEndian);
			return;
		}
		// 64 bits / 8 bytes, where 
		// bit 63 = sign, 0=positive, 1=non-positive
		// bits 62 - 62 = exponent (ll bits)
		// bits 51 - 0 = fraction (52 bits)
		var bytesArray = _encodeFloat(value,52,11); // method always returns in littleEndian order
		if (!littleEndian){bytesArray.reverse();}
		// debug setting
		if (this._log)console.log("About to set float64 value of "+value) 
		for (var bytenum=0;bytenum<bytesArray.length;bytenum+=1){
			//var offsetOfByte = this._getOffsetOfByte(offset,bytenum,8,littleEndian);
			// the array is in the right order for the required endian-ness so don't need to calculate the 
			// byte offset by working backwards
			var offsetOfByte = offset+bytenum; 
			var val = bytesArray[bytenum];
			// debug setting
			if (this._log)console.log("LE: "+littleEndian+" setting byte "+bytenum+" of float64 to "+val+" or hex "+val.toString(16)+" at "+offsetOfByte);
			this.setUint8(offsetOfByte,val);
			//this.setUint8(this._getOffsetOfByte(offset,bytenum,8,littleEndian),bytesArray[bytenum]);
		}
	}
	/** return the buffer associated with this jDataView_write in a format that can be used as input to
		 the append method of either real or fake blobs. Saves clients calling blob.append from checking what
		 they've got, as fake-buffers need joining and converting into a binary string whereas ArrayBuffers
		 can be used as is
	 */
	var _getBuffer = function(){
		if (this._isArrayBuffer) {
			return this._buffer;
		}
		else {
			var stringBuf; 
			if (this._buffer.map) {
				stringBuf=this._buffer.map(function(x){
					return String.fromCharCode(x & 0xff);
					//return "\x" + (x.toString(16).length == 1 ? "0" + x.toString(16) : x.toString(16))
				});
			}
			else { // no array map function in IE
				stringBuf=[];
				for (var i=0;i<this._buffer.length;i++){
					stringBuf.push(String.fromCharCode((this._buffer[i])&0xff));
				}
			}
			var binaryString = stringBuf.join("");
			//var output = unescape(encodeURIComponent(binaryString));
			//no, we'll let the caller deal with encoding if needed, not our problem here
			return binaryString;
		}
	}
	
	// "PRIVATE" UTILITY FUNCTIONS
	var _getOffsetOfByte = function(offset,pos,max,littleEndian){
		// left in for posterity as it's used in the original jDataview class however we're not using it
		// offset = the start byte of the number
		// pos = the byte within this number
		// max = the length of the value we're working with in bytes
		// littleEndian - whether we need to work right to left or not
		return offset + (littleEndian? max - pos - 1 : pos);
	}
	var _encodeFloat = function(value,precisionBits,exponentBits){
		// This function taken from binary parser by Jonas Raoni Soares Silva at 
		// http://jsfromhell.com/classes/binary-parser, with return object modified slightly to return 
		// array of ints rather than string
		// Returns float value as an array of length (precisionbits+exponentbits+1)/8, each member being 
		// the int value of that byte, ordered in little-endian order. 
		// See also "pack" at http://phpjs.org/functions/pack:880
		// and jspack at http://code.google.com/p/jspack/source/browse/
		var bias = Math.pow(2,exponentBits-1)-1;
		var minExp = -bias+1;
		var maxExp = bias;
		var minUnnormExp = minExp - precisionBits;
		var status = isNaN(n = parseFloat(value)) || n == -Infinity || n == +Infinity ? n : 0;
		var exp = 0;
		var len = 2*bias + 1 + precisionBits + 3;
		var bin = new Array(len);
		var signal = (n=status !== 0 ? 0 : n)<0;
		var n = Math.abs(n);
		var intPart = Math.floor(n);
		var floatPart = n-intPart;
		var i,lastBit,rounded,j,result;
		for (i=len;i;bin[--i]=0);
		for(i = bias + 2; intPart && i; bin[--i] = intPart % 2, intPart = Math.floor(intPart / 2));
		for(i = bias + 1; floatPart > 0 && i; (bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart);
		for(i = -1; ++i < len && !bin[i];);
		if(bin[(lastBit = precisionBits - 1 + (i = (exp = bias + 1 - i) >= minExp && exp <= maxExp ? i + 1 : bias + 1 - (exp = minExp - 1))) + 1]){
				if(!(rounded = bin[lastBit]))
					for(j = lastBit + 2; !rounded && j < len; rounded = bin[j++]);
				for(j = lastBit + 1; rounded && --j >= 0; (bin[j] = !bin[j] - 0) && (rounded = 0));
			}
		for(i = i - 2 < 0 ? -1 : i - 3; ++i < len && !bin[i];);
	
		(exp = bias + 1 - i) >= minExp && exp <= maxExp ? ++i : exp < minExp &&
			(exp != bias + 1 - len && exp < minUnnormExp && this.warn("encodeFloat::float underflow"), i = bias + 1 - (exp = minExp - 1));
		(intPart || status !== 0) && (this.warn(intPart ? "encodeFloat::float overflow" : "encodeFloat::" + status),
			exp = maxExp + 1, i = bias + 2, status == -Infinity ? signal = 1 : isNaN(status) && (bin[i] = 1));
		for(n = Math.abs(exp + bias), j = exponentBits + 1, result = ""; --j; result = (n % 2) + result, n = n >>= 1);
		for(n = 0, j = 0, i = (result = (signal ? "1" : "0") + result + bin.slice(i, i + precisionBits).join("")).length, r = [];
			i; n += (1 << j) * result.charAt(--i), j == 7 && 
				(r[r.length] = 
				//String.fromCharCode(n), // make it return array of ints not the binary string rep of them
				n, 
				n = 0), j = (j + 1) % 8);
		// commented out this line as it adds an empty string at the end, not sure why necessary:
		//r[r.length] = n ? String.fromCharCode(n) : "";
		return r; // array of bytes in little-endian order, reverse in caller if necessary		
	}
	var _encodeInt = function(number,bits,signed){
		// function modified from binary parser by Jonas Raoni Soares Silva at 
		// http://jsfromhell.com/classes/binary-parser
		var max = Math.pow(2, bits), r = [];
		(number >= max || number < -(max >> 1)) && this.warn("encodeInt::overflow") && (number = 0);
		number < 0 && (number += max);
		for(; number; r[r.length] = 
			//String.fromCharCode(number % 256),
			number % 256, 
		number = Math.floor(number / 256));
		for(bits = -(-bits >> 3) - r.length; bits--; r[r.length] = "\0");
		return r; // array of bytes in little-endian order, reverse in caller if necessary
	}
	// END OF PROTOTYPE FUNCTION DEFINITIONS
	// return prototype object containing the prototype functions we want to be "public" i.e. visible, bound to the 
	// scope of the instance they're associated with
	return {
		constructor: jDataView_write,
		setInt8: function(){
			return _setInt8.apply(this,arguments)
		},
		setUint8: function(){
			return _setUint8.apply(this,arguments);
		},
		setInt16: function(){
			return _setInt16.apply(this,arguments);
		},
		setUint16: function(){
			return _setUint16.apply(this,arguments);
		},
		setInt32: function(){
			return _setInt32.apply(this,arguments);
		},
		setUint32: function(){
			return _setUint32.apply(this,arguments);
		},
		setFloat32: function(){
			return _setFloat32.apply(this,arguments);
		},
		setFloat64: function(){
			return _setFloat64.apply(this,arguments);
		},
		getBuffer: function(){
			return _getBuffer.apply(this,arguments);
		}
	}
	// END OF PROTOTYPE DEFINITION - Now call function immediately to return the prototype object we want
	})();
// define jDataView_write, with all of the stuff we've just defined, as being an object of the global self 
self.jDataView_write = jDataView_write;
// execute all this immediately
})();