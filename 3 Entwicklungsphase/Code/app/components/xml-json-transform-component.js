import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';

/**
 * @author: Markus Male
 * @description: Component to be used for uploading xml-files and transforming them to json via a stylesheet.
 * Should be used as follows:
 *      {{xml-json-transform-component 
 *              onModelLoad=(action 'functionToBeCalledWhenBothFilesAreLoaded' 'objectToSaveJSONObjectIn')}}
 * @param onModelLoad (action 'functionToBeCalledWhenBothFilesAreLoaded' 'objectToSaveJSONObjectIn')
 *      @param functionToBeCalledWhenBothFilesAreLoaded Action owned by parent view which is to be called when both the files are loaded. Should accept function(objHash,response)
 *          @param objHash = objectToSaveJSONObjectIn
 *          @param response = response given by action this.loadSuccess
 */

var component = SapientComponent.extend(Evented,{
        classNames: ['xml-json-transform-component'],
        classNameBindings: ['inBar:component', 'inBar:xml-json-transform-component'],
        toastMessagesService: service('toast-messages-service'),
        styleObject:null,
        modelObject:null,
        jsonString:null,
        jsonObject:null,
        init(){
            this._super(...arguments);
            this.set('jsonObject', null);
            this.set('jsonString', "");
        },
        startTransformation: function(){
            /**
             * Function starts the transformation form .uml-file modelObject to jsonObject via .xslt-stylesheet styleObject.
             */
            this.set('loading',true);
            console.log("Both files loaded, transformation started...");
            let jsonText;
            let toastDismissFunction = this.get("toastMessagesService").showLoadingToast({title: "UML-file is getting transformed " + this.get('modelObject').name, boardlet:"Model input boardlet",
                callback: (success) => {
                    if (!success) {
                        this.get("toastMessagesService").showFailedToast({title: "XML-transformation failed!"});
                    }
                }
            });
            try{
                //TODO: Find a way to do the transformation without browser specific components
                let processor = new XSLTProcessor;
                processor.importStylesheet(this.get('styleObject'));
                let xmlFileInput = this.get('modelObject');
                let jsonFileOutput = processor.transformToDocument(xmlFileInput);
                jsonText = jsonFileOutput.getElementsByTagName("transformiix:result")[0].childNodes[0].nodeValue;
                toastDismissFunction(true);
            } catch(error){
                toastDismissFunction(false);
                console.error("Error during XSL-Transformation: ");
                console.error(error);
                return;
            }
            let toastDismissFunction2 = this.get("toastMessagesService").showLoadingToast({title: "JSON-Objekt is built...", boardlet:"Model input boardlet",
                callback: (success) => {
                    if (success) {
                        this.get("toastMessagesService").showSuccessToast({title: "Model fully loaded!", showDuration: false, duration: 1000});
                    } else {
                        this.get("toastMessagesService").showFailedToast({title: "JSON-Parse failed!"});
                    }
                }
            });
            try{
                this.set('jsonString',jsonText);
                var jsonData = JSON.parse(jsonText);
                this.set('jsonObject',jsonData);
                console.log("JSON-object successfully saved!");
                console.log(this.get('jsonObject'));
                toastDismissFunction2(true);
                this.get('onModelLoad') && this.get('onModelLoad')(jsonData);
            } catch(error) {
                toastDismissFunction2(false);
                console.error("Error during JSON-Parse: ");
                console.error(error);
            }
        },
        actions : {
            loadSuccess: function(objHash,response){
                /**
                 * Function loadSuccess is called from xml-load-components. In .hbs the objectHash is handed over to the function
                 * @param objHash The object the xml-file object is to be saved in. Handed over in .hbs
                 * @param response The xml-file object returned by xml-load-component
                 */
                this.set(objHash,response);
                if(this.get('styleObject')&&this.get('modelObject')) this.startTransformation();
            },
            loadError: function(objHash,err){
                this.set(objHash,null);
                this.set('jsonString',null);
                this.set('jsonObject',null);
                this.get('onModelLoad') && this.get('onModelLoad')(null);
                console.log("Error during File Upload:");
                console.log(err);
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
            }
        }
    });

export default component;
