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
    lNodes: null,
    visuVertices: null,
    pidNodes: null,
    pidConnections: null,
    pidRootNodeId: undefined,
    pidRootNode: undefined,
    pidNodesTree: undefined,
    pidNodesInOrder: undefined,
    showProgressBar:false,
    currentProgressValue:0,
    maxProgressValue:100,
    pidVertices: undefined,
    pidEdges: undefined,
    pidDataBindings: undefined,
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
        // Skip initial value of pidRootNodeId Because null == undefined:
        // (variable == null) equals (variable === undefined || variable === null)
        if (value === null || value === undefined) { 
            this.set('rootNode', false);
            return
        } else {
            this.set('pidRootNodeId', value);
            this.getData('pidRootNode');            
        }

    }),


    checkToEnableButton: function(firstCheck) {
        /**
        * Checks fileInput and rootNode boolean values to enable or disable
        * Generate P&ID XML Button (default value is false, called with true on 
        * first call) 
        */
        if (firstCheck) {
            console.groupCollapsed('Waiting for file input and root node selection...');
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


    updateProgressBar: function (progress) {
        /**
         * Function to set the value of the progress bar.
         * NOT IMPLEMENTED YET
         * @param progress  0<=progress<=maxProgressVal, defines the value of the progress bar.
         */
        this.set('currentProgressValue', progress);
        if (progress === 0) this.set('showProgressBar',true);
        else if (0 > progress && progress < this.get('maxProgressValue'));
        else if (progress === 100) {
            // Reset and hide progress bar
            this.set('currentProgressValue', 0);
            this.set('showProgressBar',false);
        }
    },


    databaseQueries: function() {
        console.groupCollapsed('P&ID Generation started...');
        console.time();
        this.updateProgressBar(0);
        // Add sapient disabled class for success-button
        document.getElementById('generate-pid-button').className =
            'button button-success disabled';
        // TODO: Display a loader in xml-viewer-div
        // document.getElementById('xml-viewer-div').innerHTML =
        //     'Generating XML of P&ID Visualization...';
        this.set('loading', true); // FIXME: check if sapient loading works or out of scope

        // 1) TODO: Generate JSON Object of P&ID (pidJson) FROM DATABASE QUERIES
        console.groupCollapsed(`Querying database...`);
        this.set('lNodes', this.getData('lNodes'));
        this.set('visuVertices', this.getData('visuVertices'))
        this.set('pidConnections', this.getData('pidConnections'));
    },


    checkIfQueriesDone: function(data) {
        /** Checks if fetched data has been set to the variables by checking if
        * null or undefined simoultaneously if fetched data
        * hasn't yet been set to the variables. Because null == undefined:
        * (variable == null) equals (variable === undefined || variable === null)
        */
        let variables = [
            'pidRootNode',
            'lNodes',
            'visuVertices',
            'pidNodes',
            'pidConnections'
        ];
        let ok = {
            pidRootNode: false,
            lNodes: false,
            visuVertices: false,
            pidNodes: false,
            pidConnections: false
        };

        // Checks all variables and sets the corresonding boolean value
        console.groupCollapsed('Queries done status:')
        variables.forEach((variable) => {
            if (this.get(variable) === null || this.get(variable) === undefined) {
                ok[variable] = false;
                console.log(`${variable}: ${ok[variable]}`); 
            }
            else {
                // NOTE: pidNodes never set here to true, must be set afterwards (after Left Join)
                ok[variable] = true;
                console.log(`${variable}: ${ok[variable]}`);
            }
        });
        console.groupEnd();

        // Log root node name in boardlet
        if (ok.pidRootNode === true) {
            const rootNode = this.get('pidRootNode');
            //console.table(rootNode);
            let name = '';
            // Manage empty name fields for selected root nodes
            if (rootNode.shortName !== '') { name = rootNode[0].shortName }
            else { name = 'Invalid root node for visualization. Select another one.' } 
            //console.log(name);
            document.getElementById('root-node-selection').value = name;
            document.getElementById('input-icon').className = 'icon-check';
            this.set('rootNode', true);
            this.checkToEnableButton(this.get('firstCheck'));
        }
    
        // Left Join lNodes and visuVertices
        if (ok.lNodes === true && ok.visuVertices === true) {
            this.updateProgressBar(10);
            /*  Replicates PostgreSQL Left Join: 
                    SELECT * FROM sapient_owner.l_nodes 
                    LEFT JOIN sapient_owner.prj_prc_visu_vertices 
                    ON node = parent
            */
            let nodeInstances = [];
            this.get('lNodes').forEach((lNode) => {
                let vertexMatch = {};
                vertexMatch = this.get('visuVertices').find((visuVertex) => visuVertex.nodeId === lNode.id);
                // Clone all properties to NEW target object (which is returned) Alternatively: let pidVertex = Object.assign({}, pidNode, matchingShape);
                let nodeInstance = { ...lNode, ...vertexMatch };
                nodeInstances.push(nodeInstance);
            });
            this.set('pidNodes', nodeInstances);
            ok.pidNodes = true;
            //console.log('Merged lNodes and visuVertices to create pidNodes:');
            //console.table(this.get('pidNodes'));
        }
        // Continue with PID generation when all queries done
        if (ok.pidNodes === true && ok.pidConnections === true) {
            this.updateProgressBar(20);
            console.groupCollapsed('All queries done:')
            console.log('pidNodes:');
            console.log(this.get('pidNodes'));
            console.log('pidConnections:');
            console.log(this.get('pidConnections'));
            console.groupEnd();
            // TODO: Insert a log for count of nodes and connections in innerHTML 
            console.groupEnd();
            this.generatePid();
        }
    },


    getData: function(data) {
        console.log(`Querying database for ${data} records asyncronously...`);
        let resource;
        let filter;
        let rootId = this.get('pidRootNodeId');
        let nameMappings = [];

        // Build query parameters dynamically depending on data request
        if (data === "pidRootNode") {
            // TODO: SELECT node WHERE id = this.get('pidRootNodeId') 
            resource = 'l_nodes';
            filter = [{
                field: 'id',
                op: 'eq',
                val: rootId
            }];
            nameMappings = [
                { id: 'id' },
                { parentId: 'parent' },
                { shortName: 'short_name' },
                { germanName: 'name_0' },
                { englishName: 'name_1' },
                { details: 'attr_jsonb' },
            ];
        } 
        if (data === "lNodes") {
            /* POSTGRESQL QUERY: Select all fields of all nodes starting from
               selected root node (WHERE n.id >= rootNodeId)
               
                    SELECT * FROM sapient_owner.l_nodes 
                    LEFT JOIN sapient_owner.prj_prc_visu_vertices 
                    ON node = parent
                    WHERE sapient_owner.l_nodes.id >= 21691;

                resource = "l_nodes";
                alias = { "n":"l_nodes", "v":"prj_prc_visu_vertices" };
                fields = { "n":[ "id", "node_level", "parent", "short_name", "name_0", "attr_jsonb" ], "v":[ "id", "node", "is_instrument", "shape_name", "pid_label", "pid_function", "pid_number" ]};
                relate = [{ "src":"n", "dst":"v", "how":"left", "on":{ "src":"id", "dst":"nodeId" } }];
                filter = [{ "field":"n.id", op:"ge", "val":this.get("pidRootNodeId") }];
                subscriptionOptions = undefined;
                model = undefined;
            */
            /* POSTGRESQL QUERY: Find all parents from vertices recursively
                    -- Select all vertices
                    select * from sapient_owner.prj_prc_visu_vertices;

                    -- Build tree by fetching all parents of vertices 
                    with recursive tree (id, node_level, parent, short_name, name_0, attr_jsonb) as (
                        --start with the "anchor" row
                        select id, node_level, parent, short_name, name_0, attr_jsonb
                        from sapient_owner.l_nodes
                        where id in (select distinct(node)
                        from sapient_owner.prj_prc_visu_vertices)
                        
                        union all
                        
                        select n.id, n.node_level, n.parent, n.short_name, n.name_0, n.attr_jsonb
                        from sapient_owner.l_nodes n
                        join tree on tree.parent = n.id
                    )

                    -- Selects data to left join and return
                    select distinct(tree.id), parent as parent_id, vertex.id as vertex_id, short_name, name_0, is_instrument, shape_name, pid_label, pid_function, pid_number, attr_jsonb
                    from tree 
                    left join sapient_owner.prj_prc_visu_vertices vertex on tree.id = vertex.node
                    where parent is not null
                    order by
                    id; 
            */  
            resource = 'l_nodes';
            filter = [{ 
                field: 'id',
                op: 'ge',
                val: rootId
            }];
            nameMappings = [
                { id: 'id' },
                { parentId: 'parent' },
                { shortName: 'short_name' },
                { germanName: 'name_0' },
                { englishName: 'name_1' },
                { details: 'attr_jsonb' },
            ];
        }                                                                                      
        if (data === "visuVertices") {
            resource = 'prj_prc_visu_vertices';
            filter = [{ field: 'id', op: 'nn' }];
            nameMappings = [
                { vertexId: 'id' },
                { nodeId: 'node' },
                { isInstrument: 'is_instrument' },
                { shapeName: 'shape_name' },
                { pidLabel: 'pid_label' },
                { pidFunction: 'pid_function' },
                { pidNumber: 'pid_number' }
            ];
        }
        if (data === "pidConnections") {
            // FIXME: determine resource (table) name
            resource = 'prj_prc_pro_flows';
            filter = [{ field: 'id', op: 'nn' }];
            nameMappings = [
                { id: 'id'},
                { sourceId: 'node0' },
                { targetId: 'node1' },
                { sourcePort: 'port0' }, // FIXME
                { targetPort: 'port1' },
                { product: 'product' },
                { isContinuous: 'is_continuous' },
                { rateValue: 'rate_value' },
                { flowType: 'flow_type' }
            ];
        }

        //console.log(`resource: ${resource}`);
        //console.log(`filter:`);
        //console.log(filter);

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
                //console.log(`Succesfully parsed queried ${data} data to object:`);
                //console.table(jsObject);
                //console.log(`jsObjectString (${data}): \n`);
                //console.log(JSON.stringify(jsObject));
            }

        })
        .then(() => {
            // Set parsed jsObject to corresonding global varible (data)
            this.set(data, jsObject);
        })
        .then(() => {
            // TODO: IMPLEMENT WAIT FOR ALL QUERIES AND NOT ONLY NODES AND CONNECTIONS
            this.checkIfQueriesDone(data);
        });
    },


    generatePid: function() {
            
        // Create node hierarchy out of parent relations (filter nodes only from pidJson)
        this.set('pidNodesTree', this.buildHierarchy(this.get('pidNodes')));

        // Traverse node hierarchy (post-order DFS) and return path (vertices array in order)
        this.set('pidNodesInOrder', this.pathfinderDFS(this.get('pidNodesTree')));
    
        // Add vertices to pidJson
        this.set('pidVertices', this.mapNodesToShapes());

        // Add edges to pidJson
        this.set('pidEdges', this.mapConnectionsToShapes());

        // Add edges to pidJson
        //this.set('pidDataBindings', this.mapDataBindingsToShapes());

        // Position vertices by modifying default _x and _y vertex properties
        // FIXME: change to have a return value and call with this.set()
        this.vertexPlacement();

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


    buildHierarchy: function(flatArray) {
        this.updateProgressBar(30);
        console.groupCollapsed("Building hierarchy (pidNodeTree) from pidNodes...");
        let array = flatArray;
        console.log(array);
        let treeArray = [];
        let lookup = [];
        let root = flatArray[0];
        let rootDetails = JSON.parse(root.details);
        console.log(`rootDetails:`);
        console.log(rootDetails);
        let rootLevel = rootDetails.opcUALevel;
        console.log(`rootLevel: ${rootLevel}`);
        let atRootNodeLevel = true;

        // Starting from selected root node at start of flatArray (becasue query: SELECT * WHERE id >= rootNodeId)
        array.forEach((node) => {
            let details = JSON.parse(node.details);
            let currentLevel = details.opcUALevel;
            // Continue until
            
            if (rootLevel === currentLevel) {
                // Toggle when at root node level
                console.log(`rootLevel : currentLevel - ${rootLevel} : ${currentLevel}`);
                atRootNodeLevel = !atRootNodeLevel;
            }
            console.log(`rootLevel : currentLevel ${rootLevel} : ${currentLevel}`);
            if (atRootNodeLevel === false) {
                console.log(node);
                let nodeId = node.id; // Select current node's id
                console.log(`nodeId: ${nodeId}`);
                lookup[nodeId] = node; // Clone node to id key of lookup array 
                console.log(lookup[nodeId]);
                node.children = []; // Add a children property (array type)
                console.log('node[\'children\'] = \n');
                console.log(node['children']);
            }
            else {
                // Back at root node level, so do nothing until iterations 
                // completed (exclude extended families of root node's family)
            }
        });

        array.forEach((node) => {
            let nodeParentId = node.parentId;
            // ROOT NODE: If root node push to tree
            if (lookup[nodeParentId] === undefined || node.parentId === 1) {
                // FIXME: THIS SHOULD ONLY HAPPEN ONCE BECAUSE ONLY ONE ROOT NODE SELECTED, NOT ALL ITS SIBLINGS
                // PROBLEM IS DATABASE QUERIES THAT FETCHES SIBLINGS ALONG WITH SELECTED ROOT NODE BECAUSE OF ROOTNODEID > SELECTEDID CONDITION
                // Skip lookup for topmost node (because parent won't be found
                // in the lookup array because hierarchy starts from this
                // node and not his parent) and also skip nodes with 
                // "Legato" node (id:1) as parent but do push them to tree
                console.log(`${node.shortName} is root node for the hierarchy and wasn't attributed a parent.`);
                treeArray.push(node);
            } 
            // REST OF NODES: If not root node (and parentId attribute exists) push to parent's children array 
            else if (node.parentId) {
                console.log(nodeParentId);
                console.log(lookup[nodeParentId]);
                lookup[nodeParentId].children.push(node);
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


    pathfinderDFS: function(treeArray) {
        /**
        * Takes a tree (hierarchical JS-object with children array) and traverses
        * it (post-order DFS - depth-first search) to return the path of the
        * traversed vertices in the form of an ordered array of JS-objects.
        */
        this.updateProgressBar(40);
        console.groupCollapsed("Traversing pidNodeTree depth-first to find path...");

        let path = [];
        let stack = [];
        let tree = treeArray;
        let rootId = this.get('pidRootNodeId');
        console.log(`rootId: ${rootId}`);

        // For each root vertex (works even if more than one root)
        tree.forEach((v) => {
            // Set/reset pidLevel for roots (NOTE: skips enterprise level)
            let level = 0;
            v.pidLevel = level;
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
        //console.log('pathString = \n')
        //console.log(JSON.stringify(path));
        console.log('path = \n')
        console.log(path);
        console.groupEnd();
        return path;
    },


    mapNodesToShapes: function() {
        /**
        * Maps each pidNode to its corresponding vertex shape (E/I/G/A) and creates a pidVertex
        * instance with all pidNode and pidShape attributes. For pidNodes without 
        * a shapeName (shapeName === '') like groups, it determines the shapeName
        * according to the pidLevel set in pathfinderDFS.
        */
        this.updateProgressBar(70);
        console.groupCollapsed("Mapping nodes to shapes (equipment, instruments, arrows, groups)...");
        const pidShapesCount = this.get('pidShapesLibrary').length;
        const pidNodesCount = this.get('pidNodesInOrder').length;
        let pidVertices = [];
 
        // TODO: pidNodes = (FETCH FROM PRJ_PRC_VISU_VERTECI)
        this.get('pidNodesInOrder').forEach((pidNode) => {
            let matchingShape = {};
            let details = JSON.parse(pidNode.details);
            pidNode.pidHierarchy = details.isaLevel;
            // Set shapeName Fallback: in case of no name (groups are modelled as nodes but not given a 
            // shapeName so shapeName set based on pidLevel, determined in pathfinderDFS)
            if (!pidNode.shapeName || pidNode.shapeName === "" || pidNode.shapeName === "undefined") {
                if (pidNode.pidLevel === 0 || pidNode.pidHierarchy === 'Enterprise') {
                    // Skip shapeName setting because no shape exists for Enterprise
                }
                else if (pidNode.pidLevel === 1 || pidNode.pidHierarchy === 'Site') {
                    pidNode.shapeName = "site_group";
                }
                else if (pidNode.pidLevel === 2 || pidNode.pidHierarchy === 'Area') {
                    pidNode.shapeName = "area_group";
                }
                else if (pidNode.pidLevel === 3 || pidNode.pidHierarchy === 'Cell') {
                    pidNode.shapeName = "processCell_group";
                }
                else if (pidNode.pidLevel === 4 || pidNode.pidHierarchy === 'Unit') {
                    pidNode.shapeName = "unit_group";
                }
                else if (pidNode.pidLevel >= 5 || pidNode.pidHierarchy === 'EModule') {
                    pidNode.shapeName = "eModule_group"; // EModule Groups
                }
                else {
                    // Skip legato system root node
                }
                console.group('DOES NOT HAVE SHAPE');
                console.log('id: ' + pidNode.id);
                console.log('name:  ' + pidNode.shortName);
                console.log('shapeName:  ' + pidNode.shapeName);
                console.log('isaLevel:  ' + details.isaLevel);
                console.log('pidLevel:  ' + pidNode.pidLevel);
                console.log('pidHierarchy:  ' + pidNode.pidHierarchy);
                console.groupEnd();
            }
            else {
                console.groupCollapsed('HAS SHAPE');
                console.log('id:    ' + pidNode.id);
                console.log('name:  ' + pidNode.shortName);
                console.log('shapeName:  ' + pidNode.shapeName);
                console.log('isaLevel:  ' + details.isaLevel);
                console.log('pidLevel:    ' + pidNode.pidLevel);
                console.log('pidHierarchy:    ' + pidNode.pidHierarchy);
                console.groupEnd();
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
        console.log("pidVertices:");
        console.table(pidVertices);
        console.groupEnd();
        return pidVertices;
    },


    mapConnectionsToShapes: function() {
        /**
        * Maps each pidConnection to its corresponding edge shape and creates a pidEdge
        * instance with all pidConnection and pidShape attributes. Because only 
        * process_flows modelled, additionally determines
        * the shapeName according to certain PID Rules for pidConnections. 
        */
        this.updateProgressBar(80);
        console.groupCollapsed("Mapping connections to line shapes...");
        const pidShapesCount = this.get('pidShapesLibrary').length;
        let pidConnections = [];
        let pidEdges = [];

        console.log(this.get('pidConnections').length);
        console.log(this.get('pidConnections'));

        this.get('pidConnections').forEach((connection) => {
            // Find corresponding source and target vertices from pidVertices
            let source = this.get('pidVertices').find((vertex) => vertex.id === connection.sourceId);
            let target = this.get('pidVertices').find((vertex) => vertex.id === connection.targetId);

            // TODO: Filter out connections between vertices not present in 
            // pidVertices (all connections fetched from database, but root node
            // selection might filter out certain vertices, thus remove those
            // connections or mxGraph crashes)
            if ((source !== null || source !== undefined) && (target !== null || target !== undefined)) {
                pidConnections.push(connection);
                console.log(connection);
            }
        });

        pidConnections.forEach((pidConnection) => {
            // Find corresponding source and target vertices from pidVertices
            let source = this.get('pidVertices').find((vertex) => vertex.id === pidConnection.sourceId);
            let target = this.get('pidVertices').find((vertex) => vertex.id === pidConnection.targetId);
            /* PID RULES
                Set shapeName to pidConnection based on flowType attribute in 
                database or based on logical PID rules.
                +---------------+-----------+------------+-------+-------+------+
                | source\target | equipment | instrument | group | arrow | line |
                +---------------+-----------+------------+-------+-------+------+
                |   equipment   |     P     |      P     |   P   |   -   |   -  |
                +---------------+-----------+------------+-------+-------+------+
                |   instrument  |     P     |      D     |   D   |   -   |   -  |
                +---------------+-----------+------------+-------+-------+------+
                |     group     |     P     |      D     |   P   |   -   |   -  |
                +---------------+-----------+------------+-------+-------+------+
                |     arrow     |     -     |      -     |   -   |   -   |   -  |
                +---------------+-----------+------------+-------+-------+------+
                |      line     |     -     |      -     |   -   |   -   |   -  |
                +---------------+-----------+------------+-------+-------+------+
            */
            if (
                pidConnection.flowType === 'process_flow' || 
                (source.pidClass === 'equipment' && target.pidClass === 'equipment') || 
                (source.pidClass === 'equipment' && target.pidClass === 'instrument') || 
                (source.pidClass === 'equipment' && target.pidClass === 'group') || 
                (source.pidClass === 'instrument' && target.pidClass === 'equipment') ||
                (source.pidClass === 'group' && target.pidClass === 'equipment') || 
                (source.pidClass === 'group' && target.pidClass === 'group')) {
                pidConnection.shapeName = 'pipe_line';
            }
            else if (
                pidConnection.flowType === 'data_flow' || 
                (source.pidClass === 'instrument' && target.pidClass === 'instrument') || 
                (source.pidClass === 'instrument' && target.pidClass === 'group') || 
                (source.pidClass === 'group' && target.pidClass === 'instrument')) {
                pidConnection.shapeName = 'data_line';
            }
            else if (pidConnection.flowType === 'signal_flow') {
                pidConnection.shapeName = 'signal_line';
            }
            else if (pidConnection.flowType === 'connection_flow') {
                pidConnection.shapeName = 'connection_line';
            }
            /*else if ( // Instrument between two equipments
                (source.pidClass === 'equipment' && target.pidClass === 'instrument') || 
                (source.pidClass === 'instrument' && target.pidClass === 'equipment')) {
                // 'Short-circuit' equipment to equipment and create connection_line from pipe_line to instrument
                const source = this.get('pidVertices').find((vertex) => vertex.id === pidConnection.sourceId);
                const target = this.get('pidVertices').find((vertex) => vertex.id === pidConnection.targetId);
                pidConnection.shapeName = 'connection_line';
            } */
            else {
                // Default to connection line
                pidConnection.shapeName = 'connection_line';
            }
            
            let matchingShape = {};
            matchingShape = this.get('pidShapesLibrary').find((shape) => shape.shapeName === pidConnection.shapeName);
            //console.log(pidConnection);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned)
            let pidEdge = Object.assign({}, pidConnection, matchingShape);
            pidEdges.push(pidEdge);
        });
        console.log(`Mapped ${pidConnections.length} connection instances to edge shapes from ${pidShapesCount} total shapes in library.`);
        console.log('pidConnections:');
        console.log(pidConnections);
        console.log('pidEdges:');
        console.table(pidEdges);
        console.groupEnd();
        return pidEdges;
    },


    /*mapDataBindingsToShapes: function() {
        console.log('Mapping data bindings to shapes...');
    }*/


    vertexPlacement: function() {
        console.groupCollapsed("Positioning vertices in graph...");
        let vertices = this.get('pidVertices').reverse();
        let edges = this.get('pidEdges');
        console.table(this.get('pidJson'));
        //console.log('pidVertices');
        //console.log(JSON.stringify(vertices));
        //console.log('pidEdges');
        //console.log(JSON.stringify(edges));
        vertices.forEach((v) => {
            // Skip Legato and enterprise nodes
            if (v.shapeName) {
                // Store frequently accessed variables once
                let x = v.mxGeometry._x;
                let y = v.mxGeometry._y;
                let w = v.mxGeometry._width;
                let h = v.mxGeometry._height;
                let l = v.pidLevel;
                let siblings = vertices.filter((sibling) => sibling.parentId === v.parentId);
                let siblingsCount = siblings.length;
                console.log(`x: ${x}`);
                console.log(`y: ${y}`);
                console.log(`w: ${w}`);
                console.log(`h: ${h}`);
                console.log(`siblings: `);
                console.log(siblings);
                console.log(`siblingsCount: `);
                console.log(siblingsCount);

                switch (v.pidClass) {
                    case 'equipment':
                        break;
                    case 'instrument':
                        break;
                    case 'group':
                        break;
                    case 'arrow':
                        // Do nothing (arrows are not modelled, therefore non-existent)
                        break;
                    default:
                        // Skip root node (Enterprise level) because no shape
                        break;
                }
        }
        })

        console.groupEnd();
    },


    generatePidXmlString: function(pidJson) {
        this.updateProgressBar(90);
        console.groupCollapsed("Generating pidXmlString from pidJson...");
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

        console.groupCollapsed("XML String generation started...");

        // FIXME: Fix pid-current-value in xml-string-templates which is currently set to the ID
        const htmlLabel = '&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 0 , 255)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;%pid-current-value%&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;';
        const htmlLabelInstrument = '&lt;table cellpadding=&quot;4&quot; cellspacing=&quot;0&quot; border=&quot;0&quot; style=&quot;font-size:1em;width:100%;height:100%;&quot;&gt;&lt;tr&gt;&lt;td&gt;%pid-function%&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;%pid-number%&lt;/td&gt;&lt;/table&gt; ';
        const htmlLabelGroup = '%pid-class%: %pid-label%';
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
    <object id="${pidEquipment.id ? pidEquipment.id : pidEquipment._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidEquipment.pidLabel ? pidEquipment.pidLabel : pidEquipment.shortName ? pidEquipment.shortName : pidEquipment.germanName ? pidEquipment.germanName : pidEquipment.englishName}" pid-current-value="${pidEquipment.id}" pid-function="${pidEquipment.pidFunction}" pid-number="${pidEquipment.pidNumber}" sapient-bind="">
        <mxCell style="${this.concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" parent="${pidEquipment.parentId ? pidEquipment.parentId : pidEquipment._parent}">
          <mxGeometry x="${pidEquipment.mxGeometry._x ? pidEquipment.mxGeometry._x : 50}" y="${pidEquipment.mxGeometry._y ? pidEquipment.mxGeometry._y : 50}" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
        </mxCell>
    </object>`;
    });

    const instrumentCount = pidInstruments.length;
    console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
    pidInstruments.forEach((pidInstrument) => {
      xmlString += `
    <object id="${pidInstrument.id ? pidInstrument.id : pidInstrument._id}" label="${htmlLabelInstrument}" placeholders="1" pid-label="${pidInstrument.pidLabel ? pidInstrument.pidLabel : pidInstrument.shortName ? pidInstrument.shortName : pidInstrument.germanName ? pidInstrument.germanName : pidInstrument.englishName}" pid-current-value="${pidInstrument.id}" pid-function="${pidInstrument.pidFunction}" pid-number="${pidInstrument.pidNumber}" sapient-bind="">
      <mxCell style="${this.concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" parent="${pidInstrument.parentId ? pidInstrument.parentId : pidInstrument._parent}">
        <mxGeometry x="${pidInstrument.mxGeometry._x ? pidInstrument.mxGeometry._x : 50}" y="${pidInstrument.mxGeometry._y ? pidInstrument.mxGeometry._y : 50}" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    const arrowCount = pidArrows.length;
    console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
    pidArrows.forEach((pidArrow) => {
      xmlString += `
    <object id="${pidArrow.id ? pidArrow.id : pidArrow._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidArrow.pidLabel ? pidArrow.pidLabel : pidArrow.shortName ? pidArrow.shortName : pidArrow.germanName ? pidArrow.germanName : pidArrow.englishName}" pid-current-value="${pidArrow.id}" pid-function="${pidArrow.pidFunction}" pid-number="${pidArrow.pidNumber}" sapient-bind="">
      <mxCell style="${this.concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" parent="${pidArrow.parentId ? pidArrow.parentId : pidArrow._parent}">
        <mxGeometry x="${pidArrow.mxGeometry._x ? pidArrow.mxGeometry._x : 50}" y="${pidArrow.mxGeometry._y ? pidArrow.mxGeometry._y : 50}" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    const groupCount = pidGroups.length;
    console.log(`Generating XML-tags for ${groupCount} group instances...`);
    pidGroups.forEach((pidGroup) => {
      xmlString += `
    <object id="${pidGroup.id ? pidGroup.id : pidGroup._id}" label="${htmlLabelGroup}" placeholders="1" pid-label="${pidGroup.pidLabel ? pidGroup.pidLabel : pidGroup.shortName ? pidGroup.shortName : pidGroup.germanName ? pidGroup.germanName : pidGroup.englishName}" pid-class="${pidGroup.pidClass}" pid-current-value="${pidGroup.id}" pid-function="${pidGroup.pidFunction}" pid-number="${pidGroup.pidNumber}" sapient-bind="">
      <mxCell style="${this.concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" connectable="${pidGroup._connectable}" parent="${pidGroup.parentId ? pidGroup.parentId : pidGroup._parent}">
        <mxGeometry x="${pidGroup.mxGeometry._x ? pidGroup.mxGeometry._x : 50}" y="${pidGroup.mxGeometry._y ? pidGroup.mxGeometry._y : 50}" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    // Add edges:
    const lineCount = pidLines.length;
    console.log(`Generating XML-tags for ${lineCount} line instances...`);
    pidLines.forEach((pidLine) => {
      xmlString += `
    <object id="${pidLine.id ? pidLine.id : pidLine._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidLine.pidLabel ? pidLine.pidLabel : pidLine.shortName ? pidLine.shortName : pidLine.germanName ? pidLine.germanName : pidLine.englishName}" pid-current-value="${pidLine.id}" pid-function="${pidLine.pidFunction}" pid-number="${pidLine.pidNumber}" sapient-bind="">
      <mxCell style="${this.concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.sourceId}" target="${pidLine.targetId}" parent="${pidLine.parentId ? pidLine.parentId : pidLine._parent}">
        <mxGeometry relative="${pidLine.mxGeometry._relative ? pidLine.mxGeometry._relative : 1}" as="${pidLine.mxGeometry._as ? pidLine.mxGeometry._as : 'geometry'}"></mxGeometry>
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
        this.updateProgressBar(100);
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
            // For single node selection from Node Tree Boardlet
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

            // For multiple node selection from Node Tree Boardlet
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
