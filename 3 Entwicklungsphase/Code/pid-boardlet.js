window.addEventListener('load', () => {

    console.log("Page loaded succesfully.");

    const libraryInput = document.getElementById("pid-shapes-library");
    const instancesInput = document.getElementById("pid-instances");
    const generatePidButton = document.getElementById("generate-pid-button");
    const totalCounter = document.getElementById("total-counter");
    const xmlContainer = document.getElementById("xml-container-div");
    const downloadJsonButton = document.getElementById("download-json-button");
    const downloadPidButton = document.getElementById("download-pid-button");


    let file1Present = false;
    let file2Present = false;
    let pidShapesLibraryString;
    let pidShapesLibrary;
    let pidInstancesString;
    let pidInstances;
    let verteci = [];
    let verteciString = '';
    let pidJson;
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
                    console.table(pidShapesLibrary);
                    file1Present = true;
                } else if (target == "pid-instances") {
                    pidInstancesString = event.target.result;
                    pidInstances = JSON.parse(pidInstancesString);
                    console.table(pidInstances);
                    file2Present = true;
                } else {
                    alert(`${fileName} is not the appropriate file for ${target} input. Please select the correct file.`);
                }
                if (file1Present && file2Present) {
                    generatePidButton.disabled = false;
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
    instancesInput.addEventListener("change", loadJson, false);


    function generatePidXml() {
        generatePidButton.disabled = true;
        downloadPidButton.disabled = false;

        // Add verteci to pidJson
        pidJson = mapVertexInstancesToShapes(pidShapesLibrary, pidInstances);
        // Add edges to pidJson

        // Add database bindings to pidJson

        // Generate XML string from JS-Object
        pidXmlString = generatePidXmlString(pidJson);

        // Parse XML string to XML-Document (with DOM Parser)
        pidXml = parseXml(pidXmlString);

        // Render encoded XML String directly in markup (xml-container-div)
        renderXml(pidXmlString);

    }
    generatePidButton.addEventListener("click", () => {
        generatePidXml(pidShapesLibrary, pidInstances);
        //totalCounter.innerHTML = "";
    }, false);


    function mapVertexInstancesToShapes(pidShapesLibrary, pidInstances) {
        console.log("Mapping of vertex instances to shapes started...")

        let counter = 0;
        let pidShapesLibraryCount = pidShapesLibrary.length;
        let pidInstancesCount = pidInstances.length;

        // Eventually fetch and push pidInstances from l_nodes in DB into pidInstances array
        pidInstances.forEach((pidInstance) => {
            counter++;
            let matchingShape = {};
            matchingShape = pidShapesLibrary.find((shape) => shape.shapeName === pidInstance.shapeName);
            console.log(pidInstance);
            console.log(matchingShape);
            totalCounter.innerHTML = `pidInstances: ${counter} / ${pidInstancesCount}  |  Shapes in library: ${pidShapesLibraryCount}`;

            // Clone all properties to NEW target object (which is returned)
            let vertex = Object.assign({}, pidInstance, matchingShape);
            verteci.push(vertex);
        });
        verteciString = JSON.stringify(verteci);
        console.log(`${verteci.length} verteci generated succesfully.`);
        downloadJsonButton.disabled = false;
        return verteci;
    }


    function generatePidXmlString(pidJson) {
        let verteci = pidJson;
        let vertexCount = verteci.length;
        console.log(`vertexCount = ${vertexCount}`);

        // Instanciate Verteci:
        pidXmlString = `
<mxGraphModel dx="3952" dy="2849" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" background="#ffffff" math="0" shadow="0">
<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>`;

        // Create an HTML compatible XML String (encode HTML unsafe characters: ', ", <, >, and &)
        verteci.forEach((vertex) => {
            //
            pidXmlString += `
  <mxCell id=\"${vertex._id}\" value=\"${vertex._value}\" style=\"${vertex._style}\" vertex=\"${vertex._vertex}\" parent=\"${vertex._parent}\">
    <mxGeometry x="50\" y="50\" width="${vertex.mxGeometry._width}\" height="${vertex.mxGeometry._height}\" as="${vertex.mxGeometry._as}\"></mxGeometry>
  </mxCell>`
        });

        pidXmlString += `
</root>
</mxGraphModel>`;

        return pidXmlString;
    };


    // function concatenateStyles(stylesObject) {
    //     let styles = stylesObject;
    //     let stylesString = "";
    //     // USE REDUCE INSTEAD OF FOREACH
    //     styles.forEach((style) => {
    //         if (style === "") {
    //             // Skip empty attribute
    //         } else {
    //             // Concatenate attribute
    //             stylesString += `${style};`;
    //         }
    //         return stylesString;
    //     });
    // };


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
        let formattedXmlString = formatXml(xmlString);

        // Encodes XML string to valid HTML string (HTML characters)
        let htmlString = escapeXmlToHtml(xmlString);
        console.log(`pidHtmlString = \n${htmlString}`);

        xmlContainer.innerHTML = htmlString;
    }


    function formatXml(xml) {
        var formatted = '';
        var reg = /(>)(<)(\/*)/g;
        xml = xml.replace(reg, '$1\r\n$2$3');
        var pad = 0;
        jQuery.each(xml.split('\r\n'), function(index, node) {
            var indent = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (node.match(/^<\/\w/)) {
                if (pad != 0) {
                    pad -= 1;
                }
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }

            var padding = '';
            for (var i = 0; i < pad; i++) {
                padding += '  ';
            }

            formatted += padding + node + '\r\n';
            pad += indent;
        });

        return formatted;
    }


    function escapeXmlToHtml(xmlString) {
        let htmlString = String(xmlString).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
        return htmlString;
    };


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