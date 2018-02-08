const {NodeXml} = require('../node-lib/xml.js');
const xml = `<?xml version="1.0"?>
<people xmlns:xul = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" >
  <person db-id="test1">
    <name first="george" last="bush" />
    <address street="1600 pennsylvania avenue" city="washington" country="usa"/>
    <phoneNumber>202-456-1111</phoneNumber>
  </person>
  <person db-id="test2">
    <name first="tony" last="blair" />
    <address street="10 downing street" city="london" country="uk"/>
    <phoneNumber>020 7925 0918</phoneNumber>
  </person>
</people>`;
const p = new NodeXml(xml);
const path = ['people', 'person', 0, 'attr(db-id)'];
debugger;
var result = p.parse(path);
console.log(result);
