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
    let visuJson;
    let visuXmlString;
    let visuXml;

    if (window.File && window.FileReader && window.FileList) {
        // All the File APIs are supported.
    } else {
        alert("The File APIs are not fully supported in this browser.");
    }


    function loadJson(event) {
        let target = event.target.id;
        console.log(`File name: ${target}`);
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
                } else if (target == "pidInstance-instances") {
                    pidInstancesString = event.target.result;
                    pidInstances = JSON.parse(pidInstancesString);
                    console.table(pidInstances);
                    file2Present = true;
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
        mapInstancesToShapes(pidShapesLibrary, pidInstances);
        downloadPidButton.disabled = false;

    }
    generatePidButton.addEventListener("click", () => {
        generatePidXml(pidShapesLibrary, pidInstances);
        //totalCounter.innerHTML = "";
        console.log(`${verteci.length} verteci generated succesfully.`);
        generatePidButton.disabled = true;
    }, false);

    function mapInstancesToShapes(pidShapesLibrary, pidInstances) {
        let counter = 0;
        let pidShapesLibraryCount = pidShapesLibrary.length;
        let pidInstancesCount = pidInstances.length;

        // Eventually fetch and push pidInstances from l_nodes in DB into pidInstances array
        pidInstances.forEach((pidInstance) => {
            counter++;
            let matchingShape = {};
            matchingShape = pidShapesLibrary.find((shape) => shape.shapeName === pidInstances.shapeName);
            //console.log(pidInstance);
            //console.log(matchingShape);
            totalCounter.innerHTML = `pidInstances: ${counter}  |  Shapes: ${pidInstancesCount}`;

            // Clone all properties to NEW target object (which is returned)
            let vertex = Object.assign({}, pidInstance, matchingShape);
            verteci.push(vertex);
        });
        verteciString = JSON.stringify(verteci);
        downloadJsonButton.disabled = false;
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


    function renderXml() {
        const breweryPidSvg = "<img src=\"data\\brewery_pid_diagram.svg\"></img>";
        visuContainer.innerHTML = `${breweryPidSvg}`;
        visuContainer.scrollIntoView();
    }

}, false);