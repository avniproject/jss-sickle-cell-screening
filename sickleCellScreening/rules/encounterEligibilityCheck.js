import {EncounterEligibilityCheck} from 'rules-config/rules';

@EncounterEligibilityCheck({
    name: 'FollowupEligibility',
    uuid: '4300a9e5-b96b-44ad-8147-d21d090cfa8e',
    encounterTypeUUID: 'e6ee694a-d70f-413c-b0f7-3520e7cdb6af',
    executionOrder: 100.0,
    metadata: {}
})
class FollowupEligibility {
    static exec({individual}) {
        const visitCount = individual.enrolments[0].encounters.filter(e => e.encounterType.uuid === 'fc3d6184-920b-42aa-8c83-379401241fea').length;

        let visibility = false;
        if (visitCount >= 1)
            visibility = true;

        return visibility;
    }
}

export {
    FollowupEligibility
};