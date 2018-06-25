import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import EmberUploader from 'ember-uploader';
import ParameterContext from 'core/objects/parameter-context';
//import VisuVerticesModel from '/models/prj-prc-visu-verteci';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';


const uploader = EmberUploader.Uploader.create({
    xmlFileName: 'pid-visualization.xml',
    xmlUrl: './research-sapient-app/public/assets/detail-layout',
    method: 'POST' // POST is default method but PUT requiered to overwrite existing but not suported by this url
});

let component = SapientComponent.extend(Evented, {
        /**
     * @author Miguel Romero
     * @version 2.1
    */
    // Global Ember Variables to be accessible globally via this.get() or this.set():
    classNames: ['create-pid-component'],
    classNameBindings: ['inBar:component', 'inBar:create-pid-component'],
    toastMessagesService: service('toast-messages-service'),
    firstCheck: true,
    fileInput: false,
    rootNode: false,
    pidShapesLibrary: undefined,
    rootNodeQueryDone: false,
    pidNodesQueryDone: false,
    pidConnectionsQueryDone: false,
    pidNodes: undefined,
    pidConnections: undefined,
    pidRootNodeId: undefined,
    pidNodesTree: undefined,
    pidNodesInOrder: undefined,
    pidVertices: undefined,
    pidEdges: undefined,
    pidJson: undefined,
    pidJsonString: '',
    pidXmlString: '',
    pidHtmlString: '',
    // For database query:
    server: service,
    subscription: undefined,
    // Variable initialization:
    init() {
        this._super(...arguments);
        this.set('jsonObject', null);
        this.set('jsonString', '');
        this.checkToEnableButton(this.get('firstCheck'));
    },
    actions: {
        loadSuccess: function(object, response) {
            //console.log('File uploaded and response added to object...');
            this.set(object, response);
            this.set('pidShapesLibrary', this.get(object));
            console.log(`File loaded succesfully.`);
            //console.table(pidShapesLibrary);

            this.set('fileInput', true);
            this.checkToEnableButton();
        },
            
        loadError: function(err) {
            console.log('Error during File Upload...\n');
            console.log(err);

            // Reset to false if error on file upload change
            this.set('fileInput', false);
            this.checkToEnableButton();
        },
        
    },

    rootSelected: observer('parentView.parameters.node.value', function () {
        /**
        * Gets selected root node id on change in selection from Node Tree 
        * Boardlet from parentView.parameters.node.value and writes it in value
        * attribute of input field
        */
        let value = this.get('parentView.parameters.node.value');
        // Skip initial value of pidRootNodeId
        if (value === null) { 
            this.set('rootNode', false);
            return
        } else {
            this.set('pidRootNodeId', value);
            // TODO: document.getElementById('root-node-selection').value = this.getData('selected-root-node');
            document.getElementById('root-node-selection').value = this.get('pidRootNodeId')
            document.getElementById('input-icon').className = 'icon-check';
            console.log(`Root node selected: ${this.get('pidRootNodeId')}`);

            this.set('rootNode', true);
            this.checkToEnableButton(this.get('firstCheck'));
        }

    }),

    // updateRootNodeId: function(value) {
    //     /**
    //     * Gets called onChange of input field value attribute 
    //     * either if selected from Node Tree Boardlet or typed. 
    //     */
    //     this.set('pidRootNodeId', value);
    //     console.log(`Root node updated: ${this.get('pidRootNodeId')}`);

    //     this.set('rootNode', true);
    //     this.checkToEnableButton(this.get('firstCheck'));
    // },

    // rootTyped: observer(document.getElementById('root-node-selection'), function () {
    //     /**
    //     * Gets selected root node id on change in selection from Node Tree Boardlet from parentView.parameters.node.value
    //     */
    //     this.set('pidRootNodeId', this.get('parentView.parameters.node.value'));
    //     console.log(`Root node selected: ${this.get('pidRootNodeId')}`);
    //     document.getElementById('root-node-selection').value = this.get('pidRootNodeId');
        
    //     this.set('rootNode', true);
    //     this.checkToEnableButton(this.get('firstCheck'));
    // }),

    checkToEnableButton: function(firstCheck) {
        /**
        * Checks fileInput and rootNode boolean values to enable or disable
        * Generate P&ID XML Button (default value is false, called with true on 
        * first call) 
        */
        if (firstCheck) {
            console.group('Waiting for file input and root node selection...');
            this.set('firstCheck', false);
            return;
        }
        if (this.get('fileInput') && this.get('rootNode')) {
            // Remove sapient disabled class for success-button and add event listener
            document.getElementById('generate-pid-button').className =
                'button button-success';
            document.getElementById('generate-pid-button').addEventListener('click', () => {
                this.databaseQueries();
            },false);
            console.groupEnd();
        }
        else {
            // Add sapient disabled class for success-button and remove event listener
            document.getElementById('generate-pid-button').className = 
                'button button-success disabled';
            document.getElementById('generate-pid-button').removeEventListener('click', () => {
                this.databaseQueries();
            },false);
        }
    },

    databaseQueries: function() {
        console.group('P&ID Generation started...');
        console.time();
        // Add sapient disabled class for success-button
        document.getElementById('generate-pid-button').className =
            'button button-success disabled';
        // Display a loader in xml-viewer-div
        document.getElementById('xml-viewer-div').innerHTML =
            'Generating XML of P&ID Visualization...';
        this.set('loading', true); // FIXME: check if sapient loading works or out of scope

        // 1) TODO: Generate JSON Object of P&ID (pidJson) FROM DATABASE QUERIES
        console.group(`Querying database...`);
        this.set('pidNodes', this.getData('pid-nodes'));
        this.set('pidConnections', this.getData('pid-connections'));
        
        if (this.get('pidNodesQueryDone') && this.get('pidConnectionsQueryDone')) {
            console.log(this.get('pidNodes'));
            console.log(this.get('pidConnections'));
            console.groupEnd();
            this.generatePid();
        }
    },

    generatePid: function() {
            
        // Create node hierarchy out of parent relations (filter nodes only from pidJson)
        this.set('pidNodesTree', this.buildHierarchy(this.get('pidNodes')));

        // Traverse node hierarchy (post-order DFS) and return path (vertices array in order)
        this.set('pidNodesInOrder', this.pathfinder(this.get('pidNodesTree')));
    
        // Add vertices to pidJson
        this.set('pidVertices', this.mapNodesToShapes());

        // Add edges to pidJson
        // TODO: _parent attribute must be overriden from default (_parent='1';) for ALL Nodes (info from DB fetch)
        this.set('pidEdges', this.mapConnectionsToShapes());

        // Concatenate arrays to single array using ES6 Spread operator
        // FIXME: Replace with: pidJson = [...pidVertices, ...pidEdges, ...pidDatabaseBindings];
        this.set('pidJson', [...this.get('pidVertices'), ...this.get('pidEdges')]);
        
        // Generate JSON string from JS-Object (individually for 5 distinct pid classes)
        this.set('pidJsonString', JSON.stringify(this.get('pidJson')));

        // Grid layout algorithm to set _x and _y attributes of vertices directly in pidJson
        //this.vertexLayoutAlgorithm(this.get('pidNodesTree'), this.get('pidVertices'), this.get('pidEdges'));

        // 2) Generate XML File of P&ID Visualization (pidXml) from pidJson
        this.set('pidXmlString', this.generatePidXmlString(this.get('pidJson')));
        //let pidXml = parseXml(pidXmlString); // Delete: downloadFile() requires xml string not xml file

        // 3) Render XML as Text in xml-viewer-div of boardlet
        this.renderXml(this.get('pidXmlString'));
        console.log('generatePid() done after:');
        this.set('loading', false); // FIXME: check if sapient loading works or out of scope

        // 4) Remove sapient disabled class for success-button and adds event listener
        document.getElementById('download-json-button').className = 'button';
        document.getElementById('download-xml-button').className = 'button';
        document.getElementById('upload-pid-button').className = 'button button-success';
        document.getElementById('download-json-button').addEventListener('click', () => {
                this.downloadFile('pid-visualization.json', this.get('pidJsonString'));
            },false);
        document.getElementById('download-xml-button').addEventListener('click', () => {
                this.downloadFile('pid-visualization.xml', this.get('pidXmlString'));
            },false);
        // TODO: Change callback to uploadFile() when done implementing
        document.getElementById('upload-pid-button').addEventListener('click', () => {
                this.uploadXmlFile(this.get('pidXmlString'));
            },false);

        console.timeEnd();
        console.groupEnd();
    },


    getData: function(data) {
        console.log(`Querying database for ${data} records...`);
        let resource;
        let filter;
        let nameMappings = [];

        // Build filter dynamically depending on data request
        if (data === "selected-root-node") {
            // TODO: SELECT node WHERE id = this.get('pidRootNodeId') 
            resource = 'l_nodes';
            filter = [{
                field: 'id',
                op: 'eq',
                val: this.get('pidRootNodeId')
            }];
            nameMappings = [
                { name: 'name_0'}
            ];
        }
        if (data === "pid-nodes") {
            // TODO: fetch parent field (in l_nodes) of each record 
            resource = 'prj_prc_visu_vertices';
            filter = [{ field: 'id', op: 'nn' }];
            nameMappings = [
                { id: 'id' },
                { nodeId: 'node' },
                { isInstrument: 'is_instrument' },
                { shapeName: 'shape_name' },
                { pidLabel: 'pid_label' },
                { pidFunction: 'pid_function' },
                { pidNumber: 'pid_number' }
            ];
        }
        if (data === "pid-connections") {
            // FIXME: determine resource (table) name
            resource = 'prj_prc_pro_flows';
            filter = [{ field: 'id', op: 'nn' }];
            nameMappings = [
                { id: 'id'},
                { sourceId: 'node0' },
                { targetId: 'node1' },
                { shapeName: 'port0' },
                { pidLabel: 'port1' },
                { pidFunction: 'product' },
                { pidNumber: 'is_continuous' },
                { shapeName: 'rate_value' },
                { pidLabel: 'flow_type' }

            ];
        }

        console.log(`resource: ${resource}`);
        console.log(`filter:`);
        console.log(filter);

        let jsObject = [];

        this.get('server').getRecords(resource, {
            filter: filter
        }, 
        undefined)
        .then((result) => {
            //console.log('Database query result: \n');
            //console.log(result);
            if (result.content.length > 0) {
                let jsonClassArray = result.content;
                //console.log('jsonClassArray: \n');
                //console.log(jsonClassArray);
                // Build jsObject with only fields in corresonding model
                jsonClassArray.forEach((row) => {
                    let object = {};
                    nameMappings.forEach((entry) => {
                        let attribute = Object.keys(entry);
                        let field = Object.values(entry);
                        object[attribute] = row[field];
                    })
                    jsObject.push(object);
                });
                /* ALTERNATIVELY:
                    jsonClassArray.forEach((row) => {
                        let object = {};
                            modelKeys.forEach((key) => {
                                object[key] = row[key];
                            });
                        jsObject.push(object);
                    });
                    console.log(`jsObject (${data}): \n`);
                    console.log(jsObject);
                    console.log(`jsObjectString (${data}): \n`);
                    console.log(JSON.stringify(jsObject));
                    }
                */
                console.log(`Succesfully parsed queried ${data} data to object:`);
                console.table(jsObject);
                //console.log(`jsObjectString (${data}): \n`);
                //console.log(JSON.stringify(jsObject));
            }

        })
        .then(() => {
            if (data === "selected-root-node") {
                this.set('rootNodeQueryDone', true);
                console.log(`rootNodeQueryDone : ${this.get('rootNodeQueryDone')}`);
            } 
            else if (data === "pid-nodes") {
                this.set('pidNodesQueryDone', true);
                console.log(`pidNodesQueryDone : ${this.get('pidNodesQueryDone')}`);
            } 
            else if (data === "pid-connections") {
                this.set('pidConnectionsQueryDone', true);
                console.log(`pidConnectionsQueryDone : ${this.get('pidConnectionsQueryDone')}`);
            }
            return jsObject;
        });
    },



    buildHierarchy: function(flatArray) {
        console.group("Building hierarchy (pidNodeTree) from pidNodes...");
        let array = flatArray;
        console.log(array);
        let treeArray = [];
        let lookup = [];

        array.forEach((node) => {
            //console.log(node);
            let nodeId = node.id; // Select current node's id
            //console.log(`nodeId: ${nodeId}`);
            lookup[nodeId] = node; // Clone node to id key of lookup array 
            //console.log(lookup[nodeId]);
            node.children = []; // Add a children property (array type)
            //console.log('node[\'children\'] = \n');
            //console.log(node['children']);
        });
        array.forEach((node) => {
        if (node.parent) {
            let nodeParent = node.parent;
            lookup[nodeParent].children.push(node);
        } else {
            treeArray.push(node);
        }
        });
        let treeString = JSON.stringify(treeArray);
        console.log('treeString = \n');
        console.log(treeString);
        console.log('tree = \n');
        console.log(treeArray);
        console.groupEnd();
        return treeArray;
    },


    pathfinder: function(treeArray) {
        /**
        * Takes a tree (hierarchical JS-object with children array) and traverses
        * it (post-order DFS - depth-first search) to return the path of the
        * traversed vertices in the form of an ordered array of JS-objects.
        */
        console.group("Traversing pidNodeTree depth-first to find path...");
        // TODO: map root extendedProperties ISO-Hierarchy-Class (ex. eModule) to the corresponding pidLevel to start from there
        const isoHierarchy = [ // Plant hierarchy ISA-S88.01:
        "enterprise", // May contain a site
        "site", // May contain an area
        "area", // May contain a processCell
        "process_cell", // Must contain a unit
        "unit", // May contain a equipment module
        "equipment_module", // May contain a control module
        "control_module", // May contain other control modules (recursively)
        "control_module", // If recursion
        "control_module", // If recursion
        "control_module", // If recursion
        "control_module", // If recursion
        "control_module" // If recursion
        ];
        let path = [];
        let stack = [];
        let tree = treeArray;
        let rootId = this.get('pidRootNodeId');
        console.log(`rootId: ${rootId}`);

        // For each root vertex (works even if more than one root)
        tree.forEach((v) => {
        // Set/reset pidLevel for roots (NOTE: skips enterprise level)
        let level = 1;
        v.pidLevel = level;
        v.pidHierarchy = isoHierarchy[level];
        //console.log("Root = \n");
        //console.log(v);
        // Add root to stack
        stack.push(v);

        // While stack exists and not empty (vertices pending in stack)
        while (stack && stack.length) {
            //console.log("stack = \n");
            //console.log(stack);
            // Pop next vertex from top of stack
            v = stack.pop();
            //console.log("v = \n");
            //console.log(v);
            // If pidLevel of current vertex was set already during traversal
            if (v.pidLevel !== "") {
            // Resets level to level of current vertex
            level = v.pidLevel;
            }
            // If vertex exists and not already (not found) in path array:
            if (v !== undefined && (!path.find((v) => path.id === v.id))) {
            // Record vertex (all properties) in path array (flat)
            path.push(v);
            //console.log("path array = \n");
            //console.log(path);
            //console.log("path array length = \n");
            //console.log(path.length);
            // If vertex has children
            if (v.children && v.children.length) {
                // Lower level by one (for all children)
                level += 1;
                // For all children of vertex
                v.children.forEach((child) => {
                child.pidLevel = level;
                child.pidHierarchy = isoHierarchy[level];
                // Push children (if any) to stack
                stack.push(child);
                });
                // Delete nested hierachy for given vertex (or clear with v.children = null;)
                delete v.children;
            }
            }
            // Raise level by one (after adding all children to stack)
            level -= 1;
        }
        });
        console.log('pathString = \n')
        console.log(JSON.stringify(path));
        console.log('path = \n')
        console.log(path);
        console.groupEnd();
        return path;
    },


    mapNodesToShapes: function() {
        console.group("Mapping nodes to shapes (equipment, instruments, arrows, groups)...");
        const pidShapesCount = this.get('pidShapesLibrary').length;
        const pidNodesCount = this.get('pidNodesInOrder').length;
        let pidVertices = [];

        // TODO: pidNodes = (FETCH FROM PRJ_PRC_VISU_VERTECI)
        this.get('pidNodesInOrder').forEach(pidNode => {
            let matchingShape = {};
            // Fallback for groups (groups are modelled as nodes but not given a 
            // shapeName so shapeName set based on pidLevel, determined in pathfinder)
            if (!pidNode.shapeName || pidNode.shapeName === "undefined") {
                // FIXME: Check if this fallback works or is needed
                switch (pidNode.pidLevel) {
                case 0: // Enterprise
                    pidNode.shapeName = "enterprise_group";
                    break;
                case 1: // Site
                    pidNode.shapeName = "site_group";
                    break;
                case 2: // Area
                    pidNode.shapeName = "area_group";
                    break;
                case 3: // Process Cell
                    pidNode.shapeName = "processCell_group";
                    break;
                case 4: // Unit
                    pidNode.shapeName = "unit_group";
                    break;
                case 5: // Equipment Module
                    pidNode.shapeName = "eModule_group";
                    break;
                }
            }
            //Map node to shape via shapeName attributes
            matchingShape = this.get('pidShapesLibrary').find((shape) => shape.shapeName === pidNode.shapeName);
            //console.log(pidNode);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned) Alternatively: let pidVertex = Object.assign({}, pidNode, matchingShape);
            let pidVertex = {
                ...pidNode,
                ...matchingShape
            };
            pidVertices.push(pidVertex);
        });

        console.log(`Mapped ${pidNodesCount} node instances to vertex shapes from ${pidShapesCount} total shapes in library.`);
        console.log("pidNodesInOrder:");
        console.table(this.get('pidNodesInOrder'));
        console.log("pidVertices:");
        console.table(pidVertices);
        console.groupEnd();
        return pidVertices;
    },


    mapConnectionsToShapes: function() {
        console.group("Mapping connections to line shapes...");
        const pidShapesCount = this.get('pidShapesLibrary').length;
        const pidConnectionsCount = this.get('pidConnections').length;
        let pidEdges = [];

        // TODO: pidConnections = (FETCH FROM PRJ_PRC_PRO_FLOWS)
        this.get('pidConnections').forEach(pidConnection => {
            let matchingShape = {};
            matchingShape = this.get('pidShapesLibrary').find(
                shape => shape.shapeName === pidConnection.shapeName
            );
            //console.log(pidConnection);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned)
            let pidEdge = Object.assign({}, pidConnection, matchingShape);
            pidEdges.push(pidEdge);
        });

        console.log(
            `Mapped ${pidConnectionsCount} connection instances to edge shapes from ${pidShapesCount} total shapes in library.`
        );
        //console.log('pidConnections:');
        //console.table(pidConnections);
        //console.log('pidEdges:');
        //console.table(pidEdges);
        console.groupEnd();
        return pidEdges;
    },


    /*function mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings) {
        console.log('Mapping data bindings to shapes...');
        // TODO: pidDataBindings = (FETCH FROM DATABASE TABLES)
    }*/


    generatePidXmlString: function(pidJson) {
                console.group("Generating pidXmlString from pidJson...");
                console.log('pidJson:');
                console.table(pidJson);
                // Filter nodes by their individual pidClasses and create new
                // individual objects (not too expensive and filtered once before
                // layout algorithm and string generation, both which need filtered data
                let pidEquipments;
                pidEquipments = pidJson.filter(
                    pidInstance => pidInstance.pidClass === 'equipment'
                );
                let pidInstruments;
                pidInstruments = pidJson.filter(
                    pidInstance => pidInstance.pidClass === 'instrument'
                );
                let pidArrows;
                pidArrows = pidJson.filter(
                    pidInstance => pidInstance.pidClass === 'arrow'
                );
                let pidGroups;
                pidGroups = pidJson.filter(
                    pidInstance => pidInstance.pidClass === 'group'
                );
                let pidLines;
                pidLines = pidJson.filter(
                    pidInstance => pidInstance.pidClass === 'line'
                );

                // let pidDatabaseBindings;
                // pidDatabaseBindings = pidJson.filter(
                //     pidInstance => pidInstance.pidClass === 'data_binding' ??? pidClass or xml object or what
                // );

                console.log(`pidEquipments: ${pidEquipments.length}`);
                console.log(`pidInstruments: ${pidInstruments.length}`);
                console.log(`pidArrows: ${pidArrows.length}`);
                console.log(`pidGroups: ${pidGroups.length}`);
                console.log(`pidLines: ${pidLines.length}`);

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
                    background: '#ffffff',
                    math: 0,
                    shadow: 0
                };

                console.group("XML String generation started...");

                const htmlLabel = '&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 0 , 255)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;4000 m3/s&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;';

                // Add mxGraph and mxGraphModel boilerplate settings
        let xmlString = `
<mxGraphModel dx="${graphSettings.dx}" dy="${graphSettings.dy}" grid="${graphSettings.grid}" gridSize="${graphSettings.gridSize}" guides="${graphSettings.guides}" tooltips="${graphSettings.tooltips}" connect="${graphSettings.connect}" arrows="${graphSettings.arrows}" fold="${graphSettings.fold}" page="${graphSettings.page}" pageScale="${graphSettings.pageScale}" pageWidth="${graphSettings.pageWidth}" pageHeight="${graphSettings.pageHeight}" background="${graphSettings.background}" math="${graphSettings.math}" shadow="${graphSettings.shadow}">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>`;

        // Add vertices:
    const equipmentCount = pidEquipments.length;
    console.log(`Generating XML-tags for ${equipmentCount} equipment instances...`);
    pidEquipments.forEach((pidEquipment) => {
      // Conditional inside template literal to set either parent or default _parent
      // Values not preceeded with '_' are instance attributes (from database)
      // FIXME: Remove id attribute in mxCell and leave it only in object?
      xmlString += `
    <object id="${pidEquipment.id}" label="${htmlLabel}" pid-label="${pidEquipment.pidLabel}" pid-hierarchy="${pidEquipment.pidHierarchy}" sapient-bind="">
        <mxCell value="${pidEquipment._value}" style="${this.concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" parent="${pidEquipment.parent ? pidEquipment.parent : pidEquipment._parent}">
          <mxGeometry x="50" y="50" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
        </mxCell>
    </object>`;
    });

    const instrumentCount = pidInstruments.length;
    console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
    pidInstruments.forEach((pidInstrument) => {
      xmlString += `
    <object id="${pidInstrument.id}" label="${htmlLabel}" pid-label="${pidInstrument.pidLabel}" pid-hierarchy="${pidInstrument.pidHierarchy}" sapient-bind="">
      <mxCell value="${pidInstrument._value}" style="${this.concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" parent="${pidInstrument.parent ? pidInstrument.parent : pidInstrument._parent}">
        <mxGeometry x="50" y="50" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    const arrowCount = pidArrows.length;
    console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
    pidArrows.forEach((pidArrow) => {
      xmlString += `
    <object id="${pidArrow.id}" label="${htmlLabel}" pid-label="${pidArrow.pidLabel}" pid-hierarchy="${pidArrow.pidHierarchy}" sapient-bind="">
      <mxCell value="${pidArrow._value}" style="${this.concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" parent="${pidArrow.parent ? pidArrow.parent : pidArrow._parent}">
        <mxGeometry x="50" y="50" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    const groupCount = pidGroups.length;
    console.log(`Generating XML-tags for ${groupCount} group instances...`);
    pidGroups.forEach((pidGroup) => {
      xmlString += `
    <object id="${pidGroup.id}" label="${htmlLabel}" pid-label="${pidGroup.pidLabel}" pid-hierarchy="${pidGroup.pidHierarchy}" sapient-bind="">
      <mxCell value="${pidGroup._value}" style="${this.concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" parent="${pidGroup.parent ? pidGroup.parent : pidGroup._parent}">
        <mxGeometry x="50" y="50" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    // Add edges:
    const lineCount = pidLines.length;
    console.log(`Generating XML-tags for ${lineCount} line instances...`);
    pidLines.forEach((pidLine) => {
      xmlString += `
    <object id="${pidLine.id}" label="${htmlLabel}" pid-label="${pidLine.pidLabel}" pid-hierarchy="${pidLine.pidHierarchy}" sapient-bind="">
      <mxCell value="${pidLine._value}" style="${this.concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.node_0}" target="${pidLine.node_1}" parent="${pidLine._parent}">
        <mxGeometry x="50" y="50" as="${pidLine.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    // Add database bindings

    // Add boilerplate closing tags
    xmlString += `
  </root>
</mxGraphModel>`;

        console.groupEnd();
        console.log(xmlString);
        console.groupEnd();
        return xmlString;
    },


    concatenateStyles: function(styleObject) {
        let styleString = '';
        //console.log(styleObject);
        // Converts object to array to iterate through all entries with forEach
        let valuesArray = Object.values(styleObject);
        valuesArray.forEach((value) => {
            if (value === '') {
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
        //console.log('Rendering pidXmlString as innerHTML...');
        // Formats raw XML-string to pretty print
        let formattedXmlString = this.formatXml(xmlString, '  ');
        // Encodes XML string to valid HTML string (HTML characters)
        let formattedHtmlString = this.escapeXmlToHtml(formattedXmlString);
        //console.log(`pidHtmlString = \n${formattedHtmlString}`);
        document.getElementById(
            'xml-viewer-div'
        ).innerHTML = formattedHtmlString;
    },


    formatXml: function(xml, tab) {
        // tab = optional indent value, default is tab (\t)
        //console.log('Formatting pidXmlString...');
        var formatted = '',
            indent = '';
        tab = tab || '\t';
        xml.split(/>\s*</).forEach((node) => {
            if (node.match(/^\/\w/))
                indent = indent.substring(tab.length); // decrease indent by one 'tab'
            formatted += indent + "<" + node + ">\r\n";
            if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab; // increase indent
        });
        return formatted.substring(1, formatted.length - 3);
    },


    escapeXmlToHtml: function(xmlString) {
        //console.log('Escaping pidXmlString to pidHtmlString...');
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
            var xmlDocument = domParser.parseFromString(xmlString, 'application/xml');
            console.log('pidXmlString parsed to pidXml File');
            return xmlDocument;
        } catch (error) {
            console.error(error);
        }
    },


    // Downloads XML File of P&ID on button click
    downloadFile: function(filename, text) {
        // stackoverflow: using-html5-javascript-to-generate-and-save-a-file
        var pom = document.createElement('a');
        pom.setAttribute(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
        );
        pom.setAttribute('download', filename);
        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    },

    
    uploadXmlFile: function(xmlText) {
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
        //     xhr.open('POST', url, true);
        //     console.log('xhr opened');
        //     // Sends the request to the server
        //     xhr.send(text);
        //     console.log('xhr sent');
        // },
        let xmlFile = this.parseXml(xmlText);
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
    }

});

    component.reopenClass({
        parameters: {
            node: {
                displayKey: 'parameters.node-id',
                value: null,
                parameterType: 'Integer',
                context: ParameterContext.InOut,
                category: 'filters',
                editor: {
                    component: 'input-component',
                    parameters: {
                        placeholder: 'Add node ID...',
                        hasIcon: true
                    }
                }
            },

            nodeList: {
                displayKey: 'parameters.selected-nodes',
                value: [],
                parameterType: 'NumberArray',
                context: ParameterContext.InOut,
                category: 'filters',
                editor: {
                    component: 'input-multi-component',
                    parameters: {
                        placeholder: 'Add node IDs...',
                        hasIcon: true
                    }
                }
            }
        }
    });

export default component;
