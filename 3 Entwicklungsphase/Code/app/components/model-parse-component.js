import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';
import {observer} from '@ember/object';

var component = SapientComponent.extend(Evented,{
        classNames: ['model-parse-component'],
        classNameBindings: ['inBar:component', 'inBar:model-parse-component'],
        toastService: service('toast-messages-service'),
        counter:0,
        totalNumber:0,
        parseQueue:null,
        propertyNumber:0,
        activeLog0:"",
        activeLog1:"",
        archiveLog:"",
        errorLog:"",
        progress:0.5,
        root:1,
        updatePossible:false,
        createNew:false,
        init(){
            this._super(...arguments);
        },
        nodeChanged: observer('parentView.parameters.node.value', function () {
            this.checkUpdatePossibility();
            console.log("observer fired...");
        }),
        checkUpdatePossibility:function(){
            //get Node
            var nodeId = this.get('parentView.parameters.node.value');
            var modelId = this.get('parentView.parameters.modelRootId.value');
            console.log("Node Id: " + nodeId + ", model id: " + modelId);
            if (nodeId && modelId){
                this.get('server').getRecords('l_nodes', {
                    filter: [ { field: 'id', op: 'eq', val: nodeId} ] },
                    undefined)
                .then(result => {
                    if(result.content.length>0){
                        result.content[0].name;
                        var jsonAttr = JSON.parse(result.content[0].attr_jsonb);
                        if (jsonAttr && jsonAttr.modelId && jsonAttr.modelId == modelId) this.set('updatePossible',true);
                        else this.set('updatePossible',false);
                    }
                });
            }
        },
        logActive:function(logText,level){
            if(!level){
                this.set('activeLog0',logText);
                this.set('activeLog1',"");
            } else if (level == 1){
                this.set('activeLog1',"\n" + logText);
            }
        },
        logArchive:function(logText){
            this.set('activeLog0',"");
            this.set('activeLog1',"");
            this.set('archiveLog',this.get('archiveLog') + logText + "\n");
        },
        logError:function(logText){
            this.set('errorLog',this.get('errorLog') + logText + "\n");
        },
        logProgress:function(part){
            this.set('progress',part);
        },


        //Parse Products: first start Parsing (send all products at once), then complement database ids

        startParseProducts:function(modelToTransform){

            var products = modelToTransform.products;
            var requestData = {
                id: 1,
                method:"/jsonrpc/template_from_model/createProducts",
                params:{"products":products}
            };
            this.logArchive("Started parsing of model...");
            this.logActive("Creating/Updating products...");
            this.startPOSTRequest(
                requestData,
                function(result,parseObj){
                    parseObj.addProductDbId(result);
                    parseObj.logArchive("Created/Updated all products.");
                    parseObj.startParseSUCs(modelToTransform);
                },
                function(errText,parseObj){
                    parseObj.logError(errText);
                    console.error(errText);
                    parseObj.startParseSUCs(modelToTransform);
                },
                this
            );
        },
        addProductDbId:function(idObj){
            let model = this.get('model');
            model.nodes.filter(n => n.ports.length).forEach(n => {
                n.ports.filter(p => p.material.modelId == idObj.model_id).forEach(p=>{
                    p.material.dbId = idObj.db_id;
                });
            });
            model.flows.filter(f => f.product.modelId == idObj.model_id).forEach(f => {
                f.dbId = idObj.db_id;
            });
        }, 


        //Parse SUCs: first start the transfer by putting all SUCs into parseQueue and calling paresSUC, then call parseSUC recursively.

        startParseSUCs:function(modelToTransform){
            this.set('totalNumber',modelToTransform.sucLib.length);
            this.set('counter', 0);

            if (!modelToTransform.sucLib || !modelToTransform.sucLib.length) {
                this.logArchive("No System Unit Classes found...");
                return;
            }

            this.set('parseQueue', modelToTransform.sucLib.filter(s=>(!s.parent.modelId)));
            this.parseSUCs();
        },
        parseSUCs:function(){
            if(this.get('counter')<this.get('totalNumber')) {
                console.log("Uploading SUC ["+(this.get('counter')+1)+"/"+this.get('totalNumber')+"]...");
                this.logActive("Uploading SUC ["+(this.get('counter')+1)+"/"+this.get('totalNumber')+"]...");
                let actSUC = this.get('parseQueue').shift();
                this.set('counter',this.get('counter')+1);
                if (actSUC) this.startSUCRequest(actSUC);
            }
            else {
                console.log("Parsed all SUCs.["+(this.get('counter'))+"/"+this.get('totalNumber')+"].");
                this.logArchive("Parsed all SUCs ["+(this.get('counter'))+"/"+this.get('totalNumber')+"].");
                this.startParseNodes(this.get('model'));
            }
        },
        startSUCRequest:function(actSUC){
            //start Upload, upload's return starts the upload of child objects and returns the (new) database-ID
            let parseObj = this;
            console.debug("SUC after call:");
            console.debug(actSUC);
            var requestData = {
                id: 1,
                method:"/jsonrpc/template_from_model/createSUC",
                params:actSUC
            }
            
            //Building XMLHttpRequest for Uploading Nodes
            this.startPOSTRequest(
                requestData,
                function(result,parseObj){
                    parseObj.addSUCDbId(result,parseObj);
                    parseObj.parseSUCs();
                },
                function(errText){
                    console.error(errText);
                    parseObj.logError("Error uploading SUCs");
                    parseObj.parseSUCs();
                },
                parseObj
            );
            this.get('model').sucLib.filter(s=>(s.parent.modelId == actSUC.modelId)).forEach(s=>this.get('parseQueue').push(s));
        },
        addSUCDbId(idObj,parseObj){
            console.debug("addSUCDbId: ");
            console.debug(idObj);
            let model = parseObj.get('model');
            console.debug(model);
            console.debug("To SUC: ");
            let suc = model.sucLib.find(s => s.modelId == idObj.model_id);
            console.debug(suc);
            suc.dbId = idObj.db_id;
            console.debug(suc);
            console.debug("To nodes: ");
            model.nodes.filter(n => n.implementedSUC.modelId == idObj.model_id).forEach(n => {
                console.debug(n);
                n.implementedSUC.dbId = idObj.db_id;
                console.debug(n);
            });
            console.debug("To child SUCs: ");
            model.sucLib.filter(s => s.parent.modelId == idObj.model_id).forEach(s => {
                console.debug(s);
                s.parent.dbId = idObj.db_id;
                console.debug(s);
            });
            model.sucLib.find(s => s.modelId == idObj.model_id).dbId = idObj.db_id;
        },


        //parse Nodes: first get the root node and put it into the parseQueue. Afterwards recursively call parseNode and put the child nodes to the array.

        startParseNodes:function(modelToTransform){
            this.set('totalNumber',modelToTransform.nodes.length);
            this.set('counter', 0);
            this.set('parseQueue', new Array());

            var checkedNode = this.get('parentView.parameters.node.value');
            //Add actual chosen Node for this namespace as parent. If null choose legato root node.

            //Todo: Update Root Class, actual constraint: root node is always on array position 0
            let actNode = modelToTransform.nodes[this.get('parentView.parameters.modelRootNum.value')];
            actNode.parent.modelId = null;
            var self = this;
            var nodeId = (checkedNode) ?checkedNode:1;
            if (this.get('createNew')==true)  {
                //If create-Button is pressed, the node should be created as a new, unique child of the chosen Node
                //Get chosen node-id, set as parent
                if (!nodeId) actNode.parent.dbId = 1;
                else  actNode.parent.dbId = nodeId;
                //Query: get sister Nodes, check if name is unique
                this.get('server').getRecords('l_nodes', {
                    filter: [ { field: 'parent', op: 'eq', val: nodeId} ] },
                    undefined)
                .then(result => {
                    if(result.content.length>0){
                        var sisters = result.content;
                        var isUnique = false;
                        var name = actNode.name;
                        var num = 1;
                        while (!isUnique) {
                            if (!sisters.find(s => (s.name == name))) isUnique = true;
                            else name = actNode.name + "_" + num++;
                        }
                        actNode.name = name;
                    }
                    self.get('parseQueue').push(actNode);
                    self.parseNodes();
                });
            } else {
                //if update-Button is pressed, the chosen node is updated. Therefore, the parent is looked up in the database to get the unique template instance id.
                //Query: get parent Node
                this.get('server').getRecords('l_nodes', {
                    filter: [ { field: 'id', op: 'eq', val: nodeId} ] },
                    undefined)
                .then(result => {
                    if(result.content.length>0){
                        var parent = result.content[0].parent;
                        actNode.parent.dbId = parent ? parent : 1;
                        self.get('parseQueue').push(actNode);
                        self.parseNodes();
                    } else self.logError("Node not found in Database. Choose node to update")
                });
            }
        },
        parseNodes:function(){
            if(this.get('counter')<this.get('totalNumber')) {
                console.log("Uploading Node ["+(this.get('counter')+1)+"/"+this.get('totalNumber')+"]");
                this.logActive("Uploading Node ["+(this.get('counter')+1)+"/"+this.get('totalNumber')+"]");
                let actNode = this.get('parseQueue').shift();
                let childNodes = this.startNodeRequest(this.get('model'),actNode,this);
                childNodes.forEach(cn=>this.get('parseQueue').push(cn));
                this.set('counter',this.get('counter')+1);
            }
            else {
                console.log("Parsed all nodes. ["+(this.get('counter'))+"/"+this.get('totalNumber')+"]");
                this.logArchive("Parsed all nodes ["+(this.get('counter'))+"/"+this.get('totalNumber')+"]");
                this.startParseFlows(this.get('model'));
            } 
        },
        startNodeRequest:function(model,actNode,parseObj){
            //start Upload, upload's return starts the upload of child objects and returns the (new) database-ID
            
            console.debug("actNode after call:");
            console.debug(actNode);
            var requestData = {
                id: 1,
                method:"/jsonrpc/template_from_model/createNode",
                params:actNode
            }
            //Building XMLHttpRequest for Uploading Nodes
            this.startPOSTRequest(
                requestData,
                function(result,parseObj){
                    parseObj.addNodeDbId(result);
                    parseObj.parseNodes();
                },
                function(errText){
                    console.error(errText);
                },
                parseObj
            );
            console.debug(model.nodes.filter(n => n.parent.modelId === actNode.modelId));
            return model.nodes.filter(c => c.parent.modelId === actNode.modelId);
        },
        addNodeDbId:function(idObj){
            //Find the class, the idObj is from
            let model = this.get('model');
            let thisClass = model.nodes.find(o => o.modelId === idObj.model_id);
            //add database id
            if (idObj.db_id) thisClass.dbId = idObj.db_id;
            if (idObj.gw_node_id) thisClass.gwNodeId = idObj.gw_node_id;
            if (idObj.opc_ua_level!=null) thisClass.opcUALevel = idObj.opc_ua_level;
            if (idObj.opc_ua_ns_name) thisClass.opcUANamespaceName = idObj.opc_ua_ns_name;
            if (idObj.opc_ua_ns_prefix) thisClass.opcUANamespacePrefix = idObj.opc_ua_ns_prefix;

            //add database id and valuePrefix to all child classes
            model.nodes.filter(c => c.parent.modelId === idObj.model_id).forEach(c => {
                c.parent.dbId = thisClass.dbId;
                if (idObj.value_prefix) c.valPrefix = idObj.value_prefix + c.name + ".";
                if (idObj.connection) c.connection = idObj.connection;
                if (idObj.opc_ua_level!=null) c.opcUALevel = idObj.opc_ua_level + 1;
                if (idObj.opc_ua_ns_name) c.opcUANamespaceName = idObj.opc_ua_ns_name;
                if (idObj.opc_ua_ns_prefix) c.opcUANamespacePrefix = idObj.opc_ua_ns_prefix;
            });

            //find child properties
            thisClass.properties.forEach(p => {
                //add database id as parentNode.dbId to child properties
                p.parentNode.dbId = thisClass.dbId;
                //add the child properties' database ids and relation ids
                if (p.appliedStereotypes.find((str => str == "SfmPrf:VarScope"))){
                    var valId = idObj.values.find(v => v.model_id == p.modelId);
                    if (valId&&valId.db_id) p.dbId = valId.db_id;
                    if (valId&&valId.relation_id) p.parentNode.relationId = valId.relation_id;
                }
                if (p.appliedStereotypes.find((str => str == "SfmPrf:MsgScope"))){
                    var msgId = idObj.alarms.find(m => m.model_id == p.modelId);
                    if (msgId&&msgId.db_id) p.dbId = msgId.db_id;
                }
            });
            thisClass.ports.forEach(p =>{
                p.parentNode.dbId = thisClass.dbId;
                var portId = idObj.ports.find(pp => pp.model_id == p.modelId);
                if (portId&&portId.db_id) p.dbId = portId.db_id;
                
                //Add portDbId to all referencing flows
                model.flows.filter(f => f.port0.modelId == p.modelId).forEach(f=>{
                    f.port0.dbId = p.dbId;
                });
                model.flows.filter(f => f.port1.modelId == p.modelId).forEach(f=>{
                    f.port1.dbId = p.dbId;
                });
            });
            model.flows.filter(f => f.node0.modelId == thisClass.modelId).forEach(f=>{
                f.node0.dbId = idObj.db_id;
            });
            model.flows.filter(f => f.node1.modelId == thisClass.modelId).forEach(f=>{
                f.node1.dbId = idObj.db_id;
            });
            
            //Todo: Do the same for this.model.productFlows.port0&port1
            console.debug(model);
        },
        startPOSTRequest:function(requestData,cbSuccess,cbError,parseObj){
            var request = new XMLHttpRequest();
            console.debug(requestData);
            request.parseObj = parseObj;
            request.cbSuccess = cbSuccess;
            request.cbError = cbError;
            request.onreadystatechange = function(){
                    console.debug(this);
                    switch (this.readyState) {
                        case 1:
                            break;
                        case 2:
                            break;
                        case 3:
                            break;
                        case 4:
                            if (this.status == 200) {
                                let response = JSON.parse(this.response);
                                console.debug(response);
                                if (!response.result) {
                                    console.error(response.error);
                                    parseObj.logError("Error sending data...");
                                }
                                else if (response.result.error) {
                                    parseObj.logError(response.result.error);
                                    if(response.result.errorObj&&response.result.errorObj.message) parseObj.logError(response.result.errorObj.message);
                                }
                                else this.cbSuccess(response.result,parseObj);
                            } else {
                                this.cbError(this.statusText,parseObj);
                            }
                            break;
                    }
            };
            var url = String(document.URL).replace(/(.*:\/\/[^\/]+\/)(?:.+)/, '$1call/');
            request.open("POST", url, true);
            request.setRequestHeader("Content-type", "application/json;charset=UTF-8");
            requestData.jsonrpc = "2.0";
            request.send(JSON.stringify(requestData));
            delete requestData.jsonrpc;
        },
        startParseFlows:function(modelToTransform){
            var flows = modelToTransform.flows;
            var requestData = {
                id: 1,
                method:"/jsonrpc/template_from_model/createFlows",
                params:{"flows":flows}
            };
            this.logActive("Creating/Updating product flows...");
            this.startPOSTRequest(
                requestData,
                function(result,parseObj){
                    parseObj.addProductDbId(result);
                    parseObj.logArchive("Created/Updated product flows.");
                    parseObj.logArchive("Finished parsing of model to database.");
                },
                function(errText,parseObj){
                    parseObj.logError(errText);
                    console.error(errText);
                },
                this
            );
        },                   
        actions : {
            startUpload:function(create,event){
                //Todo: Wrap in model
                this.set('createNew',create);
                if (!this.get('model')) { 
                    this.get('toastService').showWarningToast({title: "No model loaded!", boardlet:"Model transformation boardlet",showDuration: false, duration: 1000});
                    return;
                }
                let jsonObject = this.get('model');

                if (!jsonObject.nodes||!jsonObject.nodes[0]) { 
                    this.get('toastService').showWarningToast({title: "No node-classes in model!", boardlet:"Model transformation boardlet",showDuration: false, duration: 1000});
                    return;
                } else if (this.get('parentView.parameters.gateway.value')) {
                    jsonObject.nodes.filter(n=>n.opcUAServer).forEach(n=>{
                        n.opcUAServer.gateway.dbId = this.get('parentView.parameters.gateway.value');
                    });
                }
                //Building XMLHttpRequest for Uploading Nodes
                this.startParseProducts(jsonObject);
            }
        }
    });

    component.reopenClass({
        parameters: {
            jsonModel: {
                displayKey: 'parameters.jsonModel',
                value: null,
                parameterType: 'Object',
                context: ParameterContext.InOut,
                category: 'settings'
            },
    
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