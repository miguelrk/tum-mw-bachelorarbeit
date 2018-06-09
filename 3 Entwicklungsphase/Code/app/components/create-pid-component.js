import Evented from "@ember/object/evented";
import SapientComponent from "core/objects/component-base";
//import ParameterContext from 'core/objects/parameter-context';
import {
    inject as service
} from "@ember/service";

var component = SapientComponent.extend(Evented, {
    classNames: ["create-pid-component"],
    classNameBindings: ["inBar:component", "inBar:create-pid-component"],
    toastMessagesService: service("toast-messages-service"),
    pidInstancesObject: null,
    pidShapesLibraryObject: null,
    jsonString: null,
    jsonObject: null,
    init() {
        this._super(...arguments);
        this.set("jsonObject", null);
        this.set("jsonString", "");
    },
    actions: {
        loadSuccess: function(object, response) {
            // Initializes variables for global availability in loadSuccess function block
            // FIXIT: DATABASE FETCHING IN INDIVIDUAL MAPPING FUNCTIONS
            let pidNodes = [{
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Water_injection",
                    cModule: "Control_valve_440",
                    variable: "Control_valve_440_8"
                },
                {
                    shapeName: "pump_(liquid)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Water_injection",
                    cModule: "Pump_P40",
                    pidLabel: "P40",
                    variable: "Pump_P40_9"
                },
                {
                    shapeName: "electric_motor",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel",
                    cModule: "Motor",
                    variable: "Motor_11"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_Z",
                    pidFunction: "ZS",
                    pidNumber: "4000",
                    variable: "Kettle_sensor_Z_12"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_T",
                    pidFunction: "TE",
                    pidNumber: "4000",
                    variable: "Kettle_sensor_T_13"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Waste_gas_cooling",
                    cModule: "Control_valve_550",
                    variable: "Control_valve_550_17"
                },
                {
                    shapeName: "compressor,_vacuum_pump",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Waste_gas_cooling",
                    cModule: "Compressor",
                    pidLabel: "C10",
                    variable: "Compressor_18"
                },
                {
                    shapeName: "electric_motor",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel",
                    cModule: "Motor",
                    variable: "Motor_20"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_L",
                    pidFunction: "LS",
                    pidNumber: "1000",
                    variable: "Kettle_sensor_L_21"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_Z",
                    pidFunction: "ZS",
                    pidNumber: "1000",
                    variable: "Kettle_sensor_Z_22"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_T",
                    pidFunction: "TE",
                    pidNumber: "1000",
                    variable: "Kettle_sensor_T_24"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Steam_heating",
                    cModule: "Control_valve_420",
                    variable: "Control_valve_420_26"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Steam_heating",
                    cModule: "Control_valve_410",
                    variable: "Control_valve_410_27"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_160",
                    variable: "Control_valve_160_31"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_170",
                    variable: "Control_valve_170_32"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_150",
                    variable: "Control_valve_150_33"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_220",
                    variable: "Control_valve_220_34"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_360",
                    variable: "Control_valve_360_35"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_320",
                    variable: "Control_valve_320_36"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_130",
                    variable: "Control_valve_130_37"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_140",
                    variable: "Control_valve_140_38"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_120",
                    variable: "Control_valve_120_39"
                },
                {
                    shapeName: "positive_displacement",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Sensor_flow",
                    pidFunction: "FT",
                    pidNumber: "3000",
                    variable: "Sensor_flow_40"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Valve_BELIMO",
                    variable: "Valve_BELIMO_41"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_110",
                    variable: "Control_valve_110_43"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_020",
                    variable: "Control_valve_020_44"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_040",
                    variable: "Control_valve_040_45"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_030",
                    variable: "Control_valve_030_46"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_010",
                    variable: "Control_valve_010_47"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_580",
                    variable: "Control_valve_580_49"
                },
                {
                    shapeName: "pump_(liquid)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Pump_P30",
                    pidLabel: "P30",
                    variable: "Pump_P30_50"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Cold_water_distribution",
                    cModule: "Control_valve_560",
                    variable: "Control_valve_560_53"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixing_valve",
                    cModule: "Control_valve_310",
                    variable: "Control_valve_310_55"
                },
                {
                    shapeName: "three_way_valve",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixing_valve",
                    cModule: "Three_way_tap",
                    pidFunction: "FV",
                    pidNumber: "2000",
                    variable: "Three_way_tap_56"
                },
                {
                    shapeName: "positive_displacement",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixing_valve",
                    cModule: "Sensor_flow",
                    pidFunction: "FT",
                    pidNumber: "2000",
                    variable: "Sensor_flow_57"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixed_water_distribution",
                    cModule: "Control_valve_340",
                    variable: "Control_valve_340_59"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixed_water_distribution",
                    cModule: "Control_valve_350",
                    variable: "Control_valve_350_60"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixed_water_distribution",
                    cModule: "Control_valve_460",
                    variable: "Control_valve_460_61"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixed_water_distribution",
                    cModule: "Control_valve_470",
                    variable: "Control_valve_470_62"
                },
                {
                    shapeName: "pressurized_vessel",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel"
                },
                {
                    shapeName: "agitator_(propeller)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel"
                },
                {
                    shapeName: "shell_and_tube_heat_exchanger_2",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel"
                },
                {
                    shapeName: "funnel",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Waste_gas_cooling"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixing_valve",
                    pidFunction: "FT",
                    pidNumber: "2000"
                },
                {
                    shapeName: "tank_(conical_roof)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel"
                },
                {
                    shapeName: "agitator_(turbine)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    pidFunction: "FT",
                    pidNumber: "3000"
                },
                {
                    shapeName: "funnel",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet"
                }
            ];
            //let pidConnections = {};
            //let pidDataBindings = {};
            let pidXmlString = "";

            console.log("File uploaded and response added to object...");
            this.set(object, response);
            let pidShapesLibraryObject = this.get(object);
            console.log(`File loaded succesfully.`);
            //console.table(pidShapesLibraryObject);

            // Remove sapient disabled class for success-button
            document.getElementById("generate-pid-button").className =
                "button button-success";

            // Generate XML File of P&ID on button click
            function generatePidXml() {
                console.time();
                console.log("XML Generation started...");
                // Add sapient disabled class for success-button
                document.getElementById("generate-pid-button").className =
                    "button button-success disabled";
                // Display a loader in xml-viewer-div
                document.getElementById("xml-viewer-div").innerHTML =
                    "loading XML of P&ID Visualization...";
                // sapient loading doesn´t work here because out of scope
                //this.set('loading', true);

                // 1) TODO: Generate JSON Object of P&ID (pidJson) FROM DATABASE QUERIES
                let pidJson = [];
                // Add verteci to pidJson
                let pidVerteci = mapNodesToShapes(pidShapesLibrary, pidNodes);
                // Add edges to pidJson
                let pidEdges = mapConnectionsToShapes(pidShapesLibrary, pidConnections);
                // Add database bindings to pidJson 
                //let pidDatabaseBindings = mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings);
                // Concatenate arrays to single array using ES6 Spread operator
                //FIXME: Replace with: pidJson = [...pidVerteci, ...pidEdges, ...pidDatabaseBindings];
                pidJson = [...pidVerteci, ...pidEdges];
                // 2) Generate XML File of P&ID Visualization (pidXml) from pidJson
                pidXmlString = generatePidXmlString(pidJson);
                //let pidXml = parseXml(pidXmlString); // Delete: downloadFile() requires xml string not xml file

                // 3) Render XML as Text in xml-viewer-div of boardlet
                renderXml(pidXmlString);

                // 4) Enable download by adding event listener and removing sapient disabled class style
                document.getElementById("download-pid-button").addEventListener("click", () => {
                    downloadFile("pid-visualization.xml", pidXmlString);
                }, false);
                document.getElementById("download-pid-button").className =
                    "button button-success";

                console.log('generatePidXml() done after:');
                console.timeEnd();
            }
            document.getElementById("generate-pid-button").addEventListener(
                "click", () => {
                    generatePidXml();
                }, false);

            // Downloads XML File of P&ID on button click
            function downloadFile(filename, text) {
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
            }


            // Uploads XML File of P&ID on button click to C:\devsource\research-sapient-app\public\assets\detail-layout for Legato Graphic Designer Boardlet to import
            // function uploadPidXml() {
            //     this.set('loading', true);
            //     console.log("Upload P&ID XML-file to Sapient Engine...");
            // }

            ////////////////////////////////////////////////////////////////////
            //                         Secondary Function declarations:
            ////////////////////////////////////////////////////////////////////

            function mapNodesToShapes(pidShapesLibrary, pidNodes) {
                const pidShapesCount = pidShapesLibrary.length;
                const pidNodesCount = pidNodes.length;
                let pidVerteci = [];

                // TODO: pidNodes = (FETCH FROM PRJ_PRC_VISU_VERTECI)
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

            /*function mapConnectionsToShapes(pidShapesLibrary, pidConnections) {
                  const pidShapesCount = pidShapesLibrary.length;
                  const pidConnectionsCount = pidConnections.length;
                  let pidEdges = [];

                  // TODO: pidConnections = (FETCH FROM PRJ_PRC_PRO_FLOWS) 
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
              }*/

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

                // Add verteci:
                pidEquipments.forEach((pidEquipment) => {
                    const equipmentCount = pidEquipments.length;
                    console.log(`Generating XML-tags for ${equipmentCount} equipment instances...`);
                    pidXmlString += `
    <mxCell id="${pidEquipment._id}" value="${pidEquipment._value}" style="${pidEquipment._style}" vertex="${pidEquipment._vertex}" parent="${pidEquipment._parent}">
      <mxGeometry x="50" y="50" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
                });

                pidInstruments.forEach((pidInstrument) => {
                    const instrumentCount = pidInstruments.length;
                    console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
                    pidXmlString += `
    <mxCell id="${pidInstrument._id}" value="${pidInstrument._value}" style="${pidInstrument._style}" vertex="${pidInstrument._vertex}" parent="${pidInstrument._parent}">
      <mxGeometry x="50" y="50" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
                });

                pidArrows.forEach((pidArrow) => {
                    const arrowCount = pidArrows.length;
                    console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
                    pidXmlString += `
    <mxCell id="${pidArrow._id}" value="${pidArrow._value}" style="${pidArrow._style}" vertex="${pidArrow._vertex}" parent="${pidArrow._parent}">
      <mxGeometry x="50" y="50" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
                });

                pidGroups.forEach((pidGroup) => {
                    const groupCount = pidGroups.length;
                    console.log(`Generating XML-tags for ${groupCount} group instances...`);
                    pidXmlString += `
    <mxCell id="${pidGroup._id}" value="${pidGroup._value}" style="${pidGroup._style}" vertex="${pidGroup._vertex}" parent="${pidGroup._parent}">
      <mxGeometry x="50" y="50" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
                });

                // Add edges:
                pidLines.forEach((pidLine) => {
                    const lineCount = pidLines.length;
                    console.log(`Generating XML-tags for ${lineCount} line instances...`);
                    pidXmlString += `
    <mxCell id="${pidLine._id}" value="${pidLine._value}" style="${pidLine._style}" edge="${pidLine._edge}" source="${pidLine.source}" target="${pidLine.target}" parent="${pidLine._parent}">
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

            // FIXIT: Delete? Is this really necessary?
            // function parseXml(xmlString) {
            //     var domParser = new DOMParser();
            //     try {
            //         var xmlDocument = domParser.parseFromString(xmlString, "application/xml");
            //         console.log("pidXmlString parsed to pidXml File");
            //         return xmlDocument;
            //     } catch (error) {
            //         console.error(error);
            //     }
            // }

            function renderXml(xmlString) {
                console.log("Rendering pidXmlString as innerHTML...");
                // Formats raw XML-string to pretty print
                let formattedXmlString = formatXml(xmlString, "  ");
                // Encodes XML string to valid HTML string (HTML characters)
                let formattedHtmlString = escapeXmlToHtml(formattedXmlString);
                console.log(`pidHtmlString = \n${formattedHtmlString}`);
                document.getElementById("xml-viewer-div").innerHTML = formattedHtmlString;
            }


            function formatXml(xml, tab) { // tab = optional indent value, default is tab (\t)
                console.log("Formatting pidXmlString...");
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
                console.log("Escaping pidXmlString to pidHtmlString...");
                let htmlString = String(xmlString)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/ /g, "&nbsp;")
                    .replace(/\n/g, "<br />");
                return htmlString;
            }


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
            // }

            ////////////////////////////////////////////////////////////////////
        },

        loadError: function(err) {
            console.log("Error during File Upload...\n");
            console.log(err);
        }
    }
});
export default component;