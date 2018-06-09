window.addEventListener('load', () => {

    console.log("Page loaded succesfully.");

    // File inputs
    const libraryInput = document.getElementById("pid-shapes-library");
    const nodesInput = document.getElementById("pid-nodes");
    const connectionsInput = document.getElementById("pid-connections");
    const dataBindingsInput = document.getElementById("pid-data-bindings");
    // Buttons
    const generatePidButton = document.getElementById("generate-pid-button");
    const downloadJsonButton = document.getElementById("download-json-button");
    const downloadPidButton = document.getElementById("download-pid-button");
    // Other
    const totalCounter = document.getElementById("total-counter");
    const xmlContainer = document.getElementById("xml-container-div");


    let file1Present = false;
    let file2Present = false;
    let file3Present = false;
    let file4Present = false;

    let pidShapesLibraryString;
    let pidShapesLibrary;
    let pidNodesString;
    let pidNodes;
    let pidConnectionsString;
    let pidConnections;
    let pidDataBindingsString;
    let pidDataBindings;

    let pidJson = [];
    let pidXmlString;
    let pidXml;

    if (window.File && window.FileReader && window.FileList) {
        // All the File APIs are supported.
    } else {
        alert("The File APIs are not fully supported in this browser.");
    }


    function loadJson(event) {
        let target = event.target.id;
        let files = event.target.files;
        var fileName = files[0].name;
        console.log(`Loading ${fileName} for ${target}...`);
        let jsonFile = event.target.files[0];
        let fileReader = new FileReader();

        if (!jsonFile.type.match("json")) {
            console.log("File Type is not of JSON type.");
        } else {
            fileReader.onload = (event) => {
                if (target === "pid-shapes-library") {
                    pidShapesLibraryString = event.target.result;
                    pidShapesLibrary = JSON.parse(pidShapesLibraryString);
                    console.log(`${fileName} succesfully loaded`);
                    //console.table(pidShapesLibrary);
                    file1Present = true;
                } else if (target == "pid-nodes") {
                    pidNodesString = event.target.result;
                    pidNodes = JSON.parse(pidNodesString);
                    console.log(`${fileName} succesfully loaded`);
                    //console.table(pidNodes);
                    file2Present = true;
                } else if (target == "pid-connections") {
                    pidConnectionsString = event.target.result;
                    pidConnections = JSON.parse(pidConnectionsString);
                    console.log(`${fileName} succesfully loaded`);
                    //console.table(pidConnections);
                    file3Present = true;
                } else if (target == "pid-data-bindings") {
                    pidDataBindingsString = event.target.result;
                    pidDataBindings = JSON.parse(pidDataBindingsString);
                    console.log(`${fileName} succesfully loaded`);
                    //console.table(pidDataBindings);
                    file4Present = true;
                } else {
                    alert(`${fileName} is not the appropriate file for ${target} input. Please select the correct file.`);
                }
                // TODO: (file1Present && file2Present && file3Present && file4Present)
                if (file1Present && file2Present && file3Present) {
                    generatePidButton.disabled = false;
                    generatePidButton.className = 'enabled';
                }
            }
        }
        try {
            fileReader.readAsText(jsonFile); // Read the uploaded file (asyncronously)
        } catch (error) {
            console.error(error);
            return;
        }
    }
    libraryInput.addEventListener("change", loadJson, false);
    nodesInput.addEventListener("change", loadJson, false);
    connectionsInput.addEventListener("change", loadJson, false);
    dataBindingsInput.addEventListener("change", loadJson, false);


    function generatePidXml() {
        generatePidButton.disabled = true;
        generatePidButton.className = 'disabled';
        downloadPidButton.disabled = false;
        downloadPidButton.className = 'enabled';

        // Add verteci to pidJson
        let pidVerteci = mapNodesToShapes(pidShapesLibrary, pidNodes);
        // Add edges to pidJson
        let pidEdges = mapConnectionsToShapes(pidShapesLibrary, pidConnections);
        // Add database bindings to pidJson 
        //let pidDatabaseBindings = mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings);
        // Concatenate arrays to single array using ES6 Spread operator
        //FIXME: Replace with: pidJson = [...pidVerteci, ...pidEdges, ...pidDatabaseBindings];
        pidJson = [...pidVerteci, ...pidEdges];

        // Generate XML string from JS-Object
        pidXmlString = generatePidXmlString(pidJson);
        // Parse XML string to XML-Document (with DOM Parser)
        pidXml = parseXml(pidXmlString);

        // Render encoded XML String directly in markup (xml-container-div)
        renderXml(pidXmlString);

    }
    generatePidButton.addEventListener("click", () => {
        generatePidXml(pidShapesLibrary, pidNodes);
        //totalCounter.innerHTML = "";
    }, false);


    function mapNodesToShapes(pidShapesLibrary, pidNodes) {
        const pidShapesCount = pidShapesLibrary.length;
        const pidNodesCount = pidNodes.length;
        let pidVerteci = [];

        pidNodes.forEach(pidNode => {
            let matchingShape = {};
            matchingShape = pidShapesLibrary.find(shape => shape.shapeName === pidNode.shapeName);
            //console.log(pidNode);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned)
            let pidVertex = Object.assign({}, pidNode, matchingShape);
            pidVerteci.push(pidVertex);
        });

        console.log(`Mapped ${pidNodesCount} node instances to vertex shapes from ${pidShapesCount} total shapes in library.`);
        console.log("pidNodes:");
        console.table(pidNodes);
        console.log("pidVerteci:");
        console.table(pidVerteci);

        return pidVerteci;
    }


    function mapConnectionsToShapes(pidShapesLibrary, pidConnections) {
        const pidShapesCount = pidShapesLibrary.length;
        const pidConnectionsCount = pidConnections.length;
        let pidEdges = [];

        pidConnections.forEach(pidConnection => {
            let matchingShape = {};
            matchingShape = pidShapesLibrary.find(shape => shape.shapeName === pidConnection.shapeName);
            //console.log(pidConnection);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned)
            let pidEdge = Object.assign({}, pidConnection, matchingShape);
            pidEdges.push(pidEdge);
        });

        // Enable download button an change style to enabled
        downloadJsonButton.disabled = false;
        downloadJsonButton.className = 'enabled';

        console.log(`Mapped ${pidConnectionsCount} connection instances to edge shapes from ${pidShapesCount} total shapes in library.`);
        console.log('pidConnections:');
        console.table(pidConnections);
        console.log('pidEdges:');
        console.table(pidEdges);

        return pidEdges;
    }

    /*function mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings) {
        console.log("Mapping data bindings to shapes...");
        // TODO: pidDataBindings = (FETCH FROM DATABASE TABLES)
    }*/


    function generatePidXmlString(pidJson) {
        console.log("Generating pidXmlString from pidJson...");
        console.log("pidJson:");
        console.table(pidJson);
        // Filters nodes by their individual pidClasses and creates new individual objects
        let pidEquipments;
        pidEquipments = pidJson.filter(
            pidInstance => pidInstance.pidClass === "equipment"
        );
        let pidInstruments;
        pidInstruments = pidJson.filter(
            pidInstance => pidInstance.pidClass === "instrument"
        );
        let pidArrows;
        pidArrows = pidJson.filter(
            pidInstance => pidInstance.pidClass === "arrow"
        );
        let pidGroups;
        pidGroups = pidJson.filter(
            pidInstance => pidInstance.pidClass === "group"
        );
        let pidLines;
        pidLines = pidJson.filter(
            pidInstance => pidInstance.pidClass === "line"
        );

        console.log(`pidEquipments = ${pidEquipments}`);
        console.log(`pidInstruments = ${pidInstruments}`);
        console.log(`pidArrows = ${pidArrows}`);
        console.log(`pidGroups = ${pidGroups}`);
        console.log(`pidLines = ${pidLines}`);

        //let edges = pidJson;
        //let databaseBindings = pidJson;
        console.log("XML String generation started...");

        // Add mxGraph and mxGraphModel boilerplate settings
        pidXmlString = `
<mxGraphModel dx="3952" dy="2849" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" background="#ffffff" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>`;

        // Implement GLOBAL ID Generator starting from 2
        let previousId = 1;

        // Add verteci:
        pidEquipments.forEach((pidEquipment) => {
            const equipmentCount = pidEquipments.length;
            console.log(`Generating XML-tags for ${equipmentCount} equipment instances...`);
            pidXmlString += `
    <mxCell id="${previousId += 1}" value="${pidEquipment._value}" style="${pidEquipment._style}" vertex="${pidEquipment._vertex}" parent="${pidEquipment._parent}">
      <mxGeometry x="50" y="50" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidInstruments.forEach((pidInstrument) => {
            const instrumentCount = pidInstruments.length;
            console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
            pidXmlString += `
    <mxCell id="${previousId += 1}" value="${pidInstrument._value}" style="${pidInstrument._style}" vertex="${pidInstrument._vertex}" parent="${pidInstrument._parent}">
      <mxGeometry x="50" y="50" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidArrows.forEach((pidArrow) => {
            const arrowCount = pidArrows.length;
            console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
            pidXmlString += `
    <mxCell id="${previousId += 1}" value="${pidArrow._value}" style="${pidArrow._style}" vertex="${pidArrow._vertex}" parent="${pidArrow._parent}">
      <mxGeometry x="50" y="50" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidGroups.forEach((pidGroup) => {
            const groupCount = pidGroups.length;
            console.log(`Generating XML-tags for ${groupCount} group instances...`);
            pidXmlString += `
    <mxCell id="${previousId += 1}" value="${pidGroup._value}" style="${pidGroup._style}" vertex="${pidGroup._vertex}" parent="${pidGroup._parent}">
      <mxGeometry x="50" y="50" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        // Add edges:
        pidLines.forEach((pidLine) => {
            const lineCount = pidLines.length;
            console.log(`Generating XML-tags for ${lineCount} line instances...`);
            pidXmlString += `
    <mxCell id="${previousId += 1}" value="${pidLine._value}" style="${pidLine._style}" edge="${pidLine._edge}" source="${pidLine.source}" target="${pidLine.target}" parent="${pidLine._parent}">
      <mxGeometry x="50" y="50" as="${pidLine.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        // Add database bindings

        // Add boilerplate closing tags
        pidXmlString += `
  </root>
</mxGraphModel>`;

        console.log(pidXmlString);
        return pidXmlString;
    }


    function concatenateStyles(styleObject) {
        console.log(styleObject);
        let styleString = "";
        styleObject.forEach((style) => {
            if (style === "") {
                // Skip empty attribute
            } else {
                // Concatenate attribute
                styleString += `${style};`;
            }
        });
        return styleString;
    }


    // DELETE??????? IS THIS REALLY NECESARRY???????
    function parseXml(xmlString) {
        var domParser = new DOMParser();
        try {
            var xmlDocument = domParser.parseFromString(xmlString, "application/xml");
            console.log("pidXmlString parsed to pidXml File");
            return xmlDocument;
        } catch (error) {
            console.error(error);
        }
    }


    function renderXml(xmlString) {
        // Formats raw XML-string to pretty print
        let formattedXmlString = formatXml(xmlString, "  ");
        // Encodes XML string to valid HTML string (HTML characters)
        let formattedHtmlString = escapeXmlToHtml(formattedXmlString);
        console.log(`pidHtmlString = \n${formattedHtmlString}`);
        xmlContainer.innerHTML = formattedHtmlString;
    }


    function formatXml(xml, tab) { // tab = optional indent value, default is tab (\t)
        var formatted = '',
            indent = '';
        tab = tab || '\t';
        xml.split(/>\s*</).forEach(function(node) {
            if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent by one 'tab'
            formatted += indent + '<' + node + '>\r\n';
            if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab; // increase indent
        });
        return formatted.substring(1, formatted.length - 3);
    }


    function escapeXmlToHtml(xmlString) {
        let htmlString = String(xmlString)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/ /g, '&nbsp;')
            .replace(/\n/g, '<br />');
        return htmlString;
    }


    function downloadFile(filename, text) {
        // stackoverflow: using-html5-javascript-to-generate-and-save-a-file
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    }
    downloadJsonButton.addEventListener("click", () => {
        downloadFile('pid-data.json', verteciString);
    });
    downloadPidButton.addEventListener("click", () => {
        downloadFile('pid-visualization.xml', pidXmlString);
    });

}, false);