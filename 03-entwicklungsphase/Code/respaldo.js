import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';



var component = SapientComponent.extend(Evented, {
    classNames: ['create-pid-component'],
    classNameBindings: ['inBar:component', 'inBar:create-pid-component'],
    toastMessagesService: service('toast-messages-service'),
    pidInstancesObject: null,
    pidShapesLibraryObject: null,
    jsonString: null,
    jsonObject: null,
    init() {
        this._super(...arguments);
        this.set('jsonObject', null);
        this.set('jsonString', "");
    },
    actions: {
        loadSuccess: function(object, response) {
            console.log("Response added to object...");
            this.set(object, response);

            var pidShapesLibraryObject;
            var pidInstancesObject;
            let file1Present;
            let file2Present;
            let jsonObject = this.get(object);

            console.log(jsonObject.get('name'));
            if (jsonObject.get('name') === "pid-shapes-library") {
                console.log("pid-shapes-library file uploaded");
                pidShapesLibraryObject = jsonObject;
                console.log("pidShapesLibraryObject =\n");
                console.table(pidShapesLibraryObject);
                file1Present = true;
            } else if (jsonObject.get('name') === "cmodule-instances") {
                console.log("cmodule-instances file uploaded");
                pidInstancesObject = jsonObject;
                console.log("pidInstancesObject =\n");
                console.table(pidInstancesObject);
                file2Present = true;
            }

            if (file1Present && file2Present) {
                // removes sapient disabled class for success-button
                document.getElementById("generate-pid-button").className = "button button-success";

            };

            pidShapesLibraryObject = this.get(object);
            console.log("pidShapesLibraryObject =\n");
            console.table(pidShapesLibraryObject);

            // removes sapient disabled class for success-button
            document.getElementById("generate-pid-button").className = "button button-success";

        },
        loadError: function(err) {
            console.log("Error during File Upload...\n");
            console.log(err);
        },

        generatePidXml: function(pidShapesLibraryObject, pidInstancesObject) {
            this.set('loading', true);
            console.log("XML Generation started...");
            console.table(pidShapesLibraryObject);
            console.table(pidInstancesObject);

            mapInstancesToShapes(pidShapesLibraryObject, pidInstancesObject);
        },

        mapInstancesToShapes: function() {

        }
    }
});

export default component;