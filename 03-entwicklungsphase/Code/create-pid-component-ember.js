import Evented from "@ember/object/evented";
import SapientComponent from "core/objects/component-base";
import EmberUploader from 'ember-uploader';
//import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from "@ember/service";

const uploader = EmberUploader.Uploader.create({
    xmlFileName: 'pid-visualization.xml',
    xmlUrl: './research-sapient-app/public/assets/detail-layout',
    method: 'POST' // POST is default method but PUT requiered to overwrite existing but not suported by this url
});

let component = SapientComponent.extend(Evented, {
    // Variables:
    classNames: ["create-pid-component"],
    classNameBindings: ["inBar:component", "inBar:create-pid-component"],
    toastMessagesService: service("toast-messages-service"),
    pidInstancesObject: null,
    pidShapesLibrary: null,
    jsonString: null,
    jsonObject: null,
    pidXmlString: "",
    // For database query:
    server: service(),
    subscription: undefined,
    // Variable initialization:
    init() {
        this._super(...arguments);
        this.set("jsonObject", null);
        this.set("jsonString", "");
    },
    actions: {
        loadSuccess: function(object, response) {
            // Initializes variables for global availability in loadSuccess function block

            // Database queries with filter:
            // getRecords(resource[, filterObject/filterFunction[, subscriptionOptions{, model]]])
            //let pidNodes = getRecords();
            // Database single query by Id
            // getRecord(resource, filterObject/filterFunction, subscriptionOptions, model)

            console.log("File uploaded and response added to object...");
            this.set(object, response);
            pidShapesLibrary = this.get(object);
            console.log(`File loaded succesfully.`);
            //console.table(pidShapesLibrary);

            // Remove sapient disabled class for success-button and adds event listener
            document.getElementById("generate-pid-button").className =
                "button button-success";
            document.getElementById("generate-pid-button").addEventListener("click", () => {
                generatePidXml();
            },false);    
        },
            
        loadError: function(err) {
            console.log("Error during File Upload...\n");
            console.log(err);
        }
        
    },
    
    
    generatePidXml: function() {
        console.time();
        console.log("XML Generation started...");
        // Add sapient disabled class for success-button
        document.getElementById("generate-pid-button").className =
            "button button-success disabled";
        // Display a loader in xml-viewer-div
        document.getElementById("xml-viewer-div").innerHTML =
            "Generating XML of P&ID Visualization...";
        // sapient loading doesn´t work here because out of scope
        //this.set('loading', true);

        // 1) TODO: Generate JSON Object of P&ID (pidJson) FROM DATABASE QUERIES
        let pidJson = [];
        // Add vertices to pidJson
        let pidVertices = mapNodesToShapes(pidShapesLibrary, pidNodes);
        // Add edges to pidJson
        // TODO: _parent attribute must be overriden from default (_parent="1";) for ALL Nodes (info from DB fetch)
        let pidEdges = mapConnectionsToShapes(
            pidShapesLibrary,
            pidConnections
        );
        // Add database bindings to pidJson
        //let pidDatabaseBindings = mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings);
        // Concatenate arrays to single array using ES6 Spread operator
        // FIXME: Replace with: pidJson = [...pidVertices, ...pidEdges, ...pidDatabaseBindings];
        pidJson = [...pidVertices, ...pidEdges];
        // 2) Generate XML File of P&ID Visualization (pidXml) from pidJson
        pidXmlString = generatePidXmlString(pidJson);
        //let pidXml = parseXml(pidXmlString); // Delete: downloadFile() requires xml string not xml file

        // 3) Render XML as Text in xml-viewer-div of boardlet
        renderXml(pidXmlString);
        console.log("generatePidXml() done after:");
        console.timeEnd();

        // 4) Remove sapient disabled class for success-button and adds event listener
        document.getElementById("download-json-button").className = "button";
        document.getElementById("download-xml-button").className = "button";
        document.getElementById("upload-pid-button").className = "button button-success";
        document.getElementById("download-json-button").addEventListener("click", () => {
                downloadFile("pid-visualization.json", JSON.stringify(pidJson));
            },false);
        document.getElementById("download-xml-button").addEventListener("click", () => {
                downloadFile("pid-visualization.xml", pidXmlString);
            },false);
        // TODO: Change callback to uploadFile() when done implementing
        document.getElementById("upload-pid-button").addEventListener("click", () => {
                uploadXmlFile(pidXmlString);
            },false);
    },


    // getData: function() {
    //     let self = this;

    //     let filter = [];

    //     if (self.get('parameters.nodeList.value') && self.get('parameters.nodeList.value').length !== 0) {
    //         filter.pushObject({field: 'node', op: 'in', val: self.get('parameters.nodeList.value')});
    //     } else {
    //         // no node? filter to non-existing node -1 to avoid data overkill:
    //         filter.pushObject({field: 'node', op: 'in', val: [-1]});
    //     }

    //     if (!self.get('parameters.showQuit.value')) {
    //         filter.pushObject('AND');
    //         filter.pushObject({field: 'quitting_info', op: 'nl'});
    //     }

    //     self.get('store')
    //         .query(
    //             'al-pending-alarm',
    //             {
    //                 filter: filter,
    //                 fields: [
    //                     'id',
    //                     'al_id',
    //                     'al_class',
    //                     'al_class_txt',
    //                     'al_type_txt',
    //                     'al_type',
    //                     'time_start',
    //                     'time_end',
    //                     'fmt_text',
    //                     'node',
    //                     'node_name',
    //                     'quitting_time',
    //                     'recognition_time',
    //                     'quitting_info',
    //                     'recognition_info',
    //                     'quitting_type',
    //                     'pending_id'
    //                 ].join(','),
    //                 order: sortDef
    //             }
    //         )
    //         .then(function (alarms) {
    //             self.set('data', alarms);
    //             self.toggleProperty('invertRefreshMarker');   // animate marker when updating
    //         })
    //         .catch(function (reason) {
    //             if (!(reason.message && reason.message.indexOf('destroyed object') >= 0)) { // ignore ".. called on destroyed object" errors
    //                 self.get('logger').error(20, 'current-alarms-boardlet (getData) - query failed in model "al-pending-alarm": ' + reason);
    //             }
    //             try {
    //                 self.set('data', []);
    //             }
    //             catch (e) {
    //                 // ignore errors here that can occur when boardlet was already destroyed.
    //             }
    //         })
    //         .finally(function () {
    //             try {
    //                 self.set('isLoading', false);
    //                 this.set('isRefreshing', false);
    //             }
    //             catch (e) {
    //                 // ignore errors here that can occur when boardlet was already destroyed.
    //             }
    //         });
    // },


    // Downloads XML File of P&ID on button click
    downloadFile: function(filename, text) {
        // stackoverflow: using-html5-javascript-to-generate-and-save-a-file
        var pom = document.createElement("a");
        pom.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(text)
        );
        pom.setAttribute("download", filename);
        if (document.createEvent) {
            var event = document.createEvent("MouseEvents");
            event.initEvent("click", true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    },


    // // Change to ES6 with async/await
    // uploadFile: function(text) {
    //     const xmlFileName = 'pid-visualization.xml'
    //     const xmlUrl = 'http://localhost:8080/public/assets/detail-layout';
    //
    //     let xhr = new XMLHttpRequest;
    //     xhr.onload = (() => {
    //         if (xhr.status === 200) {
    //             console.log('xhr.onload succeeded');
    //             console.log(text);
    //         }
    //     });
    //     // Specifies the type of request (post, url, async)
    //     xhr.open("POST", url, true);
    //     console.log('xhr opened');
    //     // Sends the request to the server
    //     xhr.send(text);
    //     console.log('xhr sent');
    // },

    
    uploadXmlFile: function(xmlText) {
        let xmlFile = parseXml(xmlText);
        if (xmlFile) {
            uploader.upload(xmlFile, {}).then((data) => {
                    console.log(xmlText);
                    console.log(xmlFile);
                }, (error) => {
                    console.log(error);
                });
            }
            uploader.on('progress', e => {
                // Handle progress changes
                // Use `e.percent` to get percentage
                console.log(`upload: ${e.percent}%`);
            });
            uploader.on('didUpload', e => {
                // Handle finished upload
                console.log('successfull upload');
            });
            uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
            // Handle unsuccessful upload
                console.log('unsuccessfull upload');
            });
    },

    mapNodesToShapes: function(pidShapesLibrary, pidNodes) {
        //console.log("Mapping nodes to vertex shapes (equipment, instrument, arrow, group).");
        const pidShapesCount = pidShapesLibrary.length;
        const pidNodesCount = pidNodes.length;
        let pidVertices = [];

        // TODO: pidNodes = (FETCH FROM PRJ_PRC_VISU_VERTECI)
        pidNodes.forEach(pidNode => {
            let matchingShape = {};
            matchingShape = pidShapesLibrary.find(
                shape => shape.shapeName === pidNode.shapeName
            );
            //console.log(pidNode);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned)
            let pidVertex = Object.assign({}, pidNode, matchingShape);
            pidVertices.push(pidVertex);
        });

        console.log(
            `Mapped ${pidNodesCount} node instances to vertex shapes from ${pidShapesCount} total shapes in library.`
        );
        //console.log("pidNodes:");
        //console.table(pidNodes);
        //console.log("pidVertices:");
        //console.table(pidVertices);

        return pidVertices;
    },

    mapConnectionsToShapes: function(pidShapesLibrary, pidConnections) {
        //console.log("Mapping connections to edge shape (line).");
        const pidShapesCount = pidShapesLibrary.length;
        const pidConnectionsCount = pidConnections.length;
        let pidEdges = [];

        // TODO: pidConnections = (FETCH FROM PRJ_PRC_PRO_FLOWS)
        pidConnections.forEach(pidConnection => {
            let matchingShape = {};
            matchingShape = pidShapesLibrary.find(
                shape => shape.shapeName === pidConnection.shapeName
            );
            //console.log(pidConnection);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned)
            let pidEdge = Object.assign(
                {},
                pidConnection,
                matchingShape
            );
            pidEdges.push(pidEdge);
        });

        console.log(
            `Mapped ${pidConnectionsCount} connection instances to edge shapes from ${pidShapesCount} total shapes in library.`
        );
        //console.log("pidConnections:");
        //console.table(pidConnections);
        //console.log("pidEdges:");
        //console.table(pidEdges);

        return pidEdges;
    },

    /*function mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings) {
        console.log("Mapping data bindings to shapes...");
        // TODO: pidDataBindings = (FETCH FROM DATABASE TABLES)
    }*/

    generatePidXmlString: function(pidJson) {
                console.log("Generating pidXmlString from pidJson...");
                console.log("pidJson:");
                console.table(pidJson);
                // Filter nodes by their individual pidClasses and create new
                // individual objects (not too expensive and filtered once before
                // layout algorithm and string generation, both which need filtered data
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

                // let pidDatabaseBindings;
                // pidDatabaseBindings = pidJson.filter(
                //     pidInstance => pidInstance.pidClass === "data_binding" ??? pidClass or xml object or what
                // );

                console.log(`pidEquipments: ${pidEquipments.length}`);
                console.log(`pidInstruments: ${pidInstruments.length}`);
                console.log(`pidArrows: ${pidArrows.length}`);
                console.log(`pidGroups: ${pidGroups.length}`);
                console.log(`pidLines: ${pidLines.length}`);

                // Create node hierarchy out of parent relations (filter nodes only from pidJson)
                let pidNodeTree = buildHierarchy(pidJson);
                console.log('pidNodeTree = \n');
                console.log(pidNodeTree);

                // Grid layout algorithm to set _x and _y attributes of pidNodes
                console.log("Grid layout algorithm started...");
                //pidLayoutAlgorithm(pidVertices, pidEdges);

                console.log("XML String generation started...");

                const graphSettings = {
                    dx: 0,
                    dy: 0,
                    grid: 1,
                    gridSize: 10,
                    guides: 1,
                    tooltips: 1,
                    connect: 1,
                    arrows: 1,
                    fold: 1,
                    page: 1,
                    pageScale: 1,
                    pageWidth: 1654,
                    pageHeight: 1169,
                    background: "#ffffff",
                    math: 0,
                    shadow: 0
                };

                // Add mxGraph and mxGraphModel boilerplate settings
        pidXmlString = `
<mxGraphModel dx="${graphSettings.dx}" dy="${graphSettings.dy}" grid="${graphSettings.grid}" gridSize="${graphSettings.gridSize}" guides="${graphSettings.guides}" tooltips="${graphSettings.tooltips}" connect="${graphSettings.connect}" arrows="${graphSettings.arrows}" fold="${graphSettings.fold}" page="${graphSettings.page}" pageScale="${graphSettings.pageScale}" pageWidth="${graphSettings.pageWidth}" pageHeight="${graphSettings.pageHeight}" background="${graphSettings.background}" math="${graphSettings.math}" shadow="${graphSettings.shadow}">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>`;

        // Add vertices:
        pidEquipments.forEach((pidEquipment) => {
            const equipmentCount = pidEquipments.length;
            console.log(`Generating XML-tags for ${equipmentCount} equipment instances...`);
            // Conditional inside template literal to set either parent or default _parent
            // Values not preceeded with '_' are instance attributes (from database)
            pidXmlString += `
    <mxCell id="${pidEquipment.id}" value="${pidEquipment._value}" style="${concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" parent="${pidEquipment.parent ? pidEquipment.parent : pidEquipment._parent}">
      <mxGeometry x="50" y="50" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidInstruments.forEach((pidInstrument) => {
            const instrumentCount = pidInstruments.length;
            console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
            pidXmlString += `
    <mxCell id="${pidInstrument.id}" value="${pidInstrument._value}" style="${concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" parent="${pidInstrument.parent ? pidInstrument.parent : pidInstrument._parent}">
      <mxGeometry x="50" y="50" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidArrows.forEach((pidArrow) => {
            const arrowCount = pidArrows.length;
            console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
            pidXmlString += `
    <mxCell id="${pidArrow.id}" value="${pidArrow._value}" style="${concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" parent="${pidArrow.parent ? pidArrow.parent : pidArrow._parent}">
      <mxGeometry x="50" y="50" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidGroups.forEach((pidGroup) => { // FIXME: width and height attributes set depending on group shapeName
            const groupCount = pidGroups.length;
            console.log(`Generating XML-tags for ${groupCount} group instances...`);
            pidXmlString += `
    <mxCell id="${pidGroup.id}" value="${pidGroup._value}" style="${concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" parent="${pidGroup.parent ? pidGroup.parent : pidGroup._parent}">
      <mxGeometry x="50" y="50" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        // Add edges:
        pidLines.forEach((pidLine) => {
            const lineCount = pidLines.length;
            console.log(`Generating XML-tags for ${lineCount} line instances...`);
            pidXmlString += `
    <mxCell id="${pidLine.id}" value="${pidLine._value}" style="${concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.node_0}" target="${pidLine.node_1}" parent="${pidLine._parent}">
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
    },


    buildHierarchy: function(flatArray) {
        console.log("Building hierarchy from pidJson...");
        let treeArray = [];
        let lookup = [];
        // Filter nodes from plant instances
        let nodesArray = flatArray.filter((instance) => instance._vertex === "1");
        //console.log('nodesArray = \n');
        //console.log(nodesArray);
        // Build node instance hierarchy in treeArray
        nodesArray.forEach((node) => {
            //console.log(node);
            let nodeId = node.id; // Select current node's id
            //console.log(`nodeId: ${nodeId}`);
            lookup[nodeId] = node; // Clone node to id key of lookup array 
            //console.log(lookup[nodeId]);
            node['children'] = []; // Add a children property (array type)
            //console.log('node[\'children\'] = \n');
            //console.log(node['children']);
        });
        nodesArray.forEach((node) => {
            if (node['parent']) {
                let nodeParent = node.parent;
                lookup[nodeParent].children.push(node);
            } else {
                treeArray.push(node);
            }
        });
        let treeString = JSON.stringify(treeArray);
        console.log('treeString = \n');
        console.log(treeString);
        //console.log('tree = \n');
        //console.log(treeArray);
        return treeArray;
    },


    // function placeVertex(vertices, edges) {
    //     // Layout settings and constraints
    //     const groupPadding = 10;
    //     const spacing = 10;

    //     // const hierarchyLevels = 8;
    //     // let nodesLevel = [];
    //     // for (level in range(hierarchyLevels)) {
    //     //   let nodesLevel[level];
    //     //   nodesLevel[level] = vertices.filter(
    //     //     vertex => vertex.node_level === level
    //     // );
    //     // }
    //     let nodes0Level;
    //     level0Nodes = vertices.filter(
    //         vertex => vertex.node_level === 0
    //     );
    //     let level1Nodes;
    //     level1Nodes = vertices.filter(
    //         vertex => vertex.pidClass === 1
    //     );
    //     let level2Nodes;
    //     level2Nodes = vertices.filter(
    //         vertex => vertex.pidClass === 2
    //     );
    //     let level3Nodes;
    //     level3Nodes = vertices.filter(
    //         vertex => vertex.pidClass === 3
    //     );
    //     let level4Nodes;
    //     level4Nodes = vertices.filter(
    //         vertex => vertex.pidClass === 4
    //     );

    //     // FIXME: How many levels in total? fix number?
    //     let nodesCount = [];
    //     for (level in range(hierarchyLevels)) {
    //         nodesCount[level] = nodesCount[level].length;
    //     }

    //     forEach

    //     console.log(`level0Nodes: ${level0Nodes.length}`);
    //     console.log(`level1Nodes: ${level1Nodes.length}`);
    //     console.log(`level2Nodes: ${level2Nodes.length}`);
    //     console.log(`level3Nodes: ${level3Nodes .length}`);
    //     console.log(`level4Nodes: ${level4Nodes.length}`);

    //     vertices.forEach((vertex) => {
    //         switch (vertex.node_level) {
    //             case 0:

    //             case 1:

    //             case 2:

    //             case 3:

    //             case 4:

    //             case 5:

    //             case 6:

    //         }

    //     });
    // }

    concatenateStyles: function(styleObject) {
        let styleString = "";
        //console.log(styleObject);
        // Converts object to array to iterate through all entries with forEach
        let valuesArray = Object.values(styleObject);
        valuesArray.forEach((value) => {
            if (value === "") {
                // Skip empty attribute
            } else {
                // Concatenate attribute
                styleString += value + ';';
            }
        });
        //console.log(styleString);
        return styleString;
    },

    renderXml: function(xmlString) {
        console.log("Rendering pidXmlString as innerHTML...");
        // Formats raw XML-string to pretty print
        let formattedXmlString = formatXml(xmlString, "  ");
        // Encodes XML string to valid HTML string (HTML characters)
        let formattedHtmlString = escapeXmlToHtml(formattedXmlString);
        //console.log(`pidHtmlString = \n${formattedHtmlString}`);
        document.getElementById(
            "xml-viewer-div"
        ).innerHTML = formattedHtmlString;
    },

    formatXml: function(xml, tab) {
        // tab = optional indent value, default is tab (\t)
        console.log("Formatting pidXmlString...");
        var formatted = "",
            indent = "";
        tab = tab || "\t";
        xml.split(/>\s*</).forEach(function(node) {
            if (node.match(/^\/\w/))
                indent = indent.substring(tab.length); // decrease indent by one 'tab'
            formatted += indent + "<" + node + ">\r\n";
            if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab; // increase indent
        });
        return formatted.substring(1, formatted.length - 3);
    },

    escapeXmlToHtml: function(xmlString) {
        console.log("Escaping pidXmlString to pidHtmlString...");
        let htmlString = String(xmlString)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/ /g, "&nbsp;")
            .replace(/\n/g, "<br />");
        return htmlString;
    },


    parseXml: function(xmlString) {
        var domParser = new DOMParser();
        try {
            var xmlDocument = domParser.parseFromString(xmlString, "application/xml");
            console.log("pidXmlString parsed to pidXml File");
            return xmlDocument;
        } catch (error) {
            console.error(error);
        }
    },

});

// TODO: check if necesary for db query
boardlet.reopenClass({
    parameters: {
        node: {
            displayKey: 'parameters.node-id',
            value: 1,
            parameterType: 'Integer',
            context: ParameterContext.In,
            category: 'filters',
            editor: {
                component: 'input-component',
                parameters: {
                    placeholder: 'Add node ID...',
                    hasIcon: true,
                }
            }
        }
    }
});

export default component;
