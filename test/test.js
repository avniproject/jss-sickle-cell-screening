import {SickleCellScreeningHandlerJSS} from "../rules";
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
import screeningForm from '../sickleCellScreening/screeningForm.json';
import screeningConcepts from '../sickleCellScreening/screeningConcepts';
import EnrolmentFiller from "openchs-models/test/ref/EnrolmentFiller";
import EncounterFiller from "openchs-models/test/ref/EncounterFiller";
import ProgramFactory from "openchs-models/test/ref/ProgramFactory";
import programs
    from "../programs";
import commonConcepts from "openchs-health-modules/health_modules/commonConcepts";
import enrolmentForm
    from "../sickleCellScreening/sickleCellScreeningProgramEnrolmentNullForm";
import IndividualBuilder from "openchs-models/test/ref/IndividualBuilder";

function findElement(formElementGroup, elementName) {
    return formElementGroup.getFormElements().find(el => el.matches(elementName));
}

describe('sickleCellScreeningForm', () => {
    let programData, enrolment, individual, handler, screeningHistory, bloodTransfusionCheck, encounterFiller;
    let sickleCellProgram = programs[0];

    beforeEach(() => {
        programData = new ProgramFactory(sickleCellProgram)
            .withConcepts(commonConcepts)
            .withConcepts(screeningConcepts)
            .withEnrolmentform(enrolmentForm)
            .withEncounterForm(screeningForm)
            .build();
        individual = new IndividualBuilder(programData)
            .withName("Test", "Mother")
            .withAge(25)
            .withGender("Female")
            .withSingleCodedObservation("Blood group", "B+")
            .build();
        enrolment = new EnrolmentFiller(programData, individual, new Date())
            .build();
        encounterFiller = new EncounterFiller(programData, enrolment, "ANC", new Date());

        handler = new SickleCellScreeningHandlerJSS();
        screeningHistory = programData.forms[1].getFormElementGroups()
            .find(feg => feg.name === "Sickle cell screening history");
        bloodTransfusionCheck = programData.forms[1].getFormElementGroups()
            .find(feg => feg.name === "Blood Transfusion Check");
    });

    test('hemoglobinGenotypeFromOldReport is not visible when scConfirmatoryReportAvailable is No', () => {

        let encounter = encounterFiller.forSingleCoded("Whether SC confirmatory report available", "No").build();
        let element = findElement(screeningHistory, "Hemoglobin genotype from old report");
        let formElementStatus = handler.hemoglobinGenotypeFromOldReport(encounter, element);
        expect(formElementStatus.visibility).toBeFalsy();

    });

    test('collectSampleForHbSolubilityAndElectrophoresis is visible when btDoneInLast3Months is no', () => {

        let encounter = encounterFiller.forSingleCoded("Whether BT done in last 3 months", "No").build();
        let element = findElement(bloodTransfusionCheck, "Collect sample for hb solubility and electrophoresis");
        let formElementStatus = handler.collectSampleForHbSolubilityAndElectrophoresis(encounter, element);
        expect(formElementStatus.visibility).toBeTruthy();

    });

    test(`btDoneInLast3Months is visible when scConfirmatoryReportAvailable is No 
        and last btDoneInLast3Months is yes`, () => {

        let encounter = encounterFiller
            .forSingleCoded("Whether SC confirmatory report available", "No")
            .forSingleCoded("Whether BT done in last 3 months", "Yes")
            .build();
        let element = findElement(bloodTransfusionCheck, "BT done in last 3 months?");
        let visibility = handler.btDoneInLast3Months(encounter, element).visibility;
        expect(visibility).toBeTruthy();
    });
});

