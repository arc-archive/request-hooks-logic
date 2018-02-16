'use strict';
const assert = require('chai').assert;
const {NodeXml} = require('../lib/node/xml.js');

const xml = `<?xml version="1.0"?>
<people xmlns:xul = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" >
  <person>
	<name first="george" last="bush" />
	<address street="1600 pennsylvania avenue" city="washington" country="usa"/>
	<phoneNumber>202-456-1111</phoneNumber>
  </person>
  <person>
	<name first="tony" last="blair" />
	<address street="10 downing street" city="london" country="uk"/>
	<phoneNumber>020 7925 0918</phoneNumber>
  </person>
</people>`;

describe('Node - xml parser', function() {
  var p;
  beforeEach(function() {
    p = new NodeXml(xml);
  });

  it('Finds simple value', function() {
    const path = ['people'];
    var result = p.parse(path);
    assert.typeOf(result, 'string');
  });

  it('Finds complex value', function() {
    const path = ['people', 'person', 1, 'phoneNumber'];
    var result = p.parse(path);
    assert.equal(result, '020 7925 0918');
  });
});
