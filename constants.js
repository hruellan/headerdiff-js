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
/** 
 * CONSTANTS DEFINITIONS
 */
// Maximum values that can be encoded for prefixes of a given length
// (Section 4.1.1 Integer Representation)
MAX_VALUES = {0: 0x00, 4: 0x0f, 5: 0x1f, 6: 0x3f, 8: 0xff, 14: 0x3fff};
// Constants used for representation (Section 3.2 Header Representation)
LITERAL_REPRESENTATION = 0;
INDEXED_REPRESENTATION = 1;
DELTA_REPRESENTATION = 2;
// Constants used for indexing
NO_INDEXING = 0;
INCREMENTAL_INDEXING = 1;
SUBSTITUTION_INDEXING = 2;
// Possible limits for delta prefixes
DELTA_LIMITS = ['/', '&', '?', '=', ',', ';', ' '];
// Pre-registered headers for requests (Appendix A.1)
REGISTERED_HEADERS_REQUESTS = [
	// Indexes 0 to 13 are always encoded on 1 byte
	'accept',
	'accept-charset',
	'accept-encoding',
	'accept-language',
	'cookie',
	'method',
	'host',
	'if-modified-since',
	'keep-alive',
	'url',
	'user-agent',
	'version',
	'proxy-connection',
	'referer',
	// Next indexes are encoded on 1 or 2 byte(s)
	'accept-datetime',
	'authorization',
	'allow',
	'cache-control',
	'connection',
	'content-length',
	'content-md5',
	'content-type',
	'date',
	'expect',
	'from',
	'if-match',
	'if-none-match',
	'if-range',
	'if-unmodified-since',
	'max-forwards',
	'pragma',
	'proxy-authorization',
	'range',
	'te',
	'upgrade',
	'via',
	'warning',
	];
// Pre-registered headers for responses (Appendix A.2)
REGISTERED_HEADERS_RESPONSES = [
	// Indexes 0 to 13 are always encoded on 1 byte
	'age',
	'cache-control',
	'content-length',
	'content-type',
	'date',
	'etag',
	'expires',
	'last-modified',
	'server',
	'set-cookie',
	'status',
	'vary',
	'version',
	'via',
	// Next indexes are encoded on 1 or 2 byte(s)
	'access-control-allow-origin',
	'accept-ranges',
	'allow',
	'connection',
	'content-disposition',
	'content-encoding',
	'content-language',
	'content-location',
	'content-md5',
	'content-range',
	'link',
	'location',
	'p3p',
	'pragma',
	'proxy-authenticate',
	'refresh',
	'retry-after',
	'strict-transport-security',
	'trailer',
	'transfer-encoding',
	'warning',
	'www-authenticate',
	];
