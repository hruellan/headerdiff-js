/**
Constants defined in constants.js
*/

/**
Class used by Encoder for storing indexed headers
(See Section 3.1.1 Header Table)
*/
function IndexedHeader(name, value, index) {
	this.name = name;
	this.value = value;
	this.index = index;
	// Full is used by encoder as a key to find an indexed header
	this.full = name + value;
	// Age is used by encoder when determining header representation
	this.age = 0;
}

/**
Class used by Encoder for defining a header representation
(See Section 3.2 Header Representation)
*/
function HeaderRepresentation() {
	this.representation = LITERAL_REPRESENTATION;
    this.referenceHeader = undefined;
    this.indexing = NO_INDEXING;
    this.commonPrefixLength = 0;
	this.encodedBytes = new Array();//For the purpose of this demo, store encoded bytes
}

/**
HeaderDiff encoder
*/
// Constructor
function HeaderDiffSimpleEncoder(maxIndexedSize) {
	this.indexedHeadersMaxSize = maxIndexedSize;
}
// Init method
HeaderDiffSimpleEncoder.prototype.init = function(isRequest) {
	this.isRequest = isRequest;
	this.headersTable = new Object();
	this.headersTableSize = 0;
	this.headerNamesTable = new Object();
	var registeredHeaderNames = REGISTERED_HEADERS_REQUESTS;
	if (!isRequest) {
		registeredHeaderNames = REGISTERED_HEADERS_RESPONSES;
	}
	for (var i = 0; i < registeredHeaderNames.length; i++) {
		this.headerNamesTable[registeredHeaderNames[i]] = i;
	}
}
// Encode set of headers
HeaderDiffSimpleEncoder.prototype.encodeHeaders = function(headerTuples) {
	// Before encoding, increment age of indexed headers
	for (var key in this.headersTable) {
		this.headersTable[key].age++;
	}
	// Encode the number of headers on a single byte
	var headerRepresentations = new Array(); // For the purpose of this demo, store representations
	this.stream = new Array();
	this.stream.push(headerTuples.length);
	// Then, encode headers
	for (var i = 0; i < headerTuples.length; i++) {
		var headerName = headerTuples[i].name;
		var headerValue = headerTuples[i].value;
		var headerFull = headerName + headerValue;
		var startIndex = this.stream.length;
		// Determine representation
		var hr = this.determineRepresentation(headerName, headerValue);
		headerRepresentations.push(hr);
		// Encode representation
		if (hr.representation == INDEXED_REPRESENTATION) {
			/**
			Indexed Representation
			*/
			if (hr.referenceHeader.index < 64) {
				// Short index (see Section 4.2.1 Short Indexed Header)
				var b = 0x80 | hr.referenceHeader.index;
				this.writeByte(b);
			}
			else {
				// Long index (see Section 4.2.2 Long Indexed Header)
				var b = 0xc0;
				this.writeInteger(b, 14, hr.referenceHeader.index - 64)
			}
		}
		else {
			/**
			Set indexing bits (same process for delta and literal)
			(see Sections 4.3 Literal Header and 4.4 Delta Header)
			*/
			// First byte to be encoded (no flag if no indexing)
			var b = 0x00;
			// Length of prefix bits (available for encoding an intenger)
			//  - 5 bits if no indexing (see 4.3.1 and 4.4.1)
            //  - 4 bits if indexing  (see 4.3.2 and 4.4.2)
			var prefixBits = 5;
			if (hr.indexing != NO_INDEXING) prefixBits = 4;
			if (hr.indexing == SUBSTITUTION_INDEXING) {
				// Set substitution indexing flag
				b = 0x30;
				// Remove replaced header, add new one and update table size
                // (as defined in Section 3.1.1 Header Table)
				delete this.headersTable[hr.referenceHeader.full]
				this.headersTable[headerFull] = new IndexedHeader(
						headerName, headerValue, hr.referenceHeader.index);
				this.headersTableSize-= hr.referenceHeader.value.length;
				this.headerTableSize+= headerValue.length;
			}
			else if (hr.indexing == INCREMENTAL_INDEXING) {
				// Set incremental indexing flag
				b = 0x20;
				// Add new header and update table size
				// (as defined in Section 3.1.1 Header Table)
				this.headersTable[headerFull] = new IndexedHeader(
						headerName, headerValue, Object.keys(this.headersTable).length);
				this.headersTableSize+= headerValue.length;
			}
			/** 
			Serialize using delta or literal representation
			(see Sections 4.3 Literal Header and 4.4 Delta Header)
			 */
			if (hr.representation == DELTA_REPRESENTATION) {
				// Delta Representation (see Sections 4.4.1 and 4.4.2)
				// Set '01' at the beginning of the byte (delta representation)
				b = b | 0x40;
				// Encode reference header index
				this.writeInteger(b, prefixBits, hr.referenceHeader.index);
				// Encode common prefix length
				this.writeInteger(b, 0, hr.commonPrefixLength);
			}
			else {
				// Literal Representation (see Sections 4.3.1 / 4.3.2)
                // '00' at the beginning of the byte (nothing to do)
                // Determine index of header name
                // (see Section 3.1.2 Name Table)
				var nameIndex = -1;
				if (headerName in this.headerNamesTable) {
					nameIndex = this.headerNamesTable[headerName];
				}
				else {
					this.headerNamesTable[headerName] = Object.keys(this.headerNamesTable).length;
				}
				// Encode index + 1 (0 represents a new header name)
				this.writeInteger(b, prefixBits, nameIndex+1)
				if (nameIndex == -1) {
					this.writeLiteralString(headerName);
				}
				if (hr.indexing == SUBSTITUTION_INDEXING) {
					this.writeInteger(b, 0, hr.referenceHeader.index);
				}
			}
			// Encode value
			var valueToEncode = headerValue;
			if (hr.representation == DELTA_REPRESENTATION) {
				valueToEncode = headerValue.substring(hr.commonPrefixLength, 
													headerValue.length)
			}
			this.writeLiteralString(valueToEncode);
		}
		hr.encodedBytes = this.stream.slice(startIndex, this.stream.length);
	}
	return [this.stream, headerRepresentations];
}
// Determine header representation (encoder side only)
HeaderDiffSimpleEncoder.prototype.determineRepresentation = function(headerName, headerValue) {
	// Default representation: literal without indexing
	var hr = new HeaderRepresentation();
	// Check possibility of indexed representation
	var headerFull = headerName + headerValue
	if (headerFull in this.headersTable) {
		hr.representation = INDEXED_REPRESENTATION;
		hr.referenceHeader = this.headersTable[headerFull];
		return hr
	}
	// Check possibility for delta representation
	var deltaSubstitutionHeader = undefined;
	// Length of common prefix in case of delta encoding
	var commonPrefixLength = 0;
	// Length added to indexed data in case of delta substitution indexing
	var deltaSubstitutionAddedLength = 0;
	for (var hf in this.headersTable) {
		var indexedHeader = this.headersTable[hf];
		if (indexedHeader.name == headerName) {
			// Determine common prefix length between value to encode and
			// indexed header value
			var iv = indexedHeader.value;
			var k = 0;
			while (k < Math.min(headerValue.length, iv.length)) {
				if (headerValue[k] == iv[k]) {
					k+= 1;
				}
				else {
					break;
				}
			}
			// Then, go backward to stop on first autorized character for end of prefix
			var validEnd = false;
			while (k >= 0 && !validEnd) {
				for (var m = 0; m < DELTA_LIMITS.length; m++) {
					if (iv[k] == DELTA_LIMITS[m]) {
						validEnd = true;
					}
				}
				if (validEnd) {
				k++;
					break;
				}
				k--;
			}
			if (k >= commonPrefixLength) {
				commonPrefixLength = k;
				deltaSubstitutionHeader = indexedHeader;
				deltaSubstitutionAddedLength = headerValue.length - indexedHeader.value.length;
			}
		}
	}
	// Look for least recently used indexed header
	// (it may be selected for literal substitution)
	var leastRecentlyUsedHeader = undefined;
	var ageThreshold = 15;
	for (var hf in this.headersTable) {
		indexedHeader = this.headersTable[hf];
		if (indexedHeader.age > ageThreshold) {
			if (leastRecentlyUsedHeader == undefined
				|| indexedHeader.age > leastRecentlyUsedHeader.age) {
				leastRecentlyUsedHeader = indexedHeader;
			}
		}
	}
	/**
	Determine encoding mode based on parameters
	*/
	// Check whether indexing this header would be ok with size constraint
	var lengthOK = this.headersTableSize + headerValue.length < this.indexedHeadersMaxSize;
	// Check whether replacing best match by this header in indexed
	// headers table would be ok
	var deltaSubstitutionLengthOK = 
	  this.headersTableSize + deltaSubstitutionAddedLength < this.indexedHeadersMaxSize;
	// Novelty is required for requests if header table size is "small"
	var requireNovelty = this.isRequest && this.indexedHeadersMaxSize < 10000;
	if (commonPrefixLength > 1) {
		// Use delta encoding
		hr.representation = DELTA_REPRESENTATION;
		hr.referenceHeader = deltaSubstitutionHeader;
		hr.commonPrefixLength = commonPrefixLength;
		var isNovel = deltaSubstitutionAddedLength > 15;
		if (!requireNovelty) {
			isNovel = true;
		}
		if (isNovel && lengthOK) {
			hr.indexing = INCREMENTAL_INDEXING;
		}
		else if (deltaSubstitutionLengthOK) {
			hr.indexing = SUBSTITUTION_INDEXING;
		}
	}
	else {
		// Use literal encoding
		// Substitution is used only for requests with "small" table size
		if (this.isRequest && this.indexedHeadersMaxSize < 10000 && leastRecentlyUsedHeader != undefined) {
			// Determine whether enough room is available for literal substitution
			var newDataLength = headerValue.length - leastRecentlyUsedHeader.value.length;
			var remainingSize = this.indexedHeadersMaxSize - this.headersTableSize;
			if (remainingSize > newDataLength) {
				hr.indexing = SUBSTITUTION_INDEXING;
				hr.referenceHeader = leastRecentlyUsedHeader;
			}
		}
		else if (lengthOK) {
			hr.indexing = INCREMENTAL_INDEXING;
		}
	}
	
	return hr;
}
// Write byte to stream
HeaderDiffSimpleEncoder.prototype.writeByte = function(value) {
	var s = value.toString(16);
	if (s.length == 1) {
		s = "0" + s;
	}
	// Byte is not encoded for real but pretty-printed
	this.stream.push("0x" + s.toUpperCase());
}
// Write integer
HeaderDiffSimpleEncoder.prototype.writeInteger = function(currentByte, prefixBits, integerValue) {
	if (integerValue < MAX_VALUES[prefixBits]) {
		if (prefixBits <= 8) {
			currentByte = currentByte | integerValue;
			this.writeByte(currentByte);
		}
		else {
			var b1 = currentByte | (integerValue >> 8);
			var b2 = integerValue & 0xff;
			this.writeByte(b1);
			this.writeByte(b2);
		}
	}
	else {
		if (prefixBits > 0) {
			currentByte = currentByte | MAX_VALUES[prefixBits];
			this.writeByte(currentByte);
		}
		integerValue = integerValue - MAX_VALUES[prefixBits];
		if (integerValue == 0) {
			this.writeByte(0);
		}
		while (integerValue > 0) {
			var b = 0;
			var r = integerValue % 128;
			var q = (integerValue - r)/128;
			if (q > 0) {
				b = 0x80;
			}
			b = b | r;
			this.writeByte(b);
			integerValue = q;
		}
	}
}
// Write string
HeaderDiffSimpleEncoder.prototype.writeLiteralString = function(value) {
	// Determine bytes to encode (each character may not be a single byte)
	var singleByteChars = new Array();
	for (var i = 0; i < value.length; i++) {
		var uri = encodeURIComponent(value[i]);
		var chars = uri; // Most common case: character represented as a single byte
		if (uri.length > 1) {
			// More than 1 byte for this character
			var bytes = chars.split('%');
			chars = new Array();
			for (var k = 0; k < bytes.length; k++) {
				if (bytes[k] != "") {
					chars.push('%' + bytes[k]);
				}
			}
		}
		// Consider each byte
		for (var j = 0; j < chars.length; j++) {
			singleByteChars.push(chars[j]);
		}
	}
	this.writeInteger(0, 0, singleByteChars.length);
	for (var i = 0; i < singleByteChars.length; i++) {
		// Byte is not encoded for real
		this.stream.push(singleByteChars[i]);
	}
}

