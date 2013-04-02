// GIVit plugin functions

function ampersify(str) {
	return str.replace(/^@(\w+?)\b(?!\.\w)|\s@(\w+?)\b(?!\.\w)/g,' <a href="https://github.com/$1$2">@$1$2</a>').replace(/^\s+/,'');
}

function openpage(num) {
	window.location.hash = '#'+num;
	window.location.reload(true);
}

function scrollToTop() {
	$.scrollTo(0, { duration: 1000 })
}

function easteregg(num) {
	alert("Hey, what are you doing poking around down here? You better not check the developer's console!");
	console.log('shhh... secret url:http://www.. 0111000001101100011000010110111001100101011101000110100001100001011100100110111101101100011001000010111001100011011011110110110100101111011100000111001001101111011010100110010101100011011101000111001100101111011001110110100101110110011010010111010000101111011001010110000101110011011101000110010101110010011001010110011101100111'); // convert to askey
}

// CORS bug-fix for Firefox:
(function () {
  var _super = jQuery.ajaxSettings.xhr,
    xhrCorsHeaders = [ "Link" ];
  jQuery.ajaxSettings.xhr = function () {
    var xhr = _super(),
      getAllResponseHeaders = xhr.getAllResponseHeaders;
    xhr.getAllResponseHeaders = function () {
      var allHeaders = "";
      try {
        allHeaders = getAllResponseHeaders.apply( xhr );
        if ( allHeaders ) {
          return allHeaders;
        }
      } catch ( e ) {
      }
      $.each( xhrCorsHeaders, function ( i, headerName ) {
        if ( xhr.getResponseHeader( headerName ) ) {
          allHeaders += headerName + ": " + xhr.getResponseHeader( headerName ) + "\n";
        }
      });
      return allHeaders;
    };
    return xhr;
  };
})();
