"use strict"; // Prohibit use of undeclared variables

window.addEventListener('load', () => {

    console.log("Page loaded succesfully.");

    const verteciFileInput = document.getElementById("verteci-file");
    const xmlContainer = document.getElementById("xml-container");
    const graphContainer = document.getElementById("graph-container");
    const saveButton = document.getElementById("save-button");

    let pidString;
    let pidJson;
    let pidXmlString;
    let pidHtmlString;
    let pidXml;
    let xhr = new XMLHttpRequest;


    // async function fetchJson() {
    //     const response = await fetch('data\verteci.json');
    //     const json = await response.json();
    //     console.log(json);
    //   };


    // function fetchJson(event) {
    //   xhr.onload = (() => {
    //     if(xhr.status === 200) {
    //       pidJson = JSON.parse(xhr.responseText);
    //
    //       // BUILD UP STRING WITH NEW content
    //       pidXmlString = generatePidXml(pidJson);
    //       console.log(pidXmlString);
    //
    //
    //       // UPDATE PAGE WITH NEW content
    //       xmlContainer.innerHTML = pidXmlString;
    //     };
    //   });
    // };
    // verteciFileInput.addEventListener("change", fetchJson, false);
    // xhr.open("GET", "data/verteci.js", true);
    // xhr.send(null);


    // fetchJson IS CURRENTLY SAME AS loadJson BUT WILL EVENTUALLY FETCH JSON DATA with FILE API NOT FETCH API
    // (VERTECI AND EDGES INFO) AND GENERATE A pidJson FILE
    function loadJson(event) {
        var target = event.target.id;
        let jsonFile = event.target.files[0];
        let fileReader = new FileReader();

        if (!jsonFile.type.match("json")) {
            console.log("File Type is not of JSON type.");
        } else {
            fileReader.onload = (event) => {
                // FILE INPUT IS CURRENTLY A JSON-OBJECT; EVENTUALLY JSON-STRING FETCHED FROM DATABASE

                // Parse JSON string to JS-Object
                pidString = event.target.result;
                console.log(`1) PID File read as pidString: \n${pidString}`);
                pidJson = JSON.parse(pidString);

                // Generate XML string from JS-Object
                pidXmlString = generatePidXmlString(pidJson);
                console.log(`2) pidString converted with generatePidXmlString() to pidXmlString: \n${pidXmlString}`);

                // Parse XML string to XML-Document (with DOM Parser)
                pidXml = parseXml(pidXmlString);
                console.log(`3) pidXmlString parsed to pidXml: \n${pidXml}`);

                // Encodes XML string to valid HTML string (HTML characters)
                pidHtmlString = xmlToHtml(pidXmlString);
                console.log(`pidHtmlString = \n${pidHtmlString}`);
                xmlContainer.innerHTML = pidHtmlString;
                document.getElementById("xml-container-header").innerHTML = "P&ID XML File";
            }
            saveButton.disabled = false;
            console.log(`4) Enable save button for pidXml.xml (XML File).`);
        }
        try {
            fileReader.readAsText(jsonFile); // Read the uploaded file (asyncronously)
        } catch (error) {
            console.error(error);
            return;
        }
    };
    verteciFileInput.addEventListener("change", loadJson, false);


    // EVENTUALLY pidJson has both VERTECI AND EDGES INFO !!!!!!!!!!!!!
    function generatePidXmlString(pidJson) {
        let verteci = pidJson;
        let vertexCount = pidJson.length;
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


    function xmlToHtml(xmlString) {
        let htmlString = String(xmlString).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        return htmlString;
    };


    function concatenateStyles(stylesObject) {
        let styles = stylesObject;
        let stylesString = "";
        // USE REDUCE INSTEAD OF FOREACH
        styles.forEach((style) => {
            if (style === "") {
                // Skip empty attribute
            } else {
                // Concatenate attribute
                stylesString += `${style};`;
            }
            return stylesString;
        });
    };


    function parseXml(xmlString) {
        var domParser = new DOMParser();
        var xmlDocument = domParser.parseFromString(xmlString, "application/xml");
    }


    function download(filename, text) {
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
    };
    saveButton.addEventListener("click", () => {
        download('pidXmlString.xml', pidXmlString);
    })

}, false);