/**
HeaderDiff decoder
*/
// Constructor
function HeaderDiffSimpleDecoder(maxIndexedSize) {
	this.indexedHeadersMaxSize = maxIndexedSize;
}
// Init method
HeaderDiffSimpleDecoder.prototype.init = function(isRequest) {
	this.isRequest = isRequest;
	this.headersTable = new Array();
	this.headersTableSize = 0;
	this.headerNamesTable = new Array();
	var registeredHeaderNames = REGISTERED_HEADERS_REQUESTS;
	if (!isRequest) {
		registeredHeaderNames = REGISTERED_HEADERS_RESPONSES;
	}
	for (var i = 0; i < registeredHeaderNames.length; i++) {
		this.headerNamesTable[i] = registeredHeaderNames[i];
	}
}
// Decode headers
HeaderDiffSimpleDecoder.prototype.decodeHeaders = function(encodedStream) {
	this.stream = encodedStream;
	this.streamIndex = 0;
	var headers = new Array();// List of decoded headers
	var nb = this.readNextByte();// Decode number of headers
	
	while (headers.length < nb) {
		/**
		Check size of indexed data (this is not necessary, but it allows
		ensuring that encoder has the right behavior)
		*/
		if (this.headersTableSize > this.indexedHeadersMaxSize) {
			throw new Error("Header table exceeds max size (" 
				 + this.headersTableSize + " VS " + this.indexedHeadersMaxSize + ")");
		}
		/**
		Start decoding of next header
		*/
		var b0 = this.readNextByte();
		if ((b0 & 0x80) != 0) {
			/**
			Decoding of an already indexed header
			(see Section 4.2 Indexed Header Representation)
			*/
			var index = b0 & 0x3f;
			if ((b0 & 0x40) != 0) {
				// Long index (see Section 4.2.2)
				index = this.readInteger(b0, 14) + 64;
			}
			// Add decoded header to the list
            headers.push(this.headersTable[index])
		}
		else {
			/**
			Decoding of a header not already indexed 
            (see Sections 4.3 Literal Header Representation 
			and 4.4 Delta Header Representation)  
			*/
			// Initialize variables
			var name = ''; // Decoded header name
			var value = ''; // Decoder header value
			// Index of header used as a reference for delta encoding and/or substitution indexing
			var referenceIndex = 0
			// Remark: indexing flags are similar for literal and delta representations
			var incrementalIndexing = (b0 & 0x30) == 0x20;
			var substitutionIndexing = (b0 & 0x30) == 0x30;
			var indexFlag = incrementalIndexing || substitutionIndexing;
			// Length of prefix bits (available for encoding an integer)
			//  - 5 bits if no indexing (see 4.3.1 and 4.4.1)
			//  - 4 bits if indexing  (see 4.3.2 and 4.4.2)
			prefixBits = 5;
			if (indexFlag) prefixBits = 4;
			if ((b0 & 0x40) != 0){ // Check whether header is encoded as a delta
				/**
				Decoding of a delta encoded header 
				(see Section 4.4 Delta Header Representation)
				*/
				// Decode index of header referred to in this delta
				referenceIndex = this.readInteger(b0, prefixBits);
				// Name can now be determined based on referenceIndex
				name = this.headersTable[referenceIndex][0];
				// Also decode common prefix length
				prefixLength = this.readInteger(b0, 0);
			}
			else {
				/**
				Decoding of a literally encoded header 
				(see Section 4.3 Literal Header Representation)
				*/
				// Determine header name (index+1 is encoded in the stream)
				var ref = this.readInteger(b0, prefixBits);
				if (ref == 0) {
					// Index 0 means new literal string
					name = this.readLiteralString();
					this.headerNamesTable.push(name);
				}
				else {
					name = this.headerNamesTable[ref-1];
				}
				// If substitution indexing, decode reference header index
				if (substitutionIndexing) {
					referenceIndex = this.readInteger(b0, 0);
				}
			}
			/**
			Decoding of header value
			*/
			value = this.readLiteralString();
			// If delta representation, apply delta to obtain full value
			if ((b0 & 0x40) == 0x40) {
				prefix = this.headersTable[referenceIndex][1]
				value = prefix.substring(0, prefixLength) + value
			}
			// Add decoded headers
			headers.push([name, value])
			/**
			Apply indexing mode              
			(see section 3.1.1 Header Table)
			*/
			if (substitutionIndexing) {
				// Replace reference header
				reference = this.headersTable[referenceIndex];
				this.headersTable[referenceIndex] = [name, value];
				// Reference header value is accessible through reference[1]
				referenceValue = reference[1];
				this.headersTableSize+= value.length - referenceValue.length;
			}
			else if (incrementalIndexing) {
				// Append to end as a new index
				this.headersTable.push([name, value]);
				this.headersTable.Size+= value.length;
			}
		}
	}

	return headers;
}

