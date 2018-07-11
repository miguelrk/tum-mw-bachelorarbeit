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
    loading: false,
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
        } else if (value === 1) {
            alert('Please select a node under the Legato root node.');
            document.getElementById('root-node-selection').value = 'Please select a node under the Legato root node.';
            document.getElementById('selection-field').style.color = 'red';
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
        if (0 >= progress && progress < this.get('maxProgressValue')) {
            this.set('showProgressBar',true);
            this.set("currentProgressValue", progress);
        }
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
        this.set('loading', true);

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
            document.getElementById('selection-field').style.borderColor = 'green';
            //document.getElementById('input-icon').className = 'icon-check';
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
        //let rootLevel = this.get('pidRootNode').nodeLevel;
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
                { nodeLevel: 'node_level' },
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
                    WHERE sapient_owner.l_nodes.id >= rootNodeId;

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
                { nodeLevel: 'node_level' },
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

        // Traverse node hierarchy (post-order DFS) and return path (flat vertices array in order)
        this.set('pidNodesInOrder', this.traverseAndSort(this.get('pidNodesTree')));
    
        // Add vertices to pidJson
        this.set('pidVertices', this.mapNodesToShapes());

        // Add edges to pidJson
        this.set('pidEdges', this.mapConnectionsToShapes());

        // Add edges to pidJson
        //this.set('pidDataBindings', this.mapDataBindingsToShapes());

        // Position vertices by modifying default _x and _y vertex properties and
        // concatenate arrays to single array using ES6 Spread operator
        this.set('pidJson', this.vertexPlacement(this.get('pidVertices'), this.get('pidEdges')));
        
        // Generate JSON string from JS-Object (individually for 5 distinct pid classes)
        this.set('pidJsonString', JSON.stringify(this.get('pidJson')));

        // Grid layout algorithm to set _x and _y attributes of vertices directly in pidJson
        //this.vertexLayoutAlgorithm(this.get('pidNodesTree'), this.get('pidVertices'), this.get('pidEdges'));

        // 2) Generate XML File of P&ID Visualization (pidXml) from pidJson
        this.set('pidXmlString', this.generatePidXmlString(this.get('pidJson')));
        //let pidXml = parseXml(pidXmlString); // Delete: downloadFile() requires xml string not xml file

        // 3) Render XML as Text in xml-viewer-div of boardlet
        this.set('loading', false);
        this.renderXml(this.get('pidXmlString'));
        console.log('generatePid() done after:');

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
        /**
        * Filters the queried nodes array to include only descendandts of 
        * selected root node and builds hierarchical/nested json object of the
        * instance hierarchy from a flat array via the parent attribute.
        */
        this.updateProgressBar(30);
        console.groupCollapsed("Building hierarchy (pidNodeTree) from pidNodes...");
        let queriedArray = flatArray;
        let filteredArray = [];
        let treeArray = [];
        let lookup = [];

        // Starting from selected root node at start of flatArray 
        // (becasue query: SELECT * WHERE id >= rootNodeId)
        console.groupCollapsed('1. Filtering out non descendants of selected root node.');
        queriedArray.forEach((node) => {
            let details = JSON.parse(node.details);

            // Root node:
            if (node.id === this.get('pidRootNodeId')) {
                filteredArray.push(node)
                console.log(`${node.shortName} is selected root node`);
            }
            // Descendants: If parent of current node found in descendants
            else if (filteredArray.some((descendant) => descendant.id === node.parentId)) {
                filteredArray.push(node);
                console.log(`${node.shortName} is descendant`);
            }
            // Non-descendants: If parent of current node not found in descendants
            else {
                // Skip
                console.log(`${node.shortName} is non-descendant`);
            }
        });
        console.log(`Selected ${filteredArray.length} descendants of ${queriedArray.length} total queried nodes.`);
        console.groupEnd();
        
        console.groupCollapsed('2. Extracting children of descendants via parent attributes.');
        filteredArray.forEach((node) => {
                let nodeId = node.id; // Select current node's id
                console.groupCollapsed(`${nodeId}: ${node.shortName}`);
                lookup[nodeId] = node; // Clone node to id key of lookup array 
                console.log(lookup[nodeId]);
                node.children = []; // Add a children property (array type)
                console.log('node[\'children\'] = \n');
                console.log(node['children']);
                console.groupEnd();
        });
        console.groupEnd();

        console.groupCollapsed('3. Building hierarchy for root node and descendants.');
        filteredArray.forEach((node) => {
            let nodeParentId = node.parentId;
            // ROOT NODE: If root node, skip lookup but push to tree
            if (lookup[nodeParentId] === undefined || node.parentId === 1) {
                // Skip lookup for topmost node (because parent won't be found
                // in the lookup array because hierarchy starts from this
                // node and not his parent) and also skip nodes with 
                // "Legato" node (id:1) as parent but do push them to tree
                // Skip lookup for topmost node ('Legato' with id=1) but do push
                // it to tree (because parent won't be found in the lookup array
                // because hierarchy starts from this node and not his parent) 
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
        console.groupEnd();
        return treeArray;
    },


    traverseAndSort: function(treeArray) {
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

        // Reverse path to start bottoms-up
        path.reverse();
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
        * according to the pidLevel set in traverseAndSort.
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
            if (details !== null && details !== undefined) pidNode.pidHierarchy = details.isaLevel;
            // Set shapeName Fallback: in case of no name (groups are modelled as nodes but not given a 
            // shapeName so shapeName set based on pidLevel, determined in traverseAndSort)
            if (!pidNode.shapeName || pidNode.shapeName === "" || pidNode.shapeName === null || pidNode.shapeName === undefined) {

                if (pidNode.pidHierarchy === 'Enterprise') {
                    // Skip shapeName setting because no shape exists for Enterprise
                }
                else if (pidNode.pidHierarchy === 'Site') {
                    pidNode.shapeName = "site_group";
                }
                else if (pidNode.pidHierarchy === 'Area') {
                    pidNode.shapeName = "area_group";
                }
                else if (pidNode.pidHierarchy === 'Cell') {
                    pidNode.shapeName = "processCell_group";
                }
                else if (pidNode.pidHierarchy === 'Unit') {
                    pidNode.shapeName = "unit_group";
                }
                else if (pidNode.pidHierarchy === 'EModule') {
                    pidNode.shapeName = "eModule_group"; // EModule Groups
                }
                else {
                    // Skip legato system root node
                }
                console.groupCollapsed(`${pidNode.id}: ${pidNode.shortName} shapeName was empty, now set to ${pidNode.shapeName}`);
                console.log('id:    ' + pidNode.id ? pidNode.id : 'empty');
                console.log('name:  ' + pidNode.shortName ? pidNode.shortName : 'empty');
                console.log('shapeName:  ' + pidNode.shapeName ? pidNode.shapeName : 'empty');
                console.log('pidLevel:    ' + pidNode.pidLevel ? pidNode.pidLevel : 'empty');
                console.log('pidHierarchy:    ' + pidNode.pidHierarchy ? pidNode.pidHierarchy : 'empty');
                console.groupEnd();
            }
            else {
                console.groupCollapsed(`${pidNode.id}: ${pidNode.shortName} had shapeName`);
                console.log('id:    ' + pidNode.id ? pidNode.id : 'empty');
                console.log('name:  ' + pidNode.shortName ? pidNode.shortName : 'empty');
                console.log('shapeName:  ' + pidNode.shapeName ? pidNode.shapeName : 'empty');
                console.log('pidLevel:    ' + pidNode.pidLevel ? pidNode.pidLevel : 'empty');
                console.log('pidHierarchy:    ' + pidNode.pidHierarchy ? pidNode.pidHierarchy : 'empty');
                console.groupEnd();
            }

            //Map node to shape via shapeName attributes
            matchingShape = this.get('pidShapesLibrary').find((shape) => shape.shapeName === pidNode.shapeName);
            //console.log(pidNode);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned) Alternatively: let pidVertex = Object.assign({}, pidNode, matchingShape);
            let pidVertex = { ...pidNode, ...matchingShape };
            pidVertices.push(pidVertex);
        });

        console.log(`Mapped ${pidNodesCount} node instances to vertex shapes from ${pidShapesCount} total shapes in library.`);
        console.log("pidVertices:");
        console.table(pidVertices);
        console.log(JSON.stringify(pidVertices));
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


    vertexPlacement: function(vertices, edges) {
        console.group("Positioning vertices in graph...");
        //console.log(JSON.stringify(vertices));
        console.table(vertices);
        //console.table(edges);
        //console.log(JSON.stringify(edges));

        // s:settings, m:memory, i:index, p:previous, v:vertex
        // SET ONCE AND NEVER RESET
        let s = {
            cellSpacing: 100, // spacing between 2 shapeCells
            cellMargin: 25,
            blockMargin: 60, // Margin between parent group and the contained block (area from left-and-uppermost cell corner and right-and-lowermost cell corner (calculated with top-, right-, bottom- and left-boundaries))
            groupSpacing: 100, // Spacing between 2 innerGroups
            groupMargin: 60, // Margin between parent innerGroup and child innerGroup (between units, and maybe emodules)
            pageWidth: 1654,
            pageHeight: 1169,
        };
        let m = {};
        let p = {}; // p: previousObject clone
        const pidLevelCount = findMax('pidLevel', vertices);
        let memory = []; // Needed to keep track (permanently until end of algorithm) of frequently accessed and calculated variables
        let stack = []; // Needed to keep track ONLY OF VERTICES WITH #CHILDOFGROUP (temporarily until ANY innerGroup of next level reached, where it is cleared) 
        // of frequently accessed and calculated variables #childOfNonGroup elements are not pushed to stack because they don't need to be offset by groupMargin,
        // only their parent and they move with it with their relative position to their parent
        for (let i = 0; i <= pidLevelCount; i++) {
            stack[i] = []; // Builds two-dimmensional array of stacks (one for each pidLevel)
        }

        console.log(`Instance Hierarchy (pidJson) has a total depth of ${pidLevelCount} pidLevels.`);

        let pidVertices = vertices.filter((v) => v.pidHierarchy !== 'Enterprise');
        
        pidVertices.forEach((v) => {

            if (v.shapeName && v.parentId) {

                console.group(`${v.pidLevel}: ${v.pidClass} (${v.shortName})`);
                console.log(`stack[${v.pidLevel}]`);
                console.table(stack[v.pidLevel]);
                // Frequently accessed variables pushed to memory object ('_' indicates mxGraph private variable)
                m = {
                // Constants:
                name: v.shortName,
                lvl: v.pidLevel,
                pidClass: v.pidClass,
                id: v.id,
                parent: vertices.find(vertex => vertex.id === v.parentId),
                siblings: vertices.filter(sibling => sibling.parentId === v.parentId),
                // To be calculated:
                tags: [],
                x: parseInt(v.mxGeometry._x, 10),
                y: parseInt(v.mxGeometry._y, 10),
                w: parseInt(v.mxGeometry._width, 10),
                h: parseInt(v.mxGeometry._height, 10),
                area: parseInt(v.mxGeometry._width, 10) * parseInt(v.mxGeometry._height, 10),
                left: parseInt(v.mxGeometry._x, 10),
                top: parseInt(v.mxGeometry._y, 10),
                right: parseInt(v.mxGeometry._width, 10),
                bottom: parseInt(v.mxGeometry._height, 10)
                };

                /*************************************************************************
                *                     SPECIFICATION OF CONSTRAINTS:                      *
                *************************************************************************
                * // TODO: Update sequence diagram to modell if-elses of constraint specification
                * Non-group Tags:
                *  - tag[0]: isShape
                *  - tag[1]: childOfGroup || childOfNonGroup
                *  - tag[2]: [nucleus || funnel || inline] || [centeredAboveParent || aroundParent || insideParent]      (if childOfGroup: [nucleus || funnel || inline] else if childOfNonGroup: [centeredAboveParent || aroundParent || insideParent])
                *  
                * Group Tags:
                *  - tag[0]: isGroup
                *  - tag[1]: childOfGroup || childOfNonGroup
                *  - tag[2]: outerGroup || innerGroup      (if shapeCategory='Site'||'Area'||'Cell': [outerGroup] else [innerGroup] )
                */
                // Determine tag (loosely coupled specification to)
                // Set tags for spacial relationships

                console.group(`1. Tag:`);

                /********************************SHAPES***********************************/
                if ("equipment" === v.pidClass || "instrument" === v.pidClass || "arrow" === v.pidClass) {
                    m.tags.push("isShape");

                    if ("group" === m.parent.pidClass) {
                    m.tags.push("childOfGroup");
                    if ("vessels" === v.shapeCategory) m.tags.push(`nucleusGroup`);
                    else if ("funnel" === v.shapeType) m.tags.push("funnel");
                    else if ("instrument" === v.shapeType) m.tags.push("centeredAboveParent");
                    else m.tags.push("inline"); // inline: vertical center-aligned, shifted right (all children of groups except vessels)
                    } else if ("group" !== m.parent.pidClass) {
                    m.tags.push("childOfNonGroup");
                    if ("engines" === v.shapeCategory) m.tags.push("centeredAboveParent");
                    if ("instruments" === v.shapeCategory) {
                        if ("vessels" !== m.parent.shapeCategory) m.tags.push("centeredAboveParent");
                        else if ("vessels" === m.parent.shapeCategory) m.tags.push("aroundParent");
                    }
                    if ("agitators" === v.shapeCategory) m.tags.push("insideParent");
                    }

                }
                /*******************************GROUPS************************************/
                else if ("group" === v.pidClass) {
                    m.tags.push("isGroup");
                    if (undefined === m.parent) m.tags.push("childOfGroup"); // catches undefined parent (for child with 'Legato' or Enterprise level root node as parent)
                    else if ("group" === m.parent.pidClass) m.tags.push("childOfGroup");
                    else if ("group" !== m.parent.pidClass) m.tags.push("childOfNonGroup");
                    if ("Site" === v.pidHierarchy) m.tags.push("outerGroup");
                    else if ("Area" === v.pidHierarchy) m.tags.push("outerGroup");
                    else if ("Cell" === v.pidHierarchy) m.tags.push("outerGroup");
                    else if ("Unit" === v.pidHierarchy) m.tags.push(`innerGroup`);
                    else m.tags.push(`innerGroup`);
                }
                console.log(m.tags);
                console.groupEnd();
                /******************END OF SPECIFICATION OF CONSTRAINTS********************/

                /*************************************************************************
                *       GRAPHING ALGORITHM: (ORTHOGONAL, INCLUSIVE VERTEX PLACEMENT)     *
                *************************************************************************/
                console.group(`2. Graph:`);

                /********************************SHAPES*****************************/
                if (m.tags.includes('isShape')) {
                    console.group("#isShape");

                    if (m.tags.includes('childOfGroup')) {
                    console.group("#childOfGroup");

                    if (m.tags.includes("inline")) {
                        console.group("#inline");

                        // TODO: Set x,y-coordinates relative to previous cell (if previous was group then set at origin (0, 0), else space it from previous cell) (Using conditional (ternary) Operator)
                        m.x = (p.pidClass === undefined || p.pidClass === "group" ? 0 : p.x + p.w + s.cellSpacing);
                        m.y = (p.pidClass === undefined || p.pidClass === "group" ? 0 : p.y + (p.h - m.h) / 2);
                        console.log(`Coordinates: (${m.x}, ${m.y})`);
                        //}

                        console.log(m);
                        console.groupEnd();
                    } else if (m.tags.includes("funnel")) {
                        // TODO: 
                        m.x = 600;
                        m.y = 600;
                    } else if (m.tags.includes("nucleusGroup")) {
                        console.group(`#nucleusGroup`); // nucleusGroups of all pidLevels
                        console.log(`nucleusGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);

                        let groupVertices = memory.filter((child) => (child.parentId === m.id));
                        groupVertices.push(m);
                        console.warn('groupVertices:')
                        console.warn(groupVertices);

                        // 1b) MEASURE: Calculate blockArea and then apply blockMargin to get groupArea (with blockWidth and height plus blockMargin on both sides)
                        const blockWidth = measureBlock('width', groupVertices);
                        const blockHeight = measureBlock('height', groupVertices);

                        // 2) SCALE: Update group dimensions (now with blockMargins)
                        scaleGroup(blockWidth, blockHeight, s.blockMargin, groupVertices);

                        // 3) SHIFT: Offset x,y-coordinates (if first in stack then set at origin (0, 0), else space it from previous group) (Using conditional (ternary) Operator)
                        shiftGroup(groupVertices);

                        console.groupEnd();
                    }

                    console.groupEnd();
                    } else if (m.tags.includes('childOfNonGroup')) {
                    console.group("#childOfNonGroup");

                    if (m.tags.includes('centeredAboveParent')) {
                        console.group("#centeredAboveParent");
                        console.log(`Centering shape above its parent (${m.parent.id}: ${m.parent.shortName}).`);
                        const parentWidth = parseInt(m.parent.mxGeometry._width);
                        console.log(`(${parentWidth} / 2) - (${m.w} / 2)`);
                        m.x = (parentWidth / 2) - (m.w / 2);
                        m.y = -m.h - s.cellSpacing;

                        console.groupEnd();
                    } else if (m.tags.includes('aroundParent')) {
                        console.group("#aroundParent");

                        // Set x,y-coordinates relative to previous childOfNonGroup
                        //const stackLength = stack[m.lvl].length;
                        const parentWidth = parseInt(m.parent.mxGeometry._width);

                        if (!p.tags.includes('aroundParent')) { // Case for first aroundParent in current level stack (because of order of vertices)
                        console.log(`1st aroundParent child of ${m.parent.shortName} set to take 1st slot.`);
                        m.x = parentWidth + s.cellSpacing;
                        m.y = s.cellSpacing;
                        } else if (p.tags.includes('childOfNonGroup')) {
                        // Case for second, third, ..., n-th childOfNonGroup in current level stack
                        console.log(`aroundParent child of ${m.parent.shortName} set to take next slot (offset relative to previous).`);
                        m.x = parentWidth + s.cellSpacing;
                        console.warn('p.y:');
                        console.warn(p.y);
                        m.y = p.y + p.h + s.cellMargin;
                        }
                        console.groupEnd();
                    }
                    console.groupEnd();
                    }
                }
                /*******************************GROUPS************************************/
                else if (m.tags.includes('isGroup')) {
                    console.group("#isGroup");

                    if (m.tags.includes('childOfGroup')) {
                    console.group("#childOfGroup");

                    if (m.tags.includes("innerGroup")) {
                        console.group(`#innerGroup`);
                        console.log(`innerGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);
                    } else if (m.tags.includes("outerGroup")) {
                        console.group("#outerGroup");
                        console.log(`outerGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);
                    }

                    // 1b) MEASURE: Calculate blockArea and then apply blockMargin to get groupArea (with blockWidth and height plus blockMargin on both sides)
                    const blockWidth = measureBlock('width', stack[p.lvl]);
                    const blockHeight = measureBlock('height', stack[p.lvl]);

                    // 2) SCALE: Update group dimensions (now with blockMargins)
                    scaleGroup(blockWidth, blockHeight, s.blockMargin, stack[p.lvl]);

                    // 3) SHIFT: Offset x,y-coordinates (if first in stack then set at origin (0, 0), else space it from previous group) (Using conditional (ternary) Operator)
                    shiftGroup(stack[m.lvl]);

                    // 4) CENTER: Center block inside group: offset all contained vertices within the group individually
                    centerBlockElements(stack[p.lvl]);

                    // 5) CLEAR: Clear stack[p.lvl] of previousPidLevel after offsetting them relative to their parrent (currentPidLevel)
                    stack[p.lvl].length = 0; // clears array and its references globally (areas = [] creates a new but might not delete previous, may lead to errors with references to previous array)
                    console.log(`Cleared stack[${p.lvl}] of previous pidLevel (${p.lvl}) after offsetting the children relative to their parent (current vertex with pidLevel ${m.lvl})`);

                    console.groupEnd();
                    }

                    console.groupEnd();
                } else if (m.tags.includes('childOfNonGroup')) {
                    console.group("#childOfNonGroup");
                    // Shouldn't ever exist
                    console.groupEnd();
                }



                console.groupEnd();

                /****************************SET VARIABLES********************************/

                console.group(`3. Set:`);

                // 1) Algorithm variables:
                m.left = m.x;
                m.top = m.y;
                m.right = m.x + m.w;
                m.bottom = m.y + m.h;
                console.log(`Sides updated for new coordinates: \nleft: ${m.left}\ntop: ${m.top}\nright: ${m.right}\nbottom: ${m.bottom}`);

                // 2) pidJson variables:
                v.mxGeometry._x = m.x;
                v.mxGeometry._y = m.y;
                if (!m.tags.includes('nucleusGroup')) {
                    // Skip setting width of shapeCell to width of group because m.w and
                    // m.h of nucleus was set to groupWidth and groupHeight already
                    v.mxGeometry._width = m.w;
                    v.mxGeometry._height = m.h;
                }

                console.log(`id: ${v.id}`);
                console.log(`parent: ${m.parent !== undefined ? m.parent.shortName : "N/A"}`);
                console.log(`m.x: ${v.mxGeometry._x} -> _x`);
                console.log(`m.y: ${v.mxGeometry._y} -> _y`);
                console.log(`m.w: ${v.mxGeometry._width} -> _width`);
                console.log(`m.h: ${v.mxGeometry._height} -> _height`);
                console.groupEnd();

                /*************************END OF ALGORITHM********************************/
                p = m; // Replace previous vertex p with current and re-iterate]
                //console.log("previous");
                //console.table(p);
                // For vertices with #childOfGroup: push current memory m to current level stack
                if (m.tags.includes('childOfGroup')) stack[m.lvl].push(m);
                // For all vertices: push  current memory m to memory array (#childOfNonGroup as well)
                memory.push({
                    lvl: m.lvl,
                    id: m.id,
                    name: m.name,
                    pidClass: m.pidClass,
                    parentId: m.parent ? m.parent.id : 1, // catches vertices with no parent (Enterprise level) and sets parentId to 1 ('Legato' root node)
                    tag0: m.tags[0],
                    tag1: m.tags[1],
                    tag2: m.tags[2],
                    tag3: m.tags[3],
                    x: m.x,
                    y: m.y,
                    w: m.w,
                    h: m.h,
                    area: m.area,
                    left: m.left,
                    top: m.top,
                    right: m.right,
                    bottom: m.bottom,
                });
                console.log(stack[m.lvl]);
                console.groupEnd();
                console.groupEnd();
            }
            console.groupEnd();
        });

        // FIXME: PROVISIONAL TO PLOT WANTED DATA (LIKE X Y W AND H AS TABLE) AFTER SETTING PIDJSON
        let data = [];
        let verticesData = pidVertices.filter(object => object._vertex === "1");
        let tableData;
        verticesData.forEach((v) => {
            tableData = {
            // Constants:
            lvl: v.pidLevel,
            id: v.id,
            name: v.shortName,
            pidClass: v.pidClass,
            x: v.mxGeometry._x,
            y: v.mxGeometry._y,
            w: parseInt(v.mxGeometry._width),
            h: parseInt(v.mxGeometry._height),
            };
            data.push(tableData);
        });

        /*************************END OF VERTICES LOOP********************************/
        console.log('memory:');
        console.table(memory);
        console.log('data:');
        console.table(data);


        function findMax(variable, array) {
            /**
            * Receives a variable name(string) and an array, maps corresponding values from array
            * to an array and returns the maximum.
            */
            return array.reduce((max, vertex) => (vertex[variable] > max ? vertex[variable] : max), array[0][variable]);
        }

        function totalSum(variable, array) {
            /**
            * Receives a variable name (string) and an array, maps corresponding values from array
            * to an array of values and returns the sum of all elements in array.
            */
            return array.map((obj) => obj[variable]).reduce((totalArea, a) => totalArea + a);
        }

        function getMin(variable, array) {
            /**
            * Receives a variable name (string) and an array, and returns the minimum.
            */
            return array.reduce((min, vertex) => (vertex[variable] < min ? vertex[variable] : min), array[0][variable]);
        }

        function getMax(variable, array) {
            /**
            * Receives a variable name (string) and an array, and returns the maximum.
            */
            return array.reduce((max, vertex) => (vertex[variable] > max ? vertex[variable] : max), array[0][variable]);
        }

        // function getVertexWithMin(variable, array) {
        //     /**
        //     * Receives a variable name (string) and an array, and returns the vertex with the minimum.
        //     */
        //     return array.reduce((min, vertex) => (vertex[variable] < min[variable] ? vertex : min), array[0]);
        // }

        // function getVertexWithMax(variable, array) {
        //     /**
        //     * Receives a variable name (string) and an array, and returns the vertex with the maximum.
        //     */
        //     return array.reduce((max, vertex) => (vertex[variable] > max[variable] ? vertex : max), array[0]);
        // }
        
        function applyOffset(coordinate, offset, stackedVertex) {
            console.log(`Shifting '${coordinate}'-coordinate by ${offset}`);
            if (coordinate === "x") {
            // Add x-offset to the mxGeometry._x property of the original vertex in vertices (and return value for setting to m.x)
            stackedVertex.x += offset;
            let originalVertex = vertices.find(v => v.id === stackedVertex.id);
            console.log(`x-Coordinate: (${originalVertex.mxGeometry._x}) ->  (${stackedVertex.x})`);
            originalVertex.mxGeometry._x = stackedVertex.x;
            m.left = m.x;
            m.top = m.y;
            m.right = m.x + m.w;
            m.bottom = m.y + m.h;
            } else if (coordinate === "y") {
            // Add y-offset directly to the mxGeometry._y property of the original vertex in vertices (and return value for setting to m.x)
            stackedVertex.y += offset;
            let originalVertex = vertices.find(v => v.id === stackedVertex.id);
            console.log(`y-Coordinate: (${originalVertex.mxGeometry._y}) ->  (${stackedVertex.y})`);
            originalVertex.mxGeometry._y = stackedVertex.y;
            }
        }

        // 1b) MEASURE: Calculate blockArea and then apply blockMargin to get groupArea (with blockWidth and height plus blockMargin on both sides)
        function measureBlock(measure, stack) {
            if (measure === 'width') return Math.abs(getMin('left', stack)) + getMax('right', stack);
            if (measure === 'height') return Math.abs(getMin('top', stack)) + getMax('bottom', stack);
        }
       
        // 2) SCALE: Update group dimensions (now with blockMargins)
        function scaleGroup(blockWidth, blockHeight, blockMargin, stack) {
            const blockArea = blockWidth * blockHeight;
            const groupWidth = 2 * blockMargin + blockWidth;
            const groupHeight = 2 * blockMargin + blockHeight;
            const groupArea = (2 * blockMargin + blockWidth) * (2 * s.blockMargin + blockHeight);
            console.log(`blockWidth = ${Math.abs(getMin("left", stack))} + ${getMax("right", stack)} = ${blockWidth}`);
            console.log(`blockHeight = ${Math.abs(getMin("top", stack))} + ${getMax("bottom", stack)} = ${blockHeight}`);
            console.log(`blockArea = ${blockWidth} + ${blockHeight} = ${blockArea}`);
            console.log(`groupArea = (blockMargin + blockWidth + blockMargin) * (blockMargin + blockHeight + blockMargin) = groupArea`);
            console.log(`groupArea = (${blockMargin}+${blockWidth}+${blockMargin}) * (${blockMargin}+${blockHeight}+${blockMargin}) = ${groupArea}`);
            console.log(`sumOfCellAreas = ${totalSum('area', stack)}  ->  blockArea = ${blockArea}  ->  groupArea = ${groupArea}`);
            m.w = groupWidth;
            m.h = groupHeight;
            m.area = groupArea;
        }

        // 3) SHIFT: Offset x,y-coordinates (if first in stack then set at origin (0, 0), else space it from previous group) (Using conditional (ternary) Operator)
        function shiftGroup(stack) {
                        
            if (m.tags.includes("nucleusGroup")) {
                const group = stack;
                const groupLength = stack.length;

                // AGREGAR groupX y groupY para que
                // para nucleus se tiene que actualizar el mxGeometry._y y ._y directamente desde aqui y no al final de la current iteration como
                // todos los demas por que el x y y tiene que estar set a la esquina del bloque y no a la esquina del nucleo del bloque
                const xOfGroupCorner = getMin("left", group);
                const yOfGroupCorner = getMin("top", group);

                // 3a) #nucleusGroup
                if (groupLength === 0) {
                    // Case if nucleus is first innerGroup in stack of current level
                    console.log(`${groupLength + 1}st innerGroup (nucleus) in stack[${m.lvl}].`);
                    m.x = 0 - xOfGroupCorner; // Sets nucleus corner at origin - xOfGroupCorner so that nucleusGroup corner lands on origin (0, 0) (ex: if nucleusGroup at x=10, sets to 0-10 so that nucleus set to - 10 which leaves the nucleusGroup at origin)
                    m.y = 0 - yOfGroupCorner; // Like above
                    console.log(`nucleusGroup (innerGroup) is first of stack an thus positioned at (${m.x}, ${m.y})`);
                } else if (groupLength >= 1) {
                    // Case if nucleus is second, third, ..., n-th innerGoup in stack
                    console.log(`nucleusGroup (innerGroup) number ${groupLength + 1} in stack[${m.lvl}].`);
                    const indexOfPrevious = groupLength - 1;
                    console.log(groupLength);
                    console.log(indexOfPrevious);
                    const xOfPrevious = group[indexOfPrevious].x;
                    const yOfPrevious = group[indexOfPrevious].y;
                    const wOfPrevious = group[indexOfPrevious].w;
                    const hOfPrevious = group[indexOfPrevious].h;
                    // Set x and y analog to #inline
                    m.x = - xOfGroupCorner + wOfPrevious + s.groupSpacing;
                    m.y = - yOfGroupCorner + (hOfPrevious / 2) - (m.h / 2);
                    //m.y = (yOfPrevious === undefined ? 0 : yOfPrevious + (bottomOfPrevious - hOfNucleusBlock) / 2);
                    console.log(`x-Coordinate = - xOfGroupCorner + wOfPrevious + s.cellSpacing = - ${xOfGroupCorner} + ${wOfPrevious} + ${s.cellSpacing} = ${m.x}`);
                    console.log(`y-Coordinate = - yOfGroupCorner + (hOfPrevious / 2) - (m.h / 2)) = - ${yOfGroupCorner} + (${hOfPrevious} - ${m.h}) / 2 = ${- yOfPrevious} + ${hOfPrevious - m.h} / 2 = ${m.y}`);
                    console.log(`nucleusGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`);
                }
            }
            
            else if (m.tags.includes('innerGroup')) {
                // 3b) #innerGroup

                const stackLength = stack.length;

                if (stackLength === 0) {
                // Case for first innerGroup in stack of current level
                console.log(`${stackLength + 1}st innerGroup in stack[${m.lvl}].`)
                m.x = 0
                m.y = 0
                console.log(
                    `innerGroup is first of stack an thus positioned at (${m.x}, ${m.y})`
                )
                } else if (stackLength >= 1) {
                // Case for second, third, ..., n innerGoup in stack
                console.log(`innerGroup number ${stackLength + 1} in stack[${m.lvl}].`)
                const indexOfPrevious = stackLength - 1
                console.log(stackLength)
                console.log(indexOfPrevious)
                const xOfPrevious = stack[indexOfPrevious].x
                const yOfPrevious = stack[indexOfPrevious].y
                const wOfPrevious = stack[indexOfPrevious].w
                const hOfPrevious = stack[indexOfPrevious].h
                console.log(xOfPrevious)
                console.log(yOfPrevious)
                // Set x and y analog to #inline
                m.x = xOfPrevious === undefined ? 0 : xOfPrevious + wOfPrevious + s.groupSpacing
                m.y = yOfPrevious === undefined ? 0 : yOfPrevious + (hOfPrevious - m.h) / 2
                console.log(
                    `x-Coordinate = xOfPrevious + wOfPrevious + s.cellSpacing = ${xOfPrevious} + ${wOfPrevious} + ${s.cellSpacing} = ${m.x}`
                )
                console.log(
                    `y-Coordinate = yOfPrevious + (hOfPrevious - m.h) / 2 = ${xOfPrevious} + (${hOfPrevious} - ${m.h}) / 2 = ${xOfPrevious} + ${hOfPrevious - m.h} / 2 = ${m.y}`
                )
                console.log(
                    `innerGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`
                )
                }
            }
            
            else if (m.tags.includes('outerGroup')) {
                // 3c) #outerGroup

                const stackLength = stack.length;

                if (stackLength === 0) {
                // Case for first outerGroup in stack of current level
                console.log(`${stackLength + 1}st outerGroup in stack[${m.lvl}].`)
                m.x = 0
                m.y = 0
                console.log(
                    `outerGroup is first of stack an thus positioned at (${m.x}, ${m.y})`
                )
                } else if (stackLength >= 1) {
                // Case for second, third, ..., n innerGoup in stack
                console.log(`outerGroup number ${stackLength + 1} in stack[${m.lvl}].`)
                const indexOfPrevious = stackLength - 1
                console.log(stackLength)
                console.log(indexOfPrevious)
                const xOfPrevious = stack[indexOfPrevious].x
                const yOfPrevious = stack[indexOfPrevious].y
                const wOfPrevious = stack[indexOfPrevious].w
                const hOfPrevious = stack[indexOfPrevious].h
                console.log(xOfPrevious)
                console.log(yOfPrevious)
                // Set x and y analog to #inline
                m.x = xOfPrevious === undefined
                    ? 0
                    : xOfPrevious + wOfPrevious + s.groupSpacing
                m.y = yOfPrevious === undefined
                    ? 0
                    : yOfPrevious + (hOfPrevious - m.h) / 2
                console.log(
                    `x-Coordinate = xOfPrevious + wOfPrevious + s.cellSpacing = ${xOfPrevious} + ${wOfPrevious} + ${s.cellSpacing} = ${m.x}`
                )
                console.log(
                    `y-Coordinate = yOfPrevious + (hOfPrevious - m.h) / 2 = ${xOfPrevious} + (${hOfPrevious} - ${m.h}) / 2 = ${xOfPrevious} + ${hOfPrevious - m.h} / 2 = ${m.y}`
                )
                console.log(
                    `outerGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`
                )
                }
            }

            console.log(`Coordinates set to: (${m.x}, ${m.y})`)
        }

        // 4) CENTER: Center block inside group: offset all contained vertices within the group individually
        function centerBlockElements (stack) {
            stack.forEach(vertex => {
                if (m.pidClass !== 'group') {
                // Case for non-group children
                console.group(
                    `Applying blockMargin offset of ${s.blockMargin} to ${vertex.name} for x and y.`
                )
                applyOffset('x', s.blockMargin, vertex)
                applyOffset('y', s.blockMargin, vertex)
                } else if (m.pidClass === 'group') {
                // Case for innerGroups that have other innerGroups as chidlren (for example units, and maybe emodules). groupMargin must be different
                console.log(
                    `Applying groupMargin offset of ${s.groupMargin} to ${vertex.name} for x and y.`
                )
                applyOffset('x', s.groupMargin, vertex)
                applyOffset('y', s.groupMargin, vertex)
                }
                if (m.id === vertex.id) {
                console.warn(
                    `WARNING: Group container not excluded from for each because ids match: ${m.id} === ${vertex.id} --> TRUE`
                )
                }
            })
            console.groupEnd()
        }
        centerBlockElements(stack[p.lvl]);


        return [...pidVertices, ...edges];
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
            grid: 0,
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
            shadow: 0,
            // FIXME: DELETE THIS WHEN -x and _y VALUES ALLWAYS VALID AFTER VERTEXPLACEMENT (NEVER NaN of Undefined)
            defaultPadding: 15
        };

        console.groupCollapsed("XML String generation started...");

        // TODO: Fix pid-current-value in xml-string-templates which is currently set to the ID
        // TODO: Set labels in value attribute in pid-shapes-library and set label=${pidEquipment.value} in template literals
        const htmlLabel = '&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 255 , 0)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;%pid-current-value%&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;';
        const htmlLabelInstrument = '&lt;table cellpadding=&quot;4&quot; cellspacing=&quot;0&quot; border=&quot;0&quot; style=&quot;font-size:1em;width:100%;height:100%;&quot;&gt;&lt;tr&gt;&lt;td&gt;%pid-function%&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;%pid-number%&lt;/td&gt;&lt;/table&gt; ';
        const htmlLabelGroup = '%pid-hierarchy%: %pid-label%';
        const htmlLabelLine = '&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 255 , 0)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;%pid-current-value%&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;';
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
    <object id="${pidEquipment.id ? pidEquipment.id : pidEquipment._id}" label="${pidEquipment.shapeCategory !== 'engines' ? htmlLabel : 'M'}" placeholders="1" pid-label="${pidEquipment.pidLabel ? pidEquipment.pidLabel : (pidEquipment.shortName ? pidEquipment.shortName : (pidEquipment.germanName ? pidEquipment.germanName : (pidEquipment.englishName ? pidEquipment.englishName : null)))}" pid-current-value="${pidEquipment.id}" pid-function="${pidEquipment.pidFunction}" pid-number="${pidEquipment.pidNumber}" sapient-bind="">
        <mxCell style = "${this.concatenateStyles(pidEquipment.styleObject)}"
        vertex = "${pidEquipment._vertex}"
        connectable = "1"
        parent = "${pidEquipment.parentId ? pidEquipment.parentId : pidEquipment._parent}" >
          <mxGeometry x="${pidEquipment.mxGeometry._x ? pidEquipment.mxGeometry._x : 50}" y="${pidEquipment.mxGeometry._y ? pidEquipment.mxGeometry._y : 50}" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
        </mxCell>
    </object>`;
        });

        const instrumentCount = pidInstruments.length;
        console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
        pidInstruments.forEach((pidInstrument) => {
            xmlString += `
    <object id="${pidInstrument.id ? pidInstrument.id : pidInstrument._id}" label="${htmlLabelInstrument}" placeholders="1" pid-label="${pidInstrument.pidLabel ? pidInstrument.pidLabel : (pidInstrument.shortName ? pidInstrument.shortName : (pidInstrument.germanName ? pidInstrument.germanName : (pidInstrument.englishName ? pidInstrument.englishName : null)))}" pid-current-value="${pidInstrument.id}" pid-function="${pidInstrument.pidFunction}" pid-number="${pidInstrument.pidNumber}" sapient-bind="">
      <mxCell style="${this.concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" connectable="1" parent="${pidInstrument.parentId ? pidInstrument.parentId : pidInstrument._parent}">
        <mxGeometry x="${pidInstrument.mxGeometry._x ? pidInstrument.mxGeometry._x : 50}" y="${pidInstrument.mxGeometry._y ? pidInstrument.mxGeometry._y : 50}" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
        });

        const arrowCount = pidArrows.length;
        console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
        pidArrows.forEach((pidArrow) => {
            xmlString += `
    <object id="${pidArrow.id ? pidArrow.id : pidArrow._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidArrow.pidLabel ? pidArrow.pidLabel : (pidArrow.shortName ? pidArrow.shortName : (pidArrow.germanName ? pidArrow.germanName : (pidArrow.englishName ? pidArrow.englishName : null)))}" pid-current-value="${pidArrow.id}" pid-function="${pidArrow.pidFunction}" pid-number="${pidArrow.pidNumber}" sapient-bind="">
      <mxCell style="${this.concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" connectable="1" parent="${pidArrow.parentId ? pidArrow.parentId : pidArrow._parent}">
        <mxGeometry x="${pidArrow.mxGeometry._x ? pidArrow.mxGeometry._x : 50}" y="${pidArrow.mxGeometry._y ? pidArrow.mxGeometry._y : 50}" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
        });

        const groupCount = pidGroups.length;
        console.log(`Generating XML-tags for ${groupCount} group instances...`);
        pidGroups.forEach((pidGroup) => {
            xmlString += `
    <object id="${pidGroup.id ? pidGroup.id : pidGroup._id}" label="${htmlLabelGroup}" placeholders="1" pid-label="${pidGroup.pidLabel ? pidGroup.pidLabel : (pidGroup.shortName ? pidGroup.shortName : (pidGroup.germanName ? pidGroup.germanName : (pidGroup.englishName ? pidGroup.englishName : null)))}" pid-hierarchy="${pidGroup.pidHierarchy}" pid-current-value="${pidGroup.id}" pid-function="${pidGroup.pidFunction}" pid-number="${pidGroup.pidNumber}" sapient-bind="">
      <mxCell style="${this.concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" connectable="${pidGroup._connectable}" parent="${pidGroup.parentId ? pidGroup.parentId : pidGroup._parent}">
        <mxGeometry x="${pidGroup.mxGeometry._x ? pidGroup.mxGeometry._x : graphSettings.defaultPadding}" y="${pidGroup.mxGeometry._y ? pidGroup.mxGeometry._y : graphSettings.defaultPadding}" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
        });

        // Add edges:
        const lineCount = pidLines.length;
        console.log(`Generating XML-tags for ${lineCount} line instances...`);
        pidLines.forEach((pidLine) => {
            // Find parent of source vertex and set the edge parent to it as well (edges won't work with distinct parent as their source)
            const source = pidJson.find((vertex) => vertex.id === pidLine.sourceId);
            const target = pidJson.find((vertex) => vertex.id === pidLine.targetId);
            const parent = pidJson.find((parent) => parent.id === source.id);
            xmlString += `
    <object id="${pidLine.id ? pidLine.id : pidLine._id}" label="${source.id}>${target.id}" placeholders="1" pid-label="${pidLine.pidLabel ? pidLine.pidLabel : (pidLine.shortName ? pidLine.shortName : (pidLine.germanName ? pidLine.germanName : (pidLine.englishName ? pidLine.englishName : 'Beer')))}" pid-current-value="${pidLine.id}" pid-function="${pidLine.pidFunction}" pid-number="${pidLine.pidNumber}" sapient-bind="">
      <mxCell id="${pidLine.id ? pidLine.id : pidLine._id}" style="${this.concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.sourceId}" target="${pidLine.targetId}" parent="${parent.id ? parent.id : pidLine._parent}">
        <mxGeometry relative="${pidLine.mxGeometry._relative ? pidLine.mxGeometry._relative : 1}" as="${pidLine.mxGeometry._as ? pidLine.mxGeometry._as : 'geometry'}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    // TODO:  Add database bindings

    // Add boilerplate closing tags
    xmlString += `
  </root>
</mxGraphModel>`;

        console.log('pidXmlString');
        console.log(xmlString);
        console.groupEnd();
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
