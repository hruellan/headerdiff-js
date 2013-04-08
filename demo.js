/*
 * Copyright (c) 2012-2013, Canon Inc. 
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted only for the purpose of developing standards
 * within the HTTPbis WG and for testing and promoting such standards within the
 * IETF Standards Process. The following conditions are required to be met:
 * - Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * - Neither the name of Canon Inc. nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without
 *   specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY CANON INC. AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL CANON INC. AND ITS CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var ENCODER;
var DECODER;
var TEST_NB = 0;

function init() {
	var TABLE_SIZE = 4096;
	TEST_NB = 0;
	// Request or response?
	var select = document.getElementById('reqResp');
	var isRequest = select.options[select.selectedIndex].value == "request";
	// Create encoder and decoder
	ENCODER = new HeaderDiffSimpleEncoder(TABLE_SIZE);
	ENCODER.init(isRequest);
	DECODER = new HeaderDiffSimpleDecoder(TABLE_SIZE);
	DECODER.init(isRequest);
	var data = "<tr>";
	data+= '<td class="result top">Header Name</td>';
	data+= '<td class="result top">Header Value</td>';
	data+= '<td class="result top">Representation</td>';
	data+= '<td class="result top">Indexing</td>';
	data+= '<td class="result top">Encoded Bytes</td>';
	data+= '<td class="result top">Decoding</td>';
	data+= "</tr>";
	document.getElementById('encodedData').innerHTML = data;

	setSampleRequest(0);
}

function reset() {
	init();
}

SAMPLE_REQUESTS = [
	'[{"name": "url", "value": "http://www.example.org/my-example/index.html"},\n'
	+ '{"name": "user-agent", "value": "my-user-agent"},\n'
	+ '{"name": "x-my-header", "value": "first"}]',
	'[{"name": "url", "value": "http://www.example.org/my-example/resources/script.js"},\n'
	+ '{"name": "user-agent", "value": "my-user-agent"},\n'
	+ '{"name": "x-my-header", "value": "second"}]',
	'[{"name": "url", "value": "http://www.example.org/my-example/resources/style.css"},\n'
	+ '{"name": "user-agent", "value": "my-user-agent"},\n'
	+ '{"name": "x-my-header", "value": "second"}]'
];
function setSampleRequest(reqID) {
	document.getElementById('jsonInput').value = SAMPLE_REQUESTS[reqID];
}

function roundTrip() {

	var headerTuples = JSON.parse(document.getElementById('jsonInput').value);

	var result = ENCODER.encodeHeaders(headerTuples);
	var stream = result[0];
	var headerRepresentations = result[1];
	var decodedHeaders = DECODER.decodeHeaders(stream);
	var setName = "Request";
	if (!ENCODER.isRequest) setName = "Response";
	setName+= " #" + TEST_NB;
	TEST_NB++;
	displayEncodedHeaders(setName, headerTuples, stream, headerRepresentations, decodedHeaders);
}

/**
 * Display-related code
 */

REPRESENTATIONS = ['Literal', 'Indexed', 'Delta'];
INDEXINGS = ['None', 'Incremental', 'Substitution'];

function displayEncodedHeaders(headersID, headerTuples, stream, headerRepresentations, decodedHeaders) {
	displayNewSet(headersID, computeTextSize(headerTuples), stream.length, 'encodedData');
	for (var i = 0; i < headerRepresentations.length; i++) {
		displayEncodedHeader(headerTuples[i].name, headerTuples[i].value, 
							headerRepresentations[i],
							decodedHeaders[i][0], decodedHeaders[i][1]);
	}
}

function displayNewSet(setID, originalSize, encodedSize, table) {
	var data = "<tr>";
	data+= "<td class='result newSet' colspan='6'>" + setID + " ";
	data+= "(Original size: " + originalSize;
	data+= " bytes; Encoded size: " + encodedSize;
	data+= " bytes; Ratio: " 
	data+= Math.round((1000*encodedSize/originalSize))/10 + "%";
	data+= ")";
	data+= "</td>";
	data+= "</tr>";
	document.getElementById(table).innerHTML+= data;
}

function displayEncodedHeader(name, value, representation, decodedName, decodedValue) {
	var data = "<tr>";
	data+= "<td class='result'>" + name + "</td>";
	data+= "<td class='result'>" + value + "</td>";
	data+= "<td class='result center'>" + REPRESENTATIONS[representation.representation] + "</td>";
	data+= "<td class='result center'>" + INDEXINGS[representation.indexing] + "</td>";
	data+= "<td class='result'>";
	var i = 0;
	var bytes = representation.encodedBytes;
	var previousIsString = false;
	while (i < bytes.length) {
		var b = bytes[i];
		if (typeof b == 'string' && b.length > 2 && b[0] == '0' && b[1] == 'x') {
			if (previousIsString) {
				data+= "<br/>";
				previousIsString = false;
			}
			data+= b + " ";
			i++;
		}
		else {
			var s = "";
			while (i < bytes.length && 
				!(typeof bytes[i] == 'string' && bytes[i].length > 2 && bytes[i][0] == '0' && bytes[i][1] == 'x')) {
				s+= bytes[i];
				i++;
			}
			data+= "<br/>" + decodeURIComponent(s);
			previousIsString = true;
		}
	}
	data+= "</td>";
	data+= "<td class='result center'>";
	if (name == decodedName && value == decodedValue) {
		data+= "OK";
	}
	else {
		data+= "Invalid decoding";
		data+= "<br/>" + decodedName + ": " + decodedValue;
	}
	data+= "</td>";
	data+= "</tr>";
	document.getElementById("encodedData").innerHTML+= data;
}

function computeTextSize(headerTuples) {
	var size = 0;
	for (var i = 0; i < headerTuples.length; i++) {
		var data = headerTuples[i].name + ": " + headerTuples[i].value;
		size+= data.length;
	}
	return size;
}