// Read next byte of encoded stream
HeaderDiffSimpleDecoder.prototype.readNextByte = function() {
	var b = this.stream[this.streamIndex++];
	if ((typeof b == 'string') && b[0] == '0' && b[1] == 'x') {
		b = parseInt(b.substring(2, b.length), 16);
	}
	return b;
}

// Read integer in encoded stream
HeaderDiffSimpleDecoder.prototype.readInteger = function(currentByte, prefixBits) {
	var value = currentByte;
	if (prefixBits <= 8) {
		value = value & MAX_VALUES[prefixBits];
	}
	else {
		value = value & MAX_VALUES[prefixBits - 8];
		value = (value << 8) | (this.readNextByte() & MAX_VALUES[8]);
	}
	if (value == MAX_VALUES[prefixBits]) {
		value = MAX_VALUES[prefixBits];
		// Read (value-(MAX_VALUES[prefixBits]+1)) on next bits
		var b = this.readNextByte();
		var f = 1;
		while ((b & 0x80) > 0) {
			value+= (b & 0x7f)*f;
			f = f*128;
			b = this.readNextByte();
		}
		value+= b*f;
	}
	return value;
}

// Read literal string in encoded stream
HeaderDiffSimpleDecoder.prototype.readLiteralString = function() {
	var length = this.readInteger(0, 0); // No prefix bits
	var value = "";
	for (var i = 0; i < length; i++) {
		value+= this.readNextByte();
	}
	return decodeURIComponent(value);
}




