import {
    RuleFactory,
    FormElementsStatusHelper,
    FormElementStatusBuilder,
    StatusBuilderAnnotationFactory,
    FormElementStatus,
    VisitScheduleBuilder,
    ProgramRule,
    RuleCondition
} from 'rules-config/rules';


const WithRegistrationStatusBuilder = StatusBuilderAnnotationFactory('individual', 'formElement');
const RegistrationViewFilter = RuleFactory("d8e956f9-c34b-4e38-a50a-786d4ab08737", "ViewFilter");


@RegistrationViewFilter("4a329f64-e131-4946-9b94-d2f988cc45be", "JSS Sickle Cell Screening Registration View Filter", 100.0, {})
class SickleCellRegistrationViewHandlerJSS {
    static exec(individual, formElementGroup) {
        return FormElementsStatusHelper
            .getFormElementsStatusesWithoutDefaults(new SickleCellRegistrationViewHandlerJSS(), individual, formElementGroup);
    }

    @WithRegistrationStatusBuilder
    otherVillage([], statusBuilder) {
        statusBuilder.show().whenItem(_.startsWith(statusBuilder.context.individual.lowestAddressLevel.name, "Other")).is.truthy;
    }

    isThisRegistrationForPregnantWoman(individual, formElement) {
        // if(individual.isMale()){
        //     return new FormElementStatus(formElement.uuid, true, "e7b50c78-3d90-484d-a224-9887887780dc");
        // }
        return new FormElementStatus(formElement.uuid, true);
    }

}

module.exports = {SickleCellRegistrationViewHandlerJSS};

