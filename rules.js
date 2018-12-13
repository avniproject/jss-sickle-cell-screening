const moment = require("moment");
const _ = require("lodash");
import {
    RuleFactory,
    FormElementsStatusHelper,
    FormElementStatusBuilder,
    StatusBuilderAnnotationFactory,
    FormElementStatus,
    VisitScheduleBuilder,
    ProgramRule
} from 'rules-config/rules';

const ScreeningViewFilter = RuleFactory("0723fd75-dc66-4aae-a3c9-31a09c9c4c7a", "ViewFilter");

const WithStatusBuilder = StatusBuilderAnnotationFactory('programEncounter', 'formElement');

const ScreeningVisitRule = RuleFactory("0723fd75-dc66-4aae-a3c9-31a09c9c4c7a", "VisitSchedule");

@ScreeningViewFilter("78aaf13f-04f2-47cc-b4da-914f204793a9", "JSS Sickle Cell Screening Encounter View Filter", 100.0, {})
class SickleCellScreeningHandlerJSS {
    static exec(programEncounter, formElementGroup, today) {
        return FormElementsStatusHelper
            .getFormElementsStatusesWithoutDefaults(new SickleCellScreeningHandlerJSS(), programEncounter, formElementGroup, today);
    }

    sickleCellScreeningHistory(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().when.valueInEnrolment("Whether SC confirmatory report available").is.not.defined;
            return statusBuilder.build();
        });
    }

    labTestResults(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().when.latestValueInPreviousEncounters("Sample number").is.defined;
            return statusBuilder.build();
        });
    }

    @WithStatusBuilder
    scConfirmatoryReportAvailable([], statusBuilder) {
        statusBuilder.show().when.valueInEnrolment("Whether SC confirmatory report available").is.not.defined;
    }

    @WithStatusBuilder
    hemoglobinGenotypeFromOldReport([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.yes;
    }

    @WithStatusBuilder
    whetherElectrophoresisResultAvailable([], statusBuilder) {
        console.log("came to whetherElectrophoresisResultAvailable");
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no;
    }

    @WithStatusBuilder
    btCheckReason([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no;
    }

    @WithStatusBuilder
    btDoneInLast3Months([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no;
    }

    @WithStatusBuilder
    btDate([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.yes;
    }

    @WithStatusBuilder
    collectSampleForHbSolubilityAndElectrophoresis([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.no;
    }

    @WithStatusBuilder
    btCheckFailedRevisitInstruction([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.yes
            .and.valueInEncounter("BT date").is.defined;
    }

    fieldTestResults(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.no
                .and.latestValueInPreviousEncounters("Whether prep and/or solubility result from field available").is.defined;
            return statusBuilder.build();
        });
    }


    @WithStatusBuilder
    isSolubilityResultAvailableFromField([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.no;
    }

    @WithStatusBuilder
    solubilityResultFromField([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether prep and/or solubility result from field available").is.yes;
    }

    @WithStatusBuilder
    electrophoresisResult([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no
            .and.valueInEncounter("Whether BT done in last 3 months").is.no;
    }
    
    @WithStatusBuilder
    hplcResult([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no
            .and.valueInEncounter("Whether BT done in last 3 months").is.no;
    }

    sampleCollectionShipmentDetails(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no
                .and.valueInEncounter("Whether BT done in last 3 months").is.no
                .and.not.valueInEncounter("Solubility result").containsAnswerConceptName("Negative");
            return statusBuilder.build();
        });
    }

    @WithStatusBuilder
    hb([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.yes;
    }

    @WithStatusBuilder
    bloodGroup([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.yes;
    }
}

@ProgramRule({
    name: "Sickle cell screening program summary",
    uuid: "7fed3ab2-1a5e-4667-a7bf-e8d9ed66e615",
    programUUID: "e93303fa-f465-4db7-a945-d4fd6295f2b9",
    executionOrder: 100.0,
    metadata: {}
})
class SickleCellScreeningProgramRuleJSS {
    static exec(programEnrolment, summaries, context, today) {
        const hb = programEnrolment.findObservationInEntireEnrolment('Hb');
        if (!_.isNil(hb)) {
            summaries.push({name: 'Hb', value: hb.getValue()});
        }
        const bloodGroup = programEnrolment.findObservationInEntireEnrolment('Blood group');
        if (!_.isNil(bloodGroup)) {
            summaries.push({name: 'Blood group', value: bloodGroup.getValue()});
        }
        const genotype = programEnrolment.findObservationInEntireEnrolment('Hemoglobin genotype');
        if (!_.isNil(genotype)) {
            summaries.push({name: 'Hemoglobin genotype', value: genotype.getValue()});
        }
    }
}

module.exports = {SickleCellScreeningHandlerJSS, SickleCellScreeningProgramRuleJSS};

