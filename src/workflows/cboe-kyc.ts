import { executeChild, proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities";
import { collectSignature } from "./signatures";

export interface CboeKycInput {}

export interface CboeKycOutput {}

const { getMuinmosAssessment } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

function getResponseFromAssessmentByQuestion(assessment: any, question: string): string | undefined {
  const { detailedResponses } = assessment
  for (const detailedResponse of detailedResponses) {
    const { responses: responses1 } = detailedResponse
    for (const response1 of responses1) {
      if (response1.question !== question) {
        continue
      }
      const { responses: responses2 } = response1
      for (const response2 of responses2) {
        return response2.response
      }
    }
  }
  return
}

function getResponseFromAssessmentByTags(assessment: any, tags: string[]): string | undefined {
  const { detailedResponses } = assessment
  for (const detailedResponse of detailedResponses) {
    const { responses: responses1 } = detailedResponse
    for (const response1 of responses1) {
      const { responses: responses2 } = response1
      for (const response2 of responses2) {
        if (!tags.every(ourTag => !!response2.tags.find((thisTag: { name: string }) => ourTag === thisTag.name))) {
          continue
        }
        return response2.response
      }
    }
  }
  return
}

export async function cboeKyc(input: CboeKycInput): Promise<CboeKycOutput> {
  const assessmentId = 'e53beee2-10b0-48e7-bef8-28734b698fb5'
  const assessment = await getMuinmosAssessment({ assessmentId })
  const firstName = getResponseFromAssessmentByTags(assessment, ['FirstName'])
  const middleName = getResponseFromAssessmentByTags(assessment, ['MiddleName'])
  const lastName = getResponseFromAssessmentByTags(assessment, ['LastName'])
  const fullName = [firstName, middleName, lastName].filter(name => !!name).join(' ')
  const houseNumber = getResponseFromAssessmentByTags(assessment, ['Address', 'HouseNumber'])
  const streetName = getResponseFromAssessmentByTags(assessment, ['Address', 'StreetName'])
  const town = getResponseFromAssessmentByTags(assessment, ['Address', 'Town'])
  const state = getResponseFromAssessmentByTags(assessment, ['Address', 'State'])
  const postalCode = getResponseFromAssessmentByTags(assessment, ['Address', 'PostalCode'])
  const country = getResponseFromAssessmentByTags(assessment, ['Address', 'Country'])
  const phoneNumber = getResponseFromAssessmentByQuestion(assessment, 'Phone number including dial-in code e.g. +44')

  
  await executeChild(collectSignature, {
    args: [
      {
        templateId: "f363283e-d014-47ed-82bd-da943c1005c5",
        recipients: [
          {
            role: "Investor",
            name: fullName,
            email: "simon.stone@globacap.com",
          },
        ],
        fields: [
          {
            key: 'address', value: `${houseNumber}, ${streetName}`
          },
          {
            key: 'cityStateAndZip', value: `${town}, ${state}, ${postalCode}`
          },
          {
            key: 'country',
            value: country!
          },
          {
            key: 'phone',
            value: phoneNumber!
          },
          {
            key: 'citizenship',
            value: 'British' // TODO
          },
          {
            key: 'status',
            value: 'netWorthOver1mil' // TODO
          }
        ]
      },
    ],
  });
  return {};
}
