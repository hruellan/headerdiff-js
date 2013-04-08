/** 
CONSTANTS DEFINITIONS
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